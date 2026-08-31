# Supabase setup

This project remains a static Next.js export on Cloudflare Pages. Supabase supplies
the database, Row Level Security, and Edge Functions; Clerk owns authentication.
The browser only receives the public Supabase URL and two publishable keys.

## Provisioning checklist

1. Production project: `aptxrianhyxvdjnuyruo` (`eu-central-1`). Its URL and
   publishable key are stored as GitHub Actions variables named
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; Clerk's
   key is stored as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. Do not commit values or
   expose a service-role key.
   The Cloudflare Pages deployment currently uses Clerk Development until a
   custom domain is available and verified in Clerk Production.
2. Configure Google and email/password providers in Clerk. Allow these exact
   origins: `http://localhost:3000` and
   `https://tech-interview-prep-1ux.pages.dev`.
3. Configure Clerk's native Supabase integration before enabling RLS policies that
   depend on the signed-in Clerk user.
   The Clerk session token must include `role: authenticated`; the repository uses
   the `supabase` JWT template when available for browser RLS requests.
4. Store these Edge Function secrets: `CLERK_SECRET_KEY`,
   `GITHUB_APP_ID`, `GITHUB_INSTALLATION_ID`, `GITHUB_APP_PRIVATE_KEY`,
   `GITHUB_REPOSITORY_OWNER`, and `GITHUB_REPOSITORY_NAME`. The GitHub App only
   needs Issues: write for this repository.
   Also set `CLERK_JWKS_URL` and `CLERK_JWT_ISSUER` to the same Clerk instance;
   these are required for function-side JWT verification.
   Set `OPENAI_API_KEY` only as a Supabase Edge Function secret when enabling the
   moderator-triggered AI advisory review; never expose it to the browser.

## Local configuration

Copy `.env.example` to `.env.local` and fill in the Clerk and Supabase public
values. The static catalogue must continue to work when these values are empty so local
content development does not depend on production credentials.

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

The browser sync path requests the current Clerk session token through the native
Supabase Third-Party Auth integration and uses only the public Supabase URL and
publishable key. Keep moderator roles server-controlled through `account_roles` or
Clerk metadata; never grant browser clients write access to that table.

To apply the local project configuration, link once and push the migrations:

```sh
supabase link --project-ref aptxrianhyxvdjnuyruo
supabase db push
supabase db query --file supabase/seed.sql
supabase functions deploy submit-question
supabase functions deploy moderator-actions
supabase functions deploy account-delete
supabase functions deploy ai-advisory
```

The `submit-question` function performs its own Clerk JWT verification (the
Supabase gateway is configured not to validate this third-party token) and
checks the confirmed email,
enforces the five-per-day limit and cooldown, validates existing taxonomy, stores
the Submission and its first revision, then creates a GitHub Issue with the fixed
`community-submission` and `needs-review` labels. Missing GitHub/Clerk secrets
leave retries in the `failed` state without exposing privileged values.
Submission revisions and rate-limit counters are service-role-only tables; the
browser can read only its own Submission rows.

The `moderator-actions` function is the only write path for suspensions,
requesting changes, rejections, and unpublishing. It also serves the
oldest-first moderator queue used by `/ar/moderator` and `/en/moderator`. The
`account-delete` function removes private
account data and unpublished submissions, anonymizes published attribution,
records an append-only audit event, and then deletes the Clerk account. Both
functions require the same Clerk JWT settings and service-role key; GitHub App
secrets are needed for closing review Issues after a rejection. Audit rows carry
a 12-month expiry and are never exposed to browser roles. If Clerk deletion
temporarily fails, the function returns a retryable error after the database
cleanup; published attribution remains anonymized.

Publishing remains deliberately gated on a complete bilingual revision: a
moderator must create Arabic and English `question_revision_locales` rows and
select the immutable revision through `interview_questions.published_revision_id`.
Do not bypass the catalogue constraints with direct client writes.

The `ai-advisory` function is a moderator-only, server-side OpenAI `gpt-5-mini`
review. It reads one immutable Submission Revision, redacts obvious email/phone
values, stores the bounded result, and adds at most one marked advisory comment
to the existing GitHub Issue. It never changes moderation state, labels, Issue
status, revisions, or publication. Provider failures are retryable and leave the
Submission and its `needs-review` Issue untouched.

## Acceptance checks

- Anonymous catalogue reads work with RLS enabled.
- A Google account and a confirmed email/password account can sign in and sign
  out through Clerk from localhost and Cloudflare Pages.
- An unconfirmed account cannot submit a question.
- Browser bundles contain no service-role key, GitHub token, or private key.
- A failed Edge Function call does not lose the stored Submission and can be
  retried idempotently.
