drop policy if exists interview_questions_published_read on public.interview_questions;
create policy interview_questions_published_read
on public.interview_questions for select to anon, authenticated
using (
  published_revision_id is not null
  and (visibility = 'public' or community_unpublished_at is null)
);

drop policy if exists question_follow_ups_public_read on public.question_follow_ups;
create policy question_follow_ups_public_read
on public.question_follow_ups for select to anon, authenticated
using (
  exists (
    select 1
    from public.question_revisions source_revision
    join public.interview_questions source_question on source_question.id = source_revision.question_id
    join public.interview_questions target_question on target_question.id = question_follow_ups.target_question_id
    where source_revision.id = question_follow_ups.source_revision_id
      and source_question.published_revision_id = source_revision.id
      and source_revision.status = 'published'
      and (source_question.visibility = 'public' or source_question.community_unpublished_at is null)
      and target_question.published_revision_id is not null
      and (target_question.visibility = 'public' or target_question.community_unpublished_at is null)
  )
);
