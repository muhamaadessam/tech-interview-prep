# Spec: Tracks and Track Preferences vertical slice

## Problem

Track and Track Preference reads are duplicated between the Active Track
provider and the My Tracks flow. The browser must use Node for database-backed
reads, keeping Account policy and response shaping in one place.

## Goal

Move one small, read-first vertical slice to the Node backend while preserving
the current URLs, Active Track rules, database schema, and user-visible
behaviour. The first mutation is saving Track Preferences through the existing
PostgreSQL RPC.

## Contract

- `GET /v1/tracks` returns active Tracks visible to anonymous visitors.
- `GET /v1/me/track-preferences` requires `app.authenticate` and returns the
  Account's active and historical preferences plus its Default Track.
- `PUT /v1/me/track-preferences` requires authentication, an email-confirmed
  Account where current policy requires it, and delegates the invariant check to
  `set_track_preferences`.
- The verified Clerk `sub` is the only Account identity. Request Account IDs are
  rejected when they differ from it.
- A valid URL Active Track still wins over the Default Track for a page. An
  Account may choose only an active Track Preference; anonymous browsing may
  choose any active Track.

## Invariants

- An Account keeps at least one active Track Preference.
- Removing a Track Preference never deletes historical Question Progress,
  Favorites, Asked Markers, or Submissions.
- PostgreSQL remains authoritative for the atomic save and all existing RLS and
  constraints remain unchanged.
- The Node response is a transport seam, not a second source of Track truth.

## Rollout and rollback

Migrate the two read callers first, compare responses, then migrate the save
caller. Do not dual-write. The Node route is the only application path; disabling
the policy flag changes authorization only and does not restore direct database
access.

## Acceptance checks

- Anonymous and authenticated Track reads have parity with current behaviour.
- Active, unavailable historical, invalid URL, and cross-Track Topic contexts
  preserve current semantics.
- Save rejects an empty selection and cannot remove the last active preference.
- The Account `sub` cannot be overridden by body, query, or path data.
- Integration, E2E, CORS, secret-scan, and rollback checks pass before enabling
  the route.

## Out of scope

Static `src/content/questions.ts` catalogue migration, catalogue read
aggregation, learner state, Submission/Review workflows, and schema changes.
