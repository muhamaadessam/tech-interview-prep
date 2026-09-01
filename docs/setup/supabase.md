# Supabase setup

This project uses a static Next.js frontend, a Node backend on Vercel, Clerk
authentication, and Supabase PostgreSQL. The browser talks only to Node. Supabase
URLs and credentials are backend-only.

## Provisioning checklist

1. Production project: `aptxrianhyxvdjnuyruo` (`eu-central-1`). Store
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only in the Vercel backend.
   Cloudflare Pages receives only `NEXT_PUBLIC_API_URL` and Clerk's publishable
   key. The Cloudflare Pages deployment currently uses Clerk Development until a
   custom domain is available and verified in Clerk Production.
2. Configure Google and email/password providers in Clerk. Allow these exact
   origins: `http://localhost:3000` and
   `https://tech-interview-prep-1ux.pages.dev`.
3. Configure the backend Clerk JWKS URL and issuer. Node verifies the ordinary
   Clerk session token and passes the trusted Account ID to server-only database RPCs.
4. Store `CLERK_SECRET_KEY` and the Supabase service-role credentials only in
   the Node backend. No GitHub App or AI provider credentials are required.

## Local configuration

Copy `.env.example` to `.env.local`. The frontend needs the Clerk publishable key
and Node URL; only the backend receives Supabase credentials.

## Catalogue migration and seed

The schema lives in `supabase/migrations/20260830000000_catalogue.sql`. Generate
the repeatable import from the checked-in catalogue with:

```sh
npm run supabase:seed
npm run supabase:seed:check
```

Apply the migration and generated `supabase/seed.sql` with the Supabase CLI from
an authenticated environment. The seed preserves every existing question id and
slug, imports both `ar` and `en` locale rows, and publishes revision 1. Content
changes after the initial import must create a new revision instead of mutating a
published revision.

The browser sends the ordinary Clerk token to Node. Node owns authorization and
uses server credentials for database operations. Never expose Supabase credentials
or restore direct browser database access.

Apply the checked-in migrations and seed from an authenticated Supabase admin
environment:

```sh
supabase db push --project-ref aptxrianhyxvdjnuyruo
supabase db query --project-ref aptxrianhyxvdjnuyruo --file supabase/seed.sql
```

This repository contains no Supabase runtime, auth, or function deployment
configuration. Supabase is storage only, accessed by the Node backend.

The Node `/v1/submissions` route verifies the Clerk token and checks the confirmed email,
enforces the five-per-day limit and cooldown, validates existing taxonomy, stores
the Submission and its first revision, then returns a bounded AI-ready Prompt.
Submission revisions and rate-limit counters are service-role-only tables; the
browser can read only its own Submission rows.

The Node `/v1/moderation/actions` route is the only write path for suspensions,
JSON preview/confirmation, requesting changes, rejections, and unpublishing. It also serves the
oldest-first moderator queue used by `/ar/moderator` and `/en/moderator`. The
route uses the Clerk Account policy and service-role key. Audit rows carry a
12-month expiry and are never exposed to browser roles.

`DELETE /v1/me/account` removes private Account data, anonymizes published
attribution, records the audit event, and then deletes the Clerk Account.

Publishing remains deliberately gated on a complete bilingual revision: a
moderator must create Arabic and English `question_revision_locales` rows and
select the immutable revision through `interview_questions.published_revision_id`.
Do not bypass the catalogue constraints with direct client writes.

## Acceptance checks

- Anonymous catalogue reads work with RLS enabled.
- A Google account and a confirmed email/password account can sign in and sign
  out through Clerk from localhost and Cloudflare Pages.
- An unconfirmed account cannot submit a question.
- Browser bundles contain no Supabase URL/key, service-role key, GitHub token, or private key.
- A failed backend provider call does not lose the stored Submission and can be
  retried idempotently.
