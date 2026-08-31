alter table public.tracks add column is_active boolean not null default true;

create table public.account_track_preferences (
  user_id text not null,
  track_id text not null references public.tracks(id) on delete restrict,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

create unique index account_track_preferences_one_default
  on public.account_track_preferences (user_id)
  where is_default;

create trigger account_track_preferences_touch_updated_at
before update on public.account_track_preferences
for each row execute function public.touch_updated_at();

alter table public.account_track_preferences enable row level security;

create policy account_track_preferences_owner_read
on public.account_track_preferences for select to authenticated
using (user_id = public.current_clerk_user_id());

grant select on public.account_track_preferences to authenticated;
revoke insert, update, delete on public.account_track_preferences from anon, authenticated;

create or replace function public.set_track_preferences(
  p_track_ids text[],
  p_default_track_id text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  account_id text := public.current_clerk_user_id();
  selected_ids text[];
begin
  if account_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select array_agg(distinct selected.track_id order by selected.track_id)
  into selected_ids
  from unnest(p_track_ids) as selected(track_id)
  where selected.track_id is not null and length(btrim(selected.track_id)) > 0;

  if coalesce(cardinality(selected_ids), 0) = 0 then
    raise exception 'At least one active Track Preference is required' using errcode = '22023';
  end if;
  if p_default_track_id is null or not (p_default_track_id = any(selected_ids)) then
    raise exception 'Default Track must be selected' using errcode = '22023';
  end if;
  perform 1 from public.tracks where id = any(selected_ids) and is_active for key share;
  if (select count(*) from public.tracks where id = any(selected_ids) and is_active) <> cardinality(selected_ids) then
    raise exception 'Every Track Preference must be active' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(account_id, 0));
  update public.account_track_preferences
  set is_default = false
  where user_id = account_id and is_default;

  delete from public.account_track_preferences preference
  using public.tracks track
  where preference.user_id = account_id
    and preference.track_id = track.id
    and track.is_active
    and not (preference.track_id = any(selected_ids));

  insert into public.account_track_preferences (user_id, track_id, is_default)
  select account_id, selected.track_id, selected.track_id = p_default_track_id
  from unnest(selected_ids) as selected(track_id)
  on conflict (user_id, track_id) do update
  set is_default = excluded.is_default;
end;
$$;

revoke all on function public.set_track_preferences(text[], text) from public, anon;
grant execute on function public.set_track_preferences(text[], text) to authenticated;

create or replace function public.reassign_unavailable_default_track()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.is_active and not new.is_active then
    update public.account_track_preferences
    set is_default = false
    where track_id = new.id and is_default;

  end if;

  update public.account_track_preferences preference
  set is_default = true
  where preference.track_id = (
    select candidate.track_id
    from public.account_track_preferences candidate
    join public.tracks track on track.id = candidate.track_id and track.is_active
    where candidate.user_id = preference.user_id
    order by candidate.created_at, candidate.track_id
    limit 1
  )
    and not exists (
      select 1 from public.account_track_preferences current_default
      where current_default.user_id = preference.user_id and current_default.is_default
    );
  return new;
end;
$$;

create trigger tracks_reassign_unavailable_default
after update of is_active on public.tracks
for each row execute function public.reassign_unavailable_default_track();

drop policy if exists tracks_public_read on public.tracks;
create policy tracks_public_read on public.tracks
for select to anon, authenticated using (
  is_active
  or exists (
    select 1
    from public.account_track_preferences preference
    where preference.track_id = id
      and preference.user_id = public.current_clerk_user_id()
  )
);

drop policy if exists track_locales_public_read on public.track_locales;
create policy track_locales_public_read on public.track_locales
for select to anon, authenticated using (
  exists (
    select 1
    from public.tracks track
    where track.id = track_id
      and (
        track.is_active
        or exists (
          select 1
          from public.account_track_preferences preference
          where preference.track_id = track.id
            and preference.user_id = public.current_clerk_user_id()
        )
      )
  )
);
