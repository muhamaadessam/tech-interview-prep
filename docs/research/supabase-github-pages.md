# Supabase architecture with the GitHub Pages frontend

Research date: 2026-08-30

## Decision

Keep GitHub Pages for the public Next.js frontend and add Supabase as the
backend. The static site will use `@supabase/supabase-js` in the browser for
published catalogue reads and learner-owned data, while Clerk owns
authentication. Supabase Edge Functions will handle authenticated submissions
and the GitHub API call.
No Supabase secret/service key or GitHub credential may be shipped to the
browser.

This fits the current `output: "export"` build. It does not require moving to
a server-rendered host unless the product later needs server-rendered private
pages, Next.js API/Route Handlers, or request-time database reads.

## Evidence and constraints

| Question | Finding | Consequence |
| --- | --- | --- |
| Can Next.js remain on Pages? | Next.js static export emits an `out` directory of HTML/CSS/JS and supports client-side data fetching, but server features are not supported. [Next.js static exports](https://nextjs.org/docs/pages/guides/static-exports) · [Next.js SPAs](https://nextjs.org/docs/app/guides/single-page-applications) | Fetch Supabase data after hydration; do not add Next.js API routes, Server Actions, middleware, or SSR auth. |
| Is GitHub Pages suitable? | GitHub Pages publishes HTML, CSS, and JavaScript files, optionally after a build. [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) | Keep the existing GitHub Actions deployment and static `basePath`. |
| Can the browser use Supabase? | Supabase documents publishable/anon keys as browser-safe only with RLS enabled; secret/service-role keys bypass RLS and must never be in a browser. [Supabase environment variables](https://supabase.com/docs/guides/functions/secrets) · [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) | Expose only `NEXT_PUBLIC_SUPABASE_URL` and the publishable key. Protect every exposed table with explicit grants and RLS. |
| Does Auth cover the requested providers? | Clerk owns Google OAuth and email/password in this architecture. [Clerk authentication](https://clerk.com/docs/guides/secure/authentication) | Configure `http://localhost:3000` and `https://muhamaadessam.github.io/tech-interview-prep` as Clerk allowed origins. Use a Clerk JWT template for Supabase third-party auth before enforcing signed-in RLS. |
| Can a static client call an Edge Function? | Browser calls need CORS; authenticated function calls carry the user JWT and can keep JWT verification enabled. [CORS](https://supabase.com/docs/guides/functions/cors) · [Securing Edge Functions](https://supabase.com/docs/guides/functions/auth) | `submit-question` should require an authenticated user, validate input, and apply rate limits/idempotency. |
| Can the function open a GitHub Issue? | GitHub’s create-issue endpoint accepts GitHub App installation tokens and fine-grained tokens; repository Issues permission must be `write`. GitHub recommends App tokens for automation and says not to use a personal access token or password for a GitHub App. [Create an issue](https://docs.github.com/en/rest/issues/issues?apiVersion=latest) · [GitHub App best practices](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/best-practices-for-creating-a-github-app) | Prefer a GitHub App installed only on this repository with Issues: write. Keep its private key and installation details in Edge Function secrets. |

## Runtime topology

```text
Browser on GitHub Pages
  ├─ Clerk browser client + publishable key
  │   ├─ Auth (Google or email/password)
  │   └─ Clerk JWT for authenticated Supabase calls
  └─ Supabase browser client + publishable key
      ├─ public published Tracks/Topics/Interview Questions (RLS: anon SELECT)
      └─ learner progress/favorites (RLS: owner only)
  └─ supabase.functions.invoke("submit-question")
        ├─ verifies the Supabase user JWT
        ├─ validates and stores a Submission as pending
        ├─ creates a GitHub Issue through the GitHub App
        └─ stores issue number/URL and returns a safe result
```

The Submission write and GitHub call are not one database transaction. Store a
stable submission id before the external call, make retries idempotent, and
record `pending`, `issue_created`, or `failed` plus the last error. This keeps a
GitHub outage from losing a learner’s submission and avoids duplicate Issues.

## Required configuration

1. Supabase: project URL and publishable key as GitHub Actions variables.
   Clerk: publishable key, exact local/production origins, Google provider, and
   email/password settings.
2. Frontend build: public Supabase URL/key as GitHub Actions environment values
   (not committed secrets), and a static `/auth/callback/` route if PKCE is
   selected later. Client-only implicit auth is the smallest supported first
   implementation; PKCE remains available if the threat model requires it. [PKCE flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
3. Database: `tracks`, `topics`, `interview_questions`, translations/content
   fields, `question_progress`, `favorites`, `submissions`, and a moderator
   role/profile. Public catalogue rows need an explicit published predicate;
   user rows need `auth.uid()` ownership policies.
4. Edge Function secrets: GitHub App id/private key/installation id and fixed
   repository owner/name. Never pass any of them from the client request.

## Boundary and migration note

The existing local question catalogue can remain the fallback while Supabase is
introduced behind a data-access boundary. First migrate published content and
read it client-side; then migrate signed-in progress/favorites, preserving
local storage as an anonymous/offline fallback. The existing static build should
continue to work when Supabase configuration is absent so previews and local
content development do not depend on production credentials.

Move the frontend to a server-capable host only when one of these becomes a
real requirement: SSR/private route protection, Next.js server endpoints,
webhook receivers, or a need to hide all database reads behind a server. None
is required for the agreed first release.
