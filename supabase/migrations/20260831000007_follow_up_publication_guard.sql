create or replace function public.validate_published_follow_up_targets()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and exists (
    select 1
    from public.question_follow_ups follow_up
    join public.interview_questions target on target.id = follow_up.target_question_id
    where follow_up.source_revision_id = new.id
      and target.published_revision_id is null
  ) then
    raise exception 'A published Follow-up Question requires every target to be published';
  end if;
  return new;
end;
$$;

drop trigger if exists question_revisions_validate_follow_ups on public.question_revisions;
create trigger question_revisions_validate_follow_ups
before insert or update on public.question_revisions
for each row execute function public.validate_published_follow_up_targets();
