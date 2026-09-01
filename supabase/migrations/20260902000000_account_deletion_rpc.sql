create or replace function public.prevent_submission_revision_mutation()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.account_deletion_user_id', true) = old.submitted_by then
    if tg_op = 'DELETE' then return old; end if;
    if tg_op = 'UPDATE'
      and new.submitted_by = current_setting('app.account_deletion_anonymous_id', true)
      and (to_jsonb(new) - 'submitted_by') = (to_jsonb(old) - 'submitted_by')
    then return new;
    end if;
  end if;
  raise exception 'Submission revisions are append-only';
end;
$$;

create or replace function public.delete_account_data_for_account(
  p_account_id text,
  p_anonymous_id text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  published_count integer;
begin
  if nullif(btrim(p_account_id), '') is null
    or p_anonymous_id !~ '^deleted:user:[0-9a-f]{64}$'
  then raise exception 'invalid_account_deletion';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_account_id, 0));
  perform set_config('app.account_deletion_user_id', p_account_id, true);
  perform set_config('app.account_deletion_anonymous_id', p_anonymous_id, true);

  select count(*) into published_count
  from public.submissions
  where status = 'published' and submitted_by in (p_account_id, p_anonymous_id);

  update public.interview_questions
  set community_contributor_user_id = p_anonymous_id,
      community_contributor_username = 'Community contributor'
  where community_contributor_user_id = p_account_id;

  update public.submission_revisions revision
  set submitted_by = p_anonymous_id
  where revision.submitted_by = p_account_id
    and exists (
      select 1 from public.submissions submission
      where submission.id = revision.submission_id
        and submission.status = 'published'
        and submission.submitted_by in (p_account_id, p_anonymous_id)
    );

  update public.submissions
  set submitted_by = p_anonymous_id,
      display_name = 'Community contributor'
  where submitted_by = p_account_id and status = 'published';

  delete from public.question_likes where account_id = p_account_id;
  delete from public.submissions where submitted_by = p_account_id and status <> 'published';
  delete from public.question_progress where user_id = p_account_id;
  delete from public.favorites where user_id = p_account_id;
  delete from public.asked_markers where account_id = p_account_id;
  delete from public.asked_marker_daily_limits where account_id = p_account_id;
  delete from public.account_track_preferences where user_id = p_account_id;
  delete from public.submission_rate_limits where user_id = p_account_id;
  delete from public.account_roles where user_id = p_account_id;

  insert into public.moderation_audit_events
    (actor_user_id, action, target_type, target_id, metadata)
  values
    (p_anonymous_id, 'account_deleted', 'account', p_anonymous_id,
     jsonb_build_object('published_submission_count', published_count));
end;
$$;

revoke all on function public.delete_account_data_for_account(text, text) from public, anon, authenticated;
grant execute on function public.delete_account_data_for_account(text, text) to service_role;
