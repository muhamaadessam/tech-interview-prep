# Spec: Submission to Review

The Node backend is the only application seam for Submissions and Review.
After validation and persistence, `/v1/submissions` returns a bounded Prompt
that a contributor can send to any external AI agent. A Moderator pastes the
resulting bilingual JSON into `/v1/moderation/actions` for preview and explicit
confirmation. Confirmation creates a new Submission Revision and puts the
Submission into the existing Review queue; publication remains a separate
explicit action.

PostgreSQL remains the Submission and Question Revision source of truth. Clerk
identity and Moderator authorization remain server-owned. GitHub Issues,
comments, closing, and GitHub credentials are not part of the product flow.
Supabase remains storage accessed only by Node.

## Safety

- Persist before returning the Prompt; retries remain idempotent.
- Treat both Submission text and pasted JSON as untrusted input.
- Exclude email, Clerk IDs, tokens, and private Account data from Prompts.
- Enforce Track/Topic relationships, bilingual required fields, source URL
  rules, and existing content limits at the Node boundary.
- Preview is read-only; confirmation is authorized, audited, and repeat-safe.
- Imported content is never public until explicit publication succeeds.
- Legacy GitHub columns may remain for existing rows, but new product code does
  not read or write them.

## Acceptance checks

- Confirmed contributors receive a Prompt after a successful Submission.
- Duplicate idempotency keys do not create duplicate Submissions or revisions.
- Valid bilingual JSON previews and confirms; malformed or unsafe JSON fails
  with a stable error.
- Changes requested, rejection, and publication work without GitHub secrets or
  upstream GitHub calls.
- Browser bundles contain no Supabase credentials or product GitHub secrets.
