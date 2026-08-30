-- Tighten public revision reads and protect cross-table Track invariants.
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

create or replace function public.validate_question_track_change()
returns trigger
language plpgsql
as $$
begin
  if new.track_id is distinct from old.track_id and exists (
    select 1 from public.question_topics qt
    join public.topics t on t.id = qt.topic_id
    where qt.question_id = new.id and t.track_id <> new.track_id
  ) then raise exception 'Question Track cannot change while linked Topics belong to another Track'; end if;
  return new;
end;
$$;

drop trigger if exists interview_questions_same_track_on_change on public.interview_questions;
create trigger interview_questions_same_track_on_change
before update on public.interview_questions
for each row execute function public.validate_question_track_change();

create or replace function public.validate_topic_track_change()
returns trigger
language plpgsql
as $$
begin
  if new.track_id is distinct from old.track_id and exists (
    select 1 from public.question_topics qt
    join public.interview_questions q on q.id = qt.question_id
    where qt.topic_id = new.id and q.track_id <> new.track_id
  ) then raise exception 'Topic Track cannot change while linked Questions belong to another Track'; end if;
  return new;
end;
$$;

drop trigger if exists topics_same_track_on_change on public.topics;
create trigger topics_same_track_on_change
before update on public.topics
for each row execute function public.validate_topic_track_change();

create or replace function public.validate_submission_topics()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from jsonb_array_elements_text(new.topic_ids) submitted_topic
    left join public.topics t on t.id = submitted_topic
    where t.id is null or t.track_id <> new.track_id
  ) then raise exception 'Submission Topics must exist and belong to the submitted Track'; end if;
  return new;
end;
$$;

drop trigger if exists submissions_validate_topics on public.submissions;
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

drop trigger if exists submissions_pending_on_insert on public.submissions;
create trigger submissions_pending_on_insert
before insert on public.submissions
for each row execute function public.validate_new_submission();

drop policy if exists question_revisions_published_read on public.question_revisions;
create policy question_revisions_published_read on public.question_revisions
for select to anon, authenticated
using (status = 'published' and exists (
  select 1 from public.interview_questions q
  where q.id = question_id and q.published_revision_id = public.question_revisions.id
));

drop policy if exists question_revision_locales_published_read on public.question_revision_locales;
create policy question_revision_locales_published_read on public.question_revision_locales
for select to anon, authenticated
using (exists (
  select 1 from public.question_revisions r
  join public.interview_questions q on q.id = r.question_id
  where r.id = public.question_revision_locales.revision_id
    and r.status = 'published'
    and q.published_revision_id = r.id
));
