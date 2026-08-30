# Catalogue and Question Progress migration

## Current inventory

The source inventory is `src/content/questions.ts` until the Supabase seed is
verified. It currently contains:

| Entity | Count | Migration key |
| --- | ---: | --- |
| Track | 1 | `flutter` |
| Topic | 14 | existing topic `id`/`slug` |
| Interview Question | 100 | existing `id` and immutable `slug` |
| Question/Topic links | 100 | `question.id + topic.id` |
| Locale rows | 200 | 100 questions × `ar`/`en` |
| Difficulty levels | 3 | `Junior`, `Mid`, `Senior` |

Difficulty distribution is 34 Junior, 45 Mid, and 21 Senior. Every published
question must retain its current Track, at least one same-Track Topic, source
URLs, review date, and both locale rows. The seed must also preserve the
existing topic distribution validated by `productionTopicCounts`.

## Local Question Progress inventory

The anonymous browser store is the key
`tech-interview-prep:questions:v1`. Its value is a JSON object keyed by stable
question id:

```json
{
  "dart-001": { "progress": "reviewing", "favorite": true }
}
```

Only `not-started`, `reviewing`, and `mastered` are valid progress values. An
invalid or unreadable value is ignored by the current parser. Migration must
never key progress by slug revision or translated text.

## Migration sequence

1. Export the current Track, Topic, Question, locale, revision, source, and
   question/topic-link records into a repeatable Supabase seed/import.
2. Verify IDs, slugs, counts, topic distribution, locale completeness, source
   URLs, and published revision pointers before switching reads.
3. Add the Supabase data-access path behind the existing local catalogue. Keep
   the local catalogue as the read-only fallback until parity and production
   health checks pass.
4. When an Account signs in for the first time, merge local state into its
   remote rows: strongest progress wins (`mastered > reviewing > not-started`)
   and favorites use OR. Keep localStorage as a cache/fallback after a
   successful merge.
5. Do not delete local data automatically. Remove it only through the existing
   reset action or an explicit future migration decision.

## Acceptance checks

- Seed is repeatable and idempotent; rerunning it does not duplicate Tracks,
  Topics, Questions, locale rows, revisions, or links.
- The database contains 1 Track, 14 Topics, 100 Questions, 100 links, and 200
  locale rows with the inventory above.
- Every existing question id/slug resolves to the same question after the
  cutover, and every topic count matches `productionTopicCounts`.
- Published rows have Arabic and English content and one current revision;
  unpublished/rejected rows are absent from anonymous reads.
- A saved local state remains valid after a question revision and after a
  locale switch.
- First-sign-in merge is idempotent, preserves the local state on failure, and
  passes the strongest-progress/OR-favorite conflict rules.
- Supabase outage or missing public configuration leaves the current static
  catalogue usable for anonymous reads.
