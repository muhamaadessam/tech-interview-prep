do $$
begin
  create type public.question_visibility as enum ('public', 'community');
exception
  when duplicate_object then null;
end $$;

alter table public.interview_questions
  add column if not exists visibility public.question_visibility not null default 'public',
  add column if not exists community_contributor_user_id text,
  add column if not exists community_contributor_username text,
  add column if not exists community_published_at timestamptz,
  add column if not exists community_unpublished_at timestamptz,
  add column if not exists promoted_at timestamptz,
  add column if not exists promotion_like_count integer,
  add constraint interview_questions_contributor_username_length
    check (community_contributor_username is null or length(btrim(community_contributor_username)) between 1 and 80),
  add constraint interview_questions_promotion_count_valid
    check (promotion_like_count is null or promotion_like_count >= 50),
  add constraint interview_questions_promotion_fields_consistent
    check ((promoted_at is null and promotion_like_count is null) or (promoted_at is not null and promotion_like_count is not null));

create index if not exists interview_questions_visibility_idx
  on public.interview_questions (visibility, created_at desc);

create table if not exists public.question_likes (
  question_id text not null references public.interview_questions(id) on delete cascade,
  account_id text not null,
  active boolean not null default true,
  liked_at timestamptz,
  unliked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (question_id, account_id),
  constraint question_likes_account_id_not_blank check (length(btrim(account_id)) > 0),
  constraint question_likes_active_has_timestamp check ((active and liked_at is not null) or (not active))
);

create index if not exists question_likes_active_question_idx
  on public.question_likes (question_id, active);
create index if not exists question_likes_account_liked_at_idx
  on public.question_likes (account_id, liked_at desc)
  where active;

create trigger question_likes_touch_updated_at
before update on public.question_likes
for each row execute function public.touch_updated_at();

create table if not exists public.question_promotion_events (
  question_id text primary key references public.interview_questions(id) on delete restrict,
  threshold integer not null default 50 check (threshold = 50),
  eligible_like_count integer not null check (eligible_like_count >= threshold),
  promoted_at timestamptz not null default now(),
  actor text not null default 'system' check (actor = 'system'),
  reason text not null default '50 unique eligible likes',
  created_at timestamptz not null default now()
);

alter table public.question_likes enable row level security;
alter table public.question_promotion_events enable row level security;

create policy question_likes_owner_read
on public.question_likes for select to authenticated
using (account_id = public.current_clerk_user_id());

create policy question_likes_owner_insert
on public.question_likes for insert to authenticated
with check (account_id = public.current_clerk_user_id());

create policy question_likes_owner_update
on public.question_likes for update to authenticated
using (account_id = public.current_clerk_user_id())
with check (account_id = public.current_clerk_user_id());

create policy question_promotion_events_moderator_read
on public.question_promotion_events for select to authenticated
using (public.is_moderator());

revoke all on public.question_likes from anon, authenticated;
grant select on public.question_likes to authenticated;
revoke all on public.question_promotion_events from anon, authenticated;
grant select on public.question_promotion_events to authenticated;

create view public.community_question_like_counts as
select
  q.id as question_id,
  count(l.question_id)::integer as like_count
from public.interview_questions q
left join public.question_likes l
  on l.question_id = q.id
  and l.active
left join public.account_roles a
  on a.user_id = l.account_id
where q.published_revision_id is not null
  and q.visibility in ('community', 'public')
  and q.community_unpublished_at is null
  and coalesce(a.suspended, false) = false
group by q.id;

grant select on public.community_question_like_counts to anon, authenticated;

create or replace function public.set_question_like(
  p_question_id text,
  p_liked boolean
)
returns table (
  liked boolean,
  like_count integer,
  promoted boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor text := public.current_clerk_user_id();
  question public.interview_questions%rowtype;
  existing public.question_likes%rowtype;
  eligible_count integer;
begin
  if actor is null then
    raise exception 'unauthenticated';
  end if;

  select * into question
  from public.interview_questions
  where id = p_question_id
  for update;

  if not found then raise exception 'question_not_found'; end if;
  if question.published_revision_id is null then raise exception 'question_not_published'; end if;

  select * into existing
  from public.question_likes
  where question_id = p_question_id and account_id = actor
  for update;

  if question.promoted_at is not null then
    if (p_liked and existing.active) or (not p_liked and not coalesce(existing.active, false)) then
      select count(*)::integer into eligible_count
      from public.question_likes l
      left join public.account_roles a on a.user_id = l.account_id
      where l.question_id = p_question_id
        and l.active
        and coalesce(a.suspended, false) = false;
      return query select p_liked, coalesce(question.promotion_like_count, eligible_count), true;
      return;
    end if;
    raise exception 'question_already_promoted';
  end if;
  if question.visibility <> 'community' then raise exception 'question_not_community'; end if;
  if question.community_contributor_user_id = actor then
    raise exception 'self_like_not_allowed';
  end if;
  if exists (select 1 from public.account_roles where user_id = actor and suspended) then
    raise exception 'account_suspended';
  end if;

  if p_liked and (existing.account_id is null or not existing.active) then
    if (select count(*) from public.question_likes l
        where l.account_id = actor
          and l.active
          and l.liked_at >= date_trunc('day', now())) >= 100 then
      raise exception 'daily_like_limit_reached';
    end if;
    if existing.account_id is null then
      insert into public.question_likes (question_id, account_id, active, liked_at)
      values (p_question_id, actor, true, now());
    else
      update public.question_likes
      set active = true, liked_at = now(), unliked_at = null
      where question_id = p_question_id and account_id = actor;
    end if;
  elsif not p_liked and existing.active then
    update public.question_likes
    set active = false, unliked_at = now()
    where question_id = p_question_id and account_id = actor;
  end if;

  select count(*)::integer into eligible_count
  from public.question_likes l
  left join public.account_roles a on a.user_id = l.account_id
  where l.question_id = p_question_id
    and l.active
    and coalesce(a.suspended, false) = false;

  if p_liked and eligible_count >= 50 then
    update public.interview_questions
    set visibility = 'public',
        promoted_at = now(),
        promotion_like_count = eligible_count
    where id = p_question_id
      and visibility = 'community'
      and promoted_at is null;

    insert into public.question_promotion_events (question_id, eligible_like_count)
    values (p_question_id, eligible_count)
    on conflict (question_id) do nothing;
  end if;

  return query
  select exists (
    select 1 from public.question_likes l
    where l.question_id = p_question_id and l.account_id = actor and l.active
  ), eligible_count,
  exists (
    select 1 from public.interview_questions q
    where q.id = p_question_id and q.promoted_at is not null
  );
end;
$$;

revoke all on function public.set_question_like(text, boolean) from public, anon;
grant execute on function public.set_question_like(text, boolean) to authenticated;
