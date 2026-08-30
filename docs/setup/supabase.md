# Supabase setup

This project remains a static Next.js export on GitHub Pages. Supabase supplies
the database, Auth, Row Level Security, and Edge Functions; the browser only
receives the public URL and publishable key.

## Provisioning checklist

1. Create one Supabase project for production and record its URL and publishable
   key in GitHub Actions environment secrets. Do not commit either value to the
   repository; never expose a service-role key.
2. Add these Auth redirect URLs:
   - `http://localhost:3000/auth/callback/`
   - `https://muhamaadessam.github.io/tech-interview-prep/auth/callback/`
3. Enable Google and email/password providers. Enable email confirmation and
   configure the password-reset redirect to the same callback route.
4. Configure the Google OAuth client with the Supabase callback URL shown in
   the Supabase provider settings. Keep the client secret in Supabase only.
5. Store the GitHub App id, installation id, private key, repository owner, and
   repository name as Edge Function secrets. The GitHub App only needs Issues:
   write for this repository.

## Local configuration

Copy `.env.example` to `.env.local` and fill in the two public values. The
static catalogue must continue to work when these values are empty so local
content development does not depend on production credentials.

## Acceptance checks

- Anonymous catalogue reads work with RLS enabled.
- A Google account and a confirmed email/password account can sign in and sign
  out from localhost and GitHub Pages.
- An unconfirmed account cannot submit a question.
- Browser bundles contain no service-role key, GitHub token, or private key.
- A failed Edge Function call does not lose the stored Submission and can be
  retried idempotently.
