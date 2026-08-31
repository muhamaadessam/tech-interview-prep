create table public.question_follow_ups (
  id uuid primary key default gen_random_uuid(),
  source_revision_id uuid not null references public.question_revisions(id) on delete restrict,
  target_question_id text not null references public.interview_questions(id) on delete restrict,
  position integer not null check (position > 0),
  created_at timestamptz not null default now(),
  unique (source_revision_id, position),
  unique (source_revision_id, target_question_id)
);

create index question_follow_ups_source_idx on public.question_follow_ups (source_revision_id, position);
create index question_follow_ups_target_idx on public.question_follow_ups (target_question_id);

create or replace function public.validate_question_follow_up()
returns trigger
language plpgsql
as $$
declare
  source_track text;
  target_track text;
  source_status public.revision_status;
begin
  select q.track_id, r.status into source_track, source_status
  from public.question_revisions r
  join public.interview_questions q on q.id = r.question_id
  where r.id = new.source_revision_id;
  select track_id into target_track from public.interview_questions where id = new.target_question_id;
  if source_track is null or target_track is null or source_track <> target_track then
    raise exception 'Follow-up Question target must belong to the source Track';
  end if;
  if source_status = 'published' and not exists (
    select 1 from public.interview_questions where id = new.target_question_id and published_revision_id is not null
  ) then
    raise exception 'A published Follow-up Question requires a published target';
  end if;
  return new;
end;
$$;

create trigger question_follow_ups_validate
before insert or update on public.question_follow_ups
for each row execute function public.validate_question_follow_up();

alter table public.question_follow_ups enable row level security;

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
      and target_question.published_revision_id is not null
  )
);

create policy question_follow_ups_moderator_read
on public.question_follow_ups for select to authenticated
using (public.is_moderator());

create policy question_follow_ups_moderator_insert
on public.question_follow_ups for insert to authenticated
with check (public.is_moderator());

create policy question_follow_ups_moderator_update
on public.question_follow_ups for update to authenticated
using (public.is_moderator()) with check (public.is_moderator());

create policy question_follow_ups_moderator_delete
on public.question_follow_ups for delete to authenticated
using (public.is_moderator());

grant select on public.question_follow_ups to anon, authenticated;

create table public.asked_markers (
  account_id text not null,
  question_id text not null references public.interview_questions(id) on delete cascade,
  asked_count integer not null default 0 check (asked_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (account_id, question_id)
);

create index asked_markers_question_idx on public.asked_markers (question_id);

create table public.asked_marker_daily_limits (
  account_id text not null,
  day date not null default current_date,
  increase_count integer not null default 0 check (increase_count >= 0 and increase_count <= 100),
  primary key (account_id, day)
);

alter table public.asked_markers enable row level security;
alter table public.asked_marker_daily_limits enable row level security;

create policy asked_markers_owner_read
on public.asked_markers for select to authenticated
using (account_id = public.current_clerk_user_id());

create policy asked_marker_daily_limits_owner_read
on public.asked_marker_daily_limits for select to authenticated
using (account_id = public.current_clerk_user_id());

grant select on public.asked_markers to authenticated;
grant select on public.asked_marker_daily_limits to authenticated;

create view public.interview_question_frequencies as
select
  q.id as question_id,
  coalesce(sum(m.asked_count) filter (where coalesce(a.suspended, false) = false), 0)::integer as frequency
from public.interview_questions q
left join public.asked_markers m on m.question_id = q.id
left join public.account_roles a on a.user_id = m.account_id
where q.published_revision_id is not null
group by q.id;

grant select on public.interview_question_frequencies to anon, authenticated;

create or replace function public.adjust_asked_marker(
  p_question_id text,
  p_delta integer
)
returns table (personal_count integer, interview_frequency integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor text := public.current_clerk_user_id();
  current_count integer;
begin
  if actor is null then raise exception 'unauthenticated'; end if;
  if p_delta not in (-1, 1) then raise exception 'invalid_delta'; end if;
  if exists (select 1 from public.account_roles where user_id = actor and suspended) then raise exception 'account_suspended'; end if;
  if not exists (select 1 from public.interview_questions where id = p_question_id and published_revision_id is not null) then raise exception 'question_not_published'; end if;

  perform pg_advisory_xact_lock(hashtextextended(actor, 0));
  if p_delta = 1 then
    insert into public.asked_marker_daily_limits (account_id, day) values (actor, current_date) on conflict do nothing;
    update public.asked_marker_daily_limits
    set increase_count = increase_count + 1
    where account_id = actor and day = current_date and increase_count < 100;
    if not found then raise exception 'daily_asked_marker_limit_reached'; end if;
  end if;

  insert into public.asked_markers (account_id, question_id, asked_count)
  values (actor, p_question_id, greatest(0, p_delta))
  on conflict (account_id, question_id) do update
    set asked_count = greatest(0, asked_markers.asked_count + excluded.asked_count + least(0, p_delta)),
        updated_at = now();

  select asked_count into current_count from public.asked_markers where account_id = actor and question_id = p_question_id;
  return query
  select coalesce(current_count, 0), coalesce((select frequency from public.interview_question_frequencies where question_id = p_question_id), 0);
end;
$$;

revoke all on function public.adjust_asked_marker(text, integer) from public, anon;
grant execute on function public.adjust_asked_marker(text, integer) to authenticated;
