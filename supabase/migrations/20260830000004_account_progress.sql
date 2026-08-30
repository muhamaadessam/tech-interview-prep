create type public.question_progress_state as enum ('not-started', 'reviewing', 'mastered');
create type public.account_role as enum ('learner', 'moderator');

create table public.account_roles (
  user_id text primary key,
  role public.account_role not null default 'learner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_progress (
  user_id text not null,
  question_id text not null references public.interview_questions(id) on delete restrict,
  progress public.question_progress_state not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table public.favorites (
  user_id text not null,
  question_id text not null references public.interview_questions(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create index question_progress_question_idx on public.question_progress (question_id);
create index favorites_question_idx on public.favorites (question_id);

create trigger account_roles_touch_updated_at before update on public.account_roles for each row execute function public.touch_updated_at();
create trigger question_progress_touch_updated_at before update on public.question_progress for each row execute function public.touch_updated_at();

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role' in ('moderator', 'admin')
    or auth.jwt() -> 'metadata' ->> 'role' in ('moderator', 'admin')
    or exists (select 1 from public.account_roles where user_id = public.current_clerk_user_id() and role = 'moderator'),
    false
  );
$$;

alter table public.account_roles enable row level security;
alter table public.question_progress enable row level security;
alter table public.favorites enable row level security;

create policy account_roles_owner_read on public.account_roles for select to authenticated using (user_id = public.current_clerk_user_id());

create policy question_progress_owner_read on public.question_progress for select to authenticated using (user_id = public.current_clerk_user_id());
create policy question_progress_owner_insert on public.question_progress for insert to authenticated with check (user_id = public.current_clerk_user_id());
create policy question_progress_owner_update on public.question_progress for update to authenticated using (user_id = public.current_clerk_user_id()) with check (user_id = public.current_clerk_user_id());
create policy question_progress_owner_delete on public.question_progress for delete to authenticated using (user_id = public.current_clerk_user_id());

create policy favorites_owner_read on public.favorites for select to authenticated using (user_id = public.current_clerk_user_id());
create policy favorites_owner_insert on public.favorites for insert to authenticated with check (user_id = public.current_clerk_user_id());
create policy favorites_owner_delete on public.favorites for delete to authenticated using (user_id = public.current_clerk_user_id());

grant select on public.account_roles to authenticated;
grant select, insert, update, delete on public.question_progress to authenticated;
grant select, insert, delete on public.favorites to authenticated;
