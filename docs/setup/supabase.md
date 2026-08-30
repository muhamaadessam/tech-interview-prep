# Supabase setup

This project remains a static Next.js export on GitHub Pages. Supabase supplies
the database, Row Level Security, and Edge Functions; Clerk owns authentication.
The browser only receives the public Supabase URL and two publishable keys.

## Provisioning checklist

1. Production project: `aptxrianhyxvdjnuyruo` (`eu-central-1`). Its URL and
   publishable key are stored as GitHub Actions variables named
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; Clerk's
   key is stored as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. Do not commit values or
   expose a service-role key.
2. Configure Google and email/password providers in Clerk. Allow these exact
   origins: `http://localhost:3000` and
   `https://muhamaadessam.github.io/tech-interview-prep`.
3. Configure Clerk's JWT template / Supabase third-party auth integration before
   enabling RLS policies that depend on the signed-in Clerk user.
4. Store the GitHub App id, installation id, private key, repository owner, and
   repository name as Edge Function secrets. The GitHub App only needs Issues:
   write for this repository.

## Local configuration

Copy `.env.example` to `.env.local` and fill in the Clerk and Supabase public
values. The static catalogue must continue to work when these values are empty so local
content development does not depend on production credentials.

## Acceptance checks

- Anonymous catalogue reads work with RLS enabled.
- A Google account and a confirmed email/password account can sign in and sign
  out through Clerk from localhost and GitHub Pages.
- An unconfirmed account cannot submit a question.
- Browser bundles contain no service-role key, GitHub token, or private key.
- A failed Edge Function call does not lose the stored Submission and can be
  retried idempotently.
