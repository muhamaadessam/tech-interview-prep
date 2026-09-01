-- Query-path indexes for the Node catalogue, learner state, and moderation reads.
-- All indexes are additive and safe to apply with IF NOT EXISTS.
create index if not exists interview_questions_published_track_idx
  on public.interview_questions (track_id, id)
  where published_revision_id is not null;

create index if not exists question_revision_locales_revision_locale_idx
  on public.question_revision_locales (revision_id, locale);

create index if not exists account_track_preferences_user_created_idx
  on public.account_track_preferences (user_id, created_at, track_id);
