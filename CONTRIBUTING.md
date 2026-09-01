# Contributing to Tech Interview Prep

Thanks for helping improve the project. This repository is public, but the production branch is intentionally controlled so every change can be reviewed and tested.

## Branch and pull request policy

1. Fork the repository or create a topic branch from `main`.
2. Keep the branch focused. Use a descriptive name such as `feat/realtime-topic` or `fix/footer-layout`.
3. Open a pull request into `main`. Do not push directly to `main`.
4. Explain the user-visible change, the architectural impact, and the verification you ran.
5. Wait for CI and repository-owner review. Only the repository owner or an explicitly trusted maintainer may merge.

The `main` branch requires a pull request, at least one approval including the code owner review, and a passing `CI / validate` check. Force-pushes and branch deletion are disabled on `main`.

## Project structure

- `src/app/`: Next.js routes, shell, localized pages, and UI composition.
- `src/content/`: the checked-in Track, Topic, and Interview Question catalogue.
- `src/<domain>/`: small domain modules for search, progress, submissions, moderation, and Track Preferences.
- `backend/src/`: Node/Fastify API, Clerk verification, policy enforcement, and server-side data stores.
- `supabase/migrations/`: database schema and policies. These are consumed by the backend and must not be imported by frontend code.
- `e2e/`: Playwright journeys that exercise public browser seams.
- `scripts/`: release checks, seed generation, security checks, and load smoke tools.

Use the vocabulary in [`CONTEXT.md`](CONTEXT.md): Track, Topic, Interview Question, Submission, Review, Moderator, and Account have deliberate meanings.

## Data and security rules

- Browser data access goes through the Node `/v1` API. Never import a Supabase client or REST URL into `src/`.
- Keep Clerk publishable configuration in public build variables only; keep service-role keys, database URLs, and signing secrets server-side.
- Validate input at API boundaries and preserve the existing ownership, email-confirmation, moderator, and rate-limit policies.
- Do not include credentials or personal data in commits, issues, screenshots, or test fixtures.

## Before opening a PR

Run the relevant checks locally:

```bash
npm run backend:test
npm run typecheck
npm test
npm run build
npm run security:check
npm run test:e2e
```

For content changes, keep Arabic and English translations complete, preserve official HTTPS references, and update the appropriate content tests. For API changes, add a backend contract test and an integration-level browser test when the user-visible flow changes.

## Review expectations

Reviewers look for a small, coherent change, accessible RTL/LTR behavior, stable URL/query contracts, no direct browser-to-Supabase transport, and tests that fail if the behavior regresses. Please call out migrations, environment-variable changes, rollout risks, and any follow-up work in the pull request.

## Licensing

By contributing source code, you agree that it is released under the repository's [MIT License](LICENSE). By contributing interview learning content, you agree to publish it under [CC BY 4.0](LICENSE-CONTENT) as described by the submission flow.
