create extension if not exists pgcrypto;

create type public.difficulty_level as enum ('Junior', 'Mid', 'Senior');
create type public.content_locale as enum ('ar', 'en');
create type public.revision_status as enum ('draft', 'published', 'rejected');
create type public.submission_status as enum ('pending', 'in_review', 'accepted', 'rejected');

create or replace function public.valid_sources(value jsonb)
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(value) = 'array'
    and jsonb_array_length(value) > 0
    and not exists (
      select 1
      from jsonb_array_elements(value) source
      where jsonb_typeof(source) <> 'object'
        or length(btrim(coalesce(source ->> 'title', ''))) = 0
        or coalesce(source ->> 'url', '') not like 'https://%'
    );
$$;

create table public.tracks (
  id text primary key,
  slug text not null unique,
  created_at timestamptz not null default now(),
  constraint tracks_id_format check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint tracks_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.track_locales (
  track_id text not null references public.tracks(id) on delete cascade,
  locale public.content_locale not null,
  name text not null check (length(btrim(name)) > 0),
  primary key (track_id, locale)
);

create table public.topics (
  id text primary key,
  slug text not null unique,
  track_id text not null references public.tracks(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint topics_id_format check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint topics_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.topic_locales (
  topic_id text not null references public.topics(id) on delete cascade,
  locale public.content_locale not null,
  name text not null check (length(btrim(name)) > 0),
  primary key (topic_id, locale)
);

create table public.interview_questions (
  id text primary key,
  slug text not null unique,
  track_id text not null references public.tracks(id) on delete restrict,
  difficulty public.difficulty_level not null,
  published_revision_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interview_questions_id_format check (id ~ '^[a-z0-9]+-[0-9]{3}$'),
  constraint interview_questions_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.question_revisions (
  id uuid primary key default gen_random_uuid(),
  question_id text not null references public.interview_questions(id) on delete restrict,
  revision_number integer not null check (revision_number > 0),
  status public.revision_status not null default 'draft',
  reviewed_at date,
  published_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  unique (question_id, revision_number),
  unique (question_id, id)
);

alter table public.interview_questions
  add constraint interview_questions_published_revision_fk
  foreign key (id, published_revision_id)
  references public.question_revisions (question_id, id)
  deferrable initially deferred;

create table public.question_revision_locales (
  revision_id uuid not null references public.question_revisions(id) on delete restrict,
  locale public.content_locale not null,
  question text not null check (length(btrim(question)) > 0),
  short_answer text not null check (length(btrim(short_answer)) > 0),
  explanation text not null check (length(btrim(explanation)) > 0),
  code_example text,
  common_mistakes jsonb not null default '[]'::jsonb,
  follow_up_questions jsonb not null default '[]'::jsonb,
  sources jsonb not null,
  primary key (revision_id, locale),
  constraint question_revision_locales_mistakes_array check (jsonb_typeof(common_mistakes) = 'array'),
  constraint question_revision_locales_followups_array check (jsonb_typeof(follow_up_questions) = 'array'),
  constraint question_revision_locales_sources_array check (public.valid_sources(sources))
);

create table public.question_topics (
  question_id text not null references public.interview_questions(id) on delete cascade,
  topic_id text not null references public.topics(id) on delete restrict,
  primary key (question_id, topic_id)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by text not null,
  status public.submission_status not null default 'pending',
  track_id text not null references public.tracks(id) on delete restrict,
  topic_ids jsonb not null,
  difficulty public.difficulty_level not null,
  payload jsonb not null,
  review_notes text,
  github_issue_number integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submissions_topic_ids_array check (jsonb_typeof(topic_ids) = 'array' and jsonb_array_length(topic_ids) > 0),
  constraint submissions_payload_object check (jsonb_typeof(payload) = 'object')
);

create index question_revisions_question_status_idx on public.question_revisions (question_id, status);
create index question_revision_locales_locale_idx on public.question_revision_locales (locale);
create index question_topics_topic_idx on public.question_topics (topic_id);
create index submissions_owner_idx on public.submissions (submitted_by, created_at desc);
create index submissions_status_idx on public.submissions (status, created_at desc);

create or replace function public.current_clerk_user_id()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'sub', '');
$$;

create or replace function public.is_moderator()
returns boolean
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role' in ('moderator', 'admin')
    or auth.jwt() -> 'metadata' ->> 'role' in ('moderator', 'admin'),
    false
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger interview_questions_touch_updated_at
before update on public.interview_questions
for each row execute function public.touch_updated_at();

create trigger submissions_touch_updated_at
before update on public.submissions
for each row execute function public.touch_updated_at();

create or replace function public.validate_question_topic_track()
returns trigger
language plpgsql
as $$
declare
  question_track text;
  topic_track text;
begin
  select track_id into question_track from public.interview_questions where id = new.question_id;
  select track_id into topic_track from public.topics where id = new.topic_id;
  if question_track is null or topic_track is null or question_track <> topic_track then
    raise exception 'Question and Topic must belong to the same Track';
  end if;
  return new;
end;
$$;

create trigger question_topics_same_track
before insert or update on public.question_topics
for each row execute function public.validate_question_topic_track();

create or replace function public.validate_published_revision()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' then
    if new.reviewed_at is null then
      raise exception 'A published revision requires a review date';
    end if;
    if not exists (
      select 1 from public.question_revision_locales l
      where l.revision_id = new.id and l.locale = 'ar'
        and length(btrim(l.question)) > 0
        and length(btrim(l.short_answer)) > 0
        and length(btrim(l.explanation)) > 0
    ) or not exists (
      select 1 from public.question_revision_locales l
      where l.revision_id = new.id and l.locale = 'en'
        and length(btrim(l.question)) > 0
        and length(btrim(l.short_answer)) > 0
        and length(btrim(l.explanation)) > 0
    ) then
      raise exception 'A published revision requires complete ar and en locale rows';
    end if;
    new.published_at = coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

create trigger question_revisions_validate_published
before insert or update on public.question_revisions
for each row execute function public.validate_published_revision();

create or replace function public.prevent_published_revision_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then raise exception 'Question revisions are append-only'; end if;
  if new.question_id <> old.question_id
    or new.revision_number <> old.revision_number
    or new.created_by is distinct from old.created_by
    or new.created_at <> old.created_at then
    raise exception 'Question revisions are append-only';
  end if;
  if old.status = 'draft' and new.status in ('published', 'rejected') then
    return new;
  end if;
  raise exception 'Question revisions are append-only';
end;
$$;

create trigger question_revisions_append_only
before update or delete on public.question_revisions
for each row execute function public.prevent_published_revision_mutation();

create or replace function public.prevent_published_locale_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    raise exception 'Question locale rows are append-only';
  end if;
  return new;
end;
$$;

create trigger question_revision_locales_immutable_published
before update or delete on public.question_revision_locales
for each row execute function public.prevent_published_locale_mutation();

create or replace function public.validate_published_pointer()
returns trigger
language plpgsql
as $$
begin
  if new.published_revision_id is not null and not exists (
    select 1 from public.question_revisions r
    where r.id = new.published_revision_id and r.question_id = new.id and r.status = 'published'
  ) then raise exception 'published_revision_id must point to a published revision for the same question'; end if;
  return new;
end;
$$;

create trigger interview_questions_validate_published_pointer
before insert or update on public.interview_questions
for each row execute function public.validate_published_pointer();

create or replace function public.validate_question_track_change()
returns trigger
language plpgsql
as $$
begin
  if new.track_id is distinct from old.track_id and exists (
    select 1
    from public.question_topics qt
    join public.topics t on t.id = qt.topic_id
    where qt.question_id = new.id and t.track_id <> new.track_id
  ) then
    raise exception 'Question Track cannot change while linked Topics belong to another Track';
  end if;
  return new;
end;
$$;

create trigger interview_questions_same_track_on_change
before update on public.interview_questions
for each row execute function public.validate_question_track_change();

create or replace function public.validate_topic_track_change()
returns trigger
language plpgsql
as $$
begin
  if new.track_id is distinct from old.track_id and exists (
    select 1
    from public.question_topics qt
    join public.interview_questions q on q.id = qt.question_id
    where qt.topic_id = new.id and q.track_id <> new.track_id
  ) then
    raise exception 'Topic Track cannot change while linked Questions belong to another Track';
  end if;
  return new;
end;
$$;

create trigger topics_same_track_on_change
before update on public.topics
for each row execute function public.validate_topic_track_change();

create or replace function public.prevent_slug_mutation()
returns trigger
language plpgsql
as $$
begin
  if new.slug <> old.slug then raise exception 'Public slugs are immutable'; end if;
  return new;
end;
$$;

create trigger tracks_slug_immutable
before update on public.tracks
for each row execute function public.prevent_slug_mutation();

create trigger topics_slug_immutable
before update on public.topics
for each row execute function public.prevent_slug_mutation();

create trigger interview_questions_slug_immutable
before update on public.interview_questions
for each row execute function public.prevent_slug_mutation();

create or replace function public.validate_submission_topics()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from jsonb_array_elements_text(new.topic_ids) submitted_topic
    left join public.topics t on t.id = submitted_topic
    where t.id is null or t.track_id <> new.track_id
  ) then
    raise exception 'Submission Topics must exist and belong to the submitted Track';
  end if;
  return new;
end;
$$;

create trigger submissions_validate_topics
before insert or update on public.submissions
for each row execute function public.validate_submission_topics();

create or replace function public.validate_new_submission()
returns trigger
language plpgsql
as $$
begin
  if new.status <> 'pending' or new.review_notes is not null or new.github_issue_number is not null then
    raise exception 'New Submissions must start as pending and cannot set moderation fields';
  end if;
  return new;
end;
$$;

create trigger submissions_pending_on_insert
before insert on public.submissions
for each row execute function public.validate_new_submission();

create or replace function public.validate_published_question_topics()
returns trigger
language plpgsql
as $$
declare question_id text := coalesce(new.question_id, old.question_id);
begin
  if exists (
    select 1 from public.interview_questions q
    where q.id = question_id and q.published_revision_id is not null
      and not exists (select 1 from public.question_topics qt where qt.question_id = q.id)
  ) then raise exception 'A published Interview Question requires at least one Topic'; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function public.validate_published_question_pointer_topic()
returns trigger
language plpgsql
as $$
begin
  if new.published_revision_id is not null and not exists (
    select 1 from public.question_topics qt where qt.question_id = new.id
  ) then
    raise exception 'A published Interview Question requires at least one Topic';
  end if;
  return new;
end;
$$;

create constraint trigger question_topics_required_for_published_question
after insert or update or delete on public.question_topics
deferrable initially deferred
for each row execute function public.validate_published_question_topics();

create constraint trigger interview_questions_required_topic
after insert or update on public.interview_questions
deferrable initially deferred
for each row execute function public.validate_published_question_pointer_topic();

alter table public.tracks enable row level security;
alter table public.track_locales enable row level security;
alter table public.topics enable row level security;
alter table public.topic_locales enable row level security;
alter table public.interview_questions enable row level security;
alter table public.question_revisions enable row level security;
alter table public.question_revision_locales enable row level security;
alter table public.question_topics enable row level security;
alter table public.submissions enable row level security;

create policy tracks_public_read on public.tracks for select to anon, authenticated using (exists (select 1 from public.interview_questions q where q.track_id = public.tracks.id and q.published_revision_id is not null));
create policy track_locales_public_read on public.track_locales for select to anon, authenticated using (exists (select 1 from public.interview_questions q where q.track_id = public.track_locales.track_id and q.published_revision_id is not null));
create policy topics_public_read on public.topics for select to anon, authenticated using (exists (select 1 from public.question_topics qt join public.interview_questions q on q.id = qt.question_id where qt.topic_id = public.topics.id and q.published_revision_id is not null));
create policy topic_locales_public_read on public.topic_locales for select to anon, authenticated using (exists (select 1 from public.question_topics qt join public.interview_questions q on q.id = qt.question_id where qt.topic_id = public.topic_locales.topic_id and q.published_revision_id is not null));
create policy interview_questions_published_read on public.interview_questions for select to anon, authenticated using (published_revision_id is not null);
create policy question_revisions_published_read on public.question_revisions for select to anon, authenticated using (status = 'published' and exists (select 1 from public.interview_questions q where q.id = question_id and q.published_revision_id = public.question_revisions.id));
create policy question_revision_locales_published_read on public.question_revision_locales for select to anon, authenticated using (exists (select 1 from public.question_revisions r join public.interview_questions q on q.id = r.question_id where r.id = public.question_revision_locales.revision_id and r.status = 'published' and q.published_revision_id = r.id));
create policy interview_questions_moderator_read on public.interview_questions for select to authenticated using (public.is_moderator());
create policy question_revisions_moderator_read on public.question_revisions for select to authenticated using (public.is_moderator());
create policy question_revision_locales_moderator_read on public.question_revision_locales for select to authenticated using (public.is_moderator());
create policy question_topics_moderator_read on public.question_topics for select to authenticated using (public.is_moderator());
create policy question_topics_published_read on public.question_topics for select to anon, authenticated using (exists (select 1 from public.interview_questions q where q.id = question_id and q.published_revision_id is not null));
create policy submissions_owner_insert on public.submissions for insert to authenticated with check (submitted_by = public.current_clerk_user_id());
create policy submissions_owner_read on public.submissions for select to authenticated using (submitted_by = public.current_clerk_user_id() or public.is_moderator());
create policy submissions_moderator_update on public.submissions for update to authenticated using (public.is_moderator()) with check (public.is_moderator());

grant usage on schema public to anon, authenticated;
grant select on public.tracks, public.track_locales, public.topics, public.topic_locales,
  public.interview_questions, public.question_revisions, public.question_revision_locales,
  public.question_topics to anon, authenticated;
grant insert, select, update on public.submissions to authenticated;
