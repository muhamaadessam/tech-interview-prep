# Spec: Learner state modules

## Problem

Question Progress, Favorites, and Asked Markers are Account-scoped learner
state, but they have different meanings and merge rules. Combining them into a
single giant endpoint would make retries, ownership, and local/offline
behaviour harder to reason about.

## Goal

Move learner state behind small Node modules while keeping each domain concept
separate and preserving the current local-first experience.

## Boundaries

- **Question Progress** is `Not Started`, `Reviewing`, or `Mastered`.
- **Favorites** is an independent boolean; changing it never changes Progress.
- **Asked Marker** is a non-negative Account count for an Interview Question;
  its aggregate is Interview Frequency, not a verified real-world statistic.
- Every write is scoped to the verified Clerk `sub`; request Account IDs are
  ignored or rejected when they differ.

## Contract shape

Expose separate operations for progress/favorite state and Asked Marker
increment/decrement. They may share transport plumbing, but not a combined
domain command. Keep local cache merge rules explicit:

- Progress keeps the strongest known state.
- Favorites merge with logical OR during an offline sync.
- Asked Marker never becomes negative and is updated by bounded increment or
  decrement commands.
- Suspended or deleted Accounts cannot contribute state to public aggregates.

## Rollout

Start with read parity, then one write operation at a time. Preserve the local
cache during cutover and never require a second login. Use the route flag per
operation; rollback changes routing only and does not delete stored state.

## Acceptance checks

- Anonymous visitors can browse but cannot write Account state.
- Authenticated state is isolated between Accounts, including after sign-out and
  retry.
- Progress, Favorites, and Asked Markers remain independent across all UI flows.
- Offline/local merge is deterministic and idempotent.
- Counts stay non-negative, rate limits are explicit, and duplicate retries do
  not inflate Asked Markers.
- HTTP, integration, E2E, security, and route-rollback checks pass before each
  operation is enabled.

## Out of scope

Community Question Likes/promotion, Track Preferences, catalogue reads,
Submission Review, and changing the database invariants.
