alter table public.submissions
  alter column difficulty drop not null,
  drop constraint submissions_topic_ids_array,
  add constraint submissions_topic_ids_array check (jsonb_typeof(topic_ids) = 'array');

alter table public.submission_revisions
  alter column difficulty drop not null,
  drop constraint submission_revisions_topics_array,
  add constraint submission_revisions_topics_array check (jsonb_typeof(topic_ids) = 'array');

create function public.claim_submission_slot_reason(
  p_user_id text,
  p_daily_limit integer default 5,
  p_cooldown_seconds integer default 60
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_count integer;
  existing_last timestamptz;
begin
  if p_user_id is null or length(p_user_id) = 0 then return 'daily_limit_reached'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id, 0));
  select submission_count, last_submitted_at into existing_count, existing_last
  from public.submission_rate_limits
  where user_id = p_user_id and day = current_date
  for update;

  if existing_count is null then
    select count(*)::integer, max(created_at) into existing_count, existing_last
    from public.submissions
    where submitted_by = p_user_id and created_at >= now() - interval '1 day';
  end if;

  if existing_count >= p_daily_limit then return 'daily_limit_reached'; end if;
  if existing_last is not null and existing_last > now() - make_interval(secs => p_cooldown_seconds) then return 'cooldown_active'; end if;

  insert into public.submission_rate_limits (user_id, day, submission_count, last_submitted_at)
  values (p_user_id, current_date, existing_count + 1, now())
  on conflict (user_id, day) do update set submission_count = excluded.submission_count, last_submitted_at = excluded.last_submitted_at;
  return 'allowed';
end;
$$;

revoke all on function public.claim_submission_slot_reason(text, integer, integer) from public, anon, authenticated;
grant execute on function public.claim_submission_slot_reason(text, integer, integer) to service_role;
