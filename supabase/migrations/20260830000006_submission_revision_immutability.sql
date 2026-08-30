create or replace function public.prevent_submission_revision_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Submission revisions are append-only';
end;
$$;

create trigger submission_revisions_append_only
before update or delete on public.submission_revisions
for each row execute function public.prevent_submission_revision_mutation();
