alter type public.submission_status add value if not exists 'issue_created';
alter type public.submission_status add value if not exists 'changes_requested';
alter type public.submission_status add value if not exists 'approved';
alter type public.submission_status add value if not exists 'published';
alter type public.submission_status add value if not exists 'failed';

alter table public.submissions
  add column if not exists idempotency_key text,
  add column if not exists revision_number integer not null default 1,
  add column if not exists duplicate_advisory boolean not null default false,
  add column if not exists duplicate_of uuid references public.submissions(id) on delete set null,
  add column if not exists github_issue_url text,
  add column if not exists last_error text,
  add column if not exists display_name text,
  add column if not exists license_consent boolean not null default false;

alter table public.submissions
  add constraint submissions_revision_number_positive check (revision_number > 0),
  add constraint submissions_display_name_length check (display_name is null or length(display_name) <= 80),
  add constraint submissions_last_error_length check (last_error is null or length(last_error) <= 500),
  add constraint submissions_github_issue_url_https check (github_issue_url is null or github_issue_url like 'https://%');

create unique index submissions_idempotency_idx
  on public.submissions (submitted_by, idempotency_key)
  where idempotency_key is not null;

create unique index submissions_github_issue_idx
  on public.submissions (github_issue_number)
  where github_issue_number is not null;

create table public.submission_revisions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  revision_number integer not null check (revision_number > 0),
  submitted_by text not null,
  track_id text not null references public.tracks(id) on delete restrict,
  topic_ids jsonb not null,
  difficulty public.difficulty_level not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (submission_id, revision_number),
  constraint submission_revisions_topics_array check (jsonb_typeof(topic_ids) = 'array' and jsonb_array_length(topic_ids) > 0),
  constraint submission_revisions_payload_object check (jsonb_typeof(payload) = 'object')
);

alter table public.submission_revisions enable row level security;

create or replace function public.validate_new_submission()
returns trigger
language plpgsql
as $$
begin
  if new.status <> 'pending' or new.review_notes is not null or new.github_issue_number is not null then
    raise exception 'New Submissions must start as pending and cannot set moderation fields';
  end if;
  if new.license_consent is not true then
    raise exception 'Submission requires CC BY consent';
  end if;
  return new;
end;
$$;

revoke insert, update on public.submissions from authenticated;
grant select on public.submissions to authenticated;
