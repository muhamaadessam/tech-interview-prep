-- Enforce immutable identifiers, valid source objects, review dates, and topic ownership.
create or replace function public.valid_sources(value jsonb)
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(value) = 'array'
    and jsonb_array_length(value) > 0
    and not exists (
      select 1 from jsonb_array_elements(value) source
      where jsonb_typeof(source) <> 'object'
        or length(btrim(coalesce(source ->> 'title', ''))) = 0
        or coalesce(source ->> 'url', '') not like 'https://%'
    );
$$;

alter table public.question_revision_locales
  drop constraint if exists question_revision_locales_sources_array,
  add constraint question_revision_locales_sources_array check (public.valid_sources(sources));

create or replace function public.validate_published_revision()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' then
    if new.reviewed_at is null then raise exception 'A published revision requires a review date'; end if;
    if not exists (select 1 from public.question_revision_locales l where l.revision_id = new.id and l.locale = 'ar' and length(btrim(l.question)) > 0 and length(btrim(l.short_answer)) > 0 and length(btrim(l.explanation)) > 0)
      or not exists (select 1 from public.question_revision_locales l where l.revision_id = new.id and l.locale = 'en' and length(btrim(l.question)) > 0 and length(btrim(l.short_answer)) > 0 and length(btrim(l.explanation)) > 0) then
      raise exception 'A published revision requires complete ar and en locale rows';
    end if;
    new.published_at = coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

create or replace function public.prevent_slug_mutation()
returns trigger
language plpgsql
as $$
begin
  if new.slug <> old.slug then raise exception 'Public slugs are immutable'; end if;
  return new;
end;
$$;

drop trigger if exists tracks_slug_immutable on public.tracks;
create trigger tracks_slug_immutable before update on public.tracks for each row execute function public.prevent_slug_mutation();
drop trigger if exists topics_slug_immutable on public.topics;
create trigger topics_slug_immutable before update on public.topics for each row execute function public.prevent_slug_mutation();
drop trigger if exists interview_questions_slug_immutable on public.interview_questions;
create trigger interview_questions_slug_immutable before update on public.interview_questions for each row execute function public.prevent_slug_mutation();

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
  if new.published_revision_id is not null and not exists (select 1 from public.question_topics qt where qt.question_id = new.id) then
    raise exception 'A published Interview Question requires at least one Topic';
  end if;
  return new;
end;
$$;

drop trigger if exists question_topics_required_for_published_question on public.question_topics;
create constraint trigger question_topics_required_for_published_question
after insert or update or delete on public.question_topics
deferrable initially deferred for each row execute function public.validate_published_question_topics();

drop trigger if exists interview_questions_required_topic on public.interview_questions;
create constraint trigger interview_questions_required_topic
after insert or update on public.interview_questions
deferrable initially deferred for each row execute function public.validate_published_question_pointer_topic();

drop policy if exists interview_questions_moderator_read on public.interview_questions;
create policy interview_questions_moderator_read on public.interview_questions for select to authenticated using (public.is_moderator());
drop policy if exists question_revisions_moderator_read on public.question_revisions;
create policy question_revisions_moderator_read on public.question_revisions for select to authenticated using (public.is_moderator());
drop policy if exists question_revision_locales_moderator_read on public.question_revision_locales;
create policy question_revision_locales_moderator_read on public.question_revision_locales for select to authenticated using (public.is_moderator());
drop policy if exists question_topics_moderator_read on public.question_topics;
create policy question_topics_moderator_read on public.question_topics for select to authenticated using (public.is_moderator());
