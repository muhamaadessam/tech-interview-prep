alter table public.account_roles
  add column if not exists suspended boolean not null default false,
  add column if not exists suspension_reason text,
  add column if not exists suspended_at timestamptz;

alter table public.submissions
  add column if not exists reviewed_by text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by text;

create table public.moderation_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id text not null,
  action text not null check (action ~ '^[a-z][a-z0-9_]+$'),
  target_type text not null check (target_type in ('submission', 'question', 'account', 'system')),
  target_id text,
  reason text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 months')
);

create index moderation_audit_target_idx on public.moderation_audit_events (target_type, target_id, created_at desc);
create index moderation_audit_expiry_idx on public.moderation_audit_events (expires_at);

alter table public.moderation_audit_events enable row level security;

create or replace function public.prevent_moderation_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Moderation audit events are append-only';
end;
$$;

create trigger moderation_audit_append_only
before update or delete on public.moderation_audit_events
for each row execute function public.prevent_moderation_audit_mutation();

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not coalesce((select suspended from public.account_roles where user_id = public.current_clerk_user_id()), false)
    and exists (select 1 from public.account_roles where user_id = public.current_clerk_user_id() and role = 'moderator' and not suspended);
$$;

revoke all on public.moderation_audit_events from anon, authenticated;
