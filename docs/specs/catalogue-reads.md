# Spec: Published catalogue reads

## Problem

Database-backed Interview Question details currently perform several sequential
Supabase reads and shape visibility, locales, Topics, and Follow-up Questions in
the caller. Community catalogue reads repeat related work. The static public
catalogue is already complete and should not be moved merely to make the
backend look uniform.

## Goal

Create one server-owned read module for database-backed published content. It
must return the existing Interview Question shape and preserve the static
catalogue as the first path for public seeded questions.

## Contract

- A single Node read operation loads one published Interview Question with its
  bilingual Question Revision, Topics, official sources, and ordered Follow-up
  Questions.
- Visibility is limited to published revisions and reviewed targets in the same
  Track. Missing or unpublished Follow-up targets are omitted, as today.
- Locale selection remains presentation logic: the read module returns enough
  data for Arabic and English without changing the canonical slug or IDs.
- Community Interview Questions remain a separate collection until their
  publication and Like policy is intentionally migrated.

## Design constraints

- Keep `src/content/questions.ts` static and unchanged in this slice.
- Keep PostgreSQL as the source of publication truth; do not copy catalogue rows
  into a Node cache or introduce a new content store.
- Measure the current sequential round trips before deciding whether a page-shaped
  response or one SQL view is justified. Optimise only the measured bottleneck.
- Keep response fields stable so URL and rendering behaviour do not change.

## Acceptance checks

- Existing public question URLs render the same Arabic and English content.
- Draft, missing, cross-Track, and incomplete-bilingual revisions remain hidden.
- Follow-up ordering and locality match the current implementation.
- One request does not leak unpublished content or Account-owned data.
- Read latency and database round trips are recorded before and after; no
  performance claim is accepted without the measurement.
- The route flag can restore the previous read implementation without schema
  changes, and the static catalogue still works when backend credentials are
  absent.

## Out of scope

Track Preference migration, Question Progress/Favorites, Asked Markers, Likes,
Submission Review, GitHub, AI advisory, and a wholesale static-catalogue move.
