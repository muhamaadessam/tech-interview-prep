create table public.submission_advisories (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  revision_number integer not null check (revision_number > 0),
  status text not null check (status in ('running', 'completed', 'comment_pending', 'failed')),
  provider text not null,
  model text not null,
  prompt_version text not null,
  result jsonb,
  last_error text,
  github_comment_id bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, revision_number, prompt_version, provider, model),
  constraint submission_advisories_revision_fk foreign key (submission_id, revision_number)
    references public.submission_revisions (submission_id, revision_number) on delete cascade,
  constraint submission_advisories_result_object check (result is null or jsonb_typeof(result) = 'object')
);

create index submission_advisories_submission_idx on public.submission_advisories (submission_id, revision_number);
alter table public.submission_advisories enable row level security;
revoke all on public.submission_advisories from public, anon, authenticated;
grant all on public.submission_advisories to service_role;

create or replace function public.prevent_advisory_identity_mutation()
returns trigger
language plpgsql
as $$
begin
  if new.submission_id <> old.submission_id
    or new.revision_number <> old.revision_number
    or new.provider <> old.provider
    or new.model <> old.model
    or new.prompt_version <> old.prompt_version
    or (old.status = 'completed' and new.status <> 'completed') then
    raise exception 'Submission advisories are append-only by revision';
  end if;
  return new;
end;
$$;

create trigger submission_advisories_identity_immutable
before update on public.submission_advisories
for each row execute function public.prevent_advisory_identity_mutation();

create trigger submission_advisories_touch_updated_at
before update on public.submission_advisories
for each row execute function public.touch_updated_at();
