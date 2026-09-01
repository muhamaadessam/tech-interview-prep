-- Server-only RPCs let the Node backend own Account identity after Clerk verification.

create or replace function public.set_track_preferences_for_account(
  p_account_id text,
  p_track_ids text[],
  p_default_track_id text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if nullif(btrim(p_account_id), '') is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p_account_id)::text, true);
  perform public.set_track_preferences(p_track_ids, p_default_track_id);
end;
$$;

create or replace function public.adjust_asked_marker_for_account(
  p_account_id text,
  p_question_id text,
  p_delta integer
)
returns table (personal_count integer, interview_frequency integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if nullif(btrim(p_account_id), '') is null then raise exception 'unauthenticated'; end if;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p_account_id)::text, true);
  return query select * from public.adjust_asked_marker(p_question_id, p_delta);
end;
$$;

create or replace function public.set_question_like_for_account(
  p_account_id text,
  p_question_id text,
  p_liked boolean
)
returns table (liked boolean, like_count integer, promoted boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if nullif(btrim(p_account_id), '') is null then raise exception 'unauthenticated'; end if;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p_account_id)::text, true);
  return query select * from public.set_question_like(p_question_id, p_liked);
end;
$$;

create or replace function public.replace_learner_state_for_account(
  p_account_id text,
  p_progress jsonb,
  p_favorites text[]
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if nullif(btrim(p_account_id), '') is null then raise exception 'unauthenticated'; end if;
  if jsonb_typeof(p_progress) <> 'array' then raise exception 'invalid_progress'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_account_id, 0));

  delete from public.question_progress where user_id = p_account_id;
  insert into public.question_progress (user_id, question_id, progress)
  select p_account_id, item ->> 'question_id', (item ->> 'progress')::public.question_progress_state
  from jsonb_array_elements(p_progress) item
  where item ->> 'progress' <> 'not-started'
  on conflict (user_id, question_id) do update set progress = excluded.progress;

  delete from public.favorites where user_id = p_account_id;
  insert into public.favorites (user_id, question_id)
  select p_account_id, question_id
  from (select distinct unnest(coalesce(p_favorites, array[]::text[])) as question_id) selected
  where nullif(btrim(question_id), '') is not null;
end;
$$;

revoke all on function public.set_track_preferences_for_account(text, text[], text) from public, anon, authenticated;
revoke all on function public.adjust_asked_marker_for_account(text, text, integer) from public, anon, authenticated;
revoke all on function public.set_question_like_for_account(text, text, boolean) from public, anon, authenticated;
revoke all on function public.replace_learner_state_for_account(text, jsonb, text[]) from public, anon, authenticated;
grant execute on function public.set_track_preferences_for_account(text, text[], text) to service_role;
grant execute on function public.adjust_asked_marker_for_account(text, text, integer) to service_role;
grant execute on function public.set_question_like_for_account(text, text, boolean) to service_role;
grant execute on function public.replace_learner_state_for_account(text, jsonb, text[]) to service_role;
