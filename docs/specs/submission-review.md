# Spec: Submission to Review side effects

## Problem

The current Node submission route combines validation, rate limits,
idempotency, database writes, duplicate detection, and GitHub Issue creation.
Moderator actions and AI advisory repeat GitHub concerns. Retries can therefore
cross provider boundaries without one clear ownership model.

## Goal

Move the Submission-to-Review orchestration behind Node-owned policy and
adapters, while keeping PostgreSQL as the Submission source of truth and the
Review Issue as a conversation record rather than a publication authority.

## Flow

1. Verify the Clerk `sub`, active Account policy, email confirmation, consent,
   Track, and Submission validation in Node.
2. Persist the Submission and its first Question Revision transactionally with
   an idempotency key; retries return the same result.
3. Create or reconcile exactly one GitHub Review Issue through a server-only
   GitHub adapter. Missing provider credentials leave a retryable state without
   losing the Submission.
4. A Moderator conducts Review and updates PostgreSQL explicitly. The Issue
   never publishes an Interview Question by itself.

## Invariants and safety

- A Submission is not public until Review and explicit publication succeed.
- PostgreSQL owns status, revisions, audit data, rate limits, and idempotency;
  Node owns authorization and orchestration.
- GitHub tokens, app keys, OpenAI keys, and full private Submission payloads are
  never sent to the browser or logged.
- Side effects have bounded retries, stable error codes, request IDs, and
  observable latency/status outcomes.
- Duplicate detection remains advisory unless the existing product policy says
  otherwise; it cannot silently discard a valid Submission.

## Rollout and rollback

Migrate validation and persistence parity before GitHub creation. Rollback uses
the previous known-good Node/frontend artifacts and must not require a schema
change or dual writes.

## Acceptance checks

- Anonymous, unconfirmed, suspended, and unauthorized Accounts receive stable
  refusals; confirmed contributors can submit within existing limits.
- Repeating an idempotency key never creates duplicate Submission rows or Review
  Issues.
- Provider failure preserves the stored Submission and exposes a retryable
  result.
- Review decisions, publication, revision history, and audit rows retain parity.
- GitHub adapter tests, integration tests, E2E smoke, secret scans, load/error
  metrics, and route rollback checks pass before enabling the path.

## Out of scope

Replacing Clerk, changing RLS/schema invariants, moving the static catalogue,
new AI model strategy, community Likes/promotion, or account deletion policy.
