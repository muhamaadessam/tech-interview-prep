# Release validation

Run these checks before publishing a release:

```sh
npm run release:check
npm run test:e2e
```

`release:check` runs TypeScript validation, unit tests, the catalogue seed check,
the production static build, and `git diff --check`. Any failure blocks deploy.

Before a production cutover, also verify in the deployed environment:

- Clerk Production email/password and Google sign-in, redirect URLs, and allowed origins.
- Supabase Third-Party Auth accepts a Clerk Production token.
- `moderator-actions`, `submit-question`, and `account-delete` have their server-only secrets.
- Both `/ar/` and `/en/` deep links, RTL/LTR, mobile layout, keyboard focus, and the missing-question route.
- A moderator can review oldest-first, request changes, and reject a submission; publication is only complete after a bilingual revision is inserted and selected as `published_revision_id`.

Keep screenshots, command output, migration status, and rollback notes with the release. Never commit `.env.local` or service-role credentials.
