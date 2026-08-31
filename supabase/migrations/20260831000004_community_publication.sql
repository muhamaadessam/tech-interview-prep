alter table public.interview_questions
  add column if not exists source_submission_id uuid references public.submissions(id) on delete set null;

create unique index if not exists interview_questions_source_submission_idx
  on public.interview_questions (source_submission_id)
  where source_submission_id is not null;

alter table public.submissions
  add column if not exists published_question_id text references public.interview_questions(id) on delete set null;

create index if not exists submissions_published_question_idx
  on public.submissions (published_question_id)
  where published_question_id is not null;

create or replace function public.validate_community_publication()
returns trigger
language plpgsql
as $$
begin
  if new.visibility = 'community' then
    if new.published_revision_id is null then
      raise exception 'A Community Interview Question requires a published revision';
    end if;
    if new.community_published_at is null then
      new.community_published_at = now();
    end if;
    if new.community_contributor_username is null then
      new.community_contributor_username = 'Community contributor';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists interview_questions_validate_community_publication on public.interview_questions;
create trigger interview_questions_validate_community_publication
before insert or update on public.interview_questions
for each row execute function public.validate_community_publication();
