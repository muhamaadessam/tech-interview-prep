# Tech Interview Prep

Tech Interview Prep is an open-source, Arabic-first study platform for software engineering interviews. It currently ships a Flutter track with Dart and Flutter questions backed by official references.

## What is in the repository?

```text
src/                 Next.js static frontend and domain modules
backend/             Node/Fastify API deployed as a Vercel Function
supabase/             Server-side migrations and functions only
e2e/                 Playwright browser journeys
scripts/              Build, security, seed, and load-test utilities
.github/              CI, deployment, ownership, and contribution policy
```

The browser talks to the Node API under `/v1`. Supabase is an internal data provider behind that API; do not add direct Supabase calls to browser code.

## Local development

Requirements: Node.js 22 or newer.

```bash
npm install
npm ci --prefix backend
cp .env.example .env.local
npm run dev
```

The static site is available at `http://localhost:3000`. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env.local` only when you need to exercise authentication. Server-only backend values belong in the backend/Vercel environment and must never be committed.

## Verification

Run the same checks expected by CI before opening a pull request:

```bash
npm run backend:test
npm run typecheck
npm test
npm run build
npm run security:check
npm run test:e2e
```

Use `npm run load:test -- --url http://127.0.0.1:3000/ --users 10,25,50 --duration 10` for a small local load smoke. Capacity claims must be based on a deployed staging test, not a local run.

## Deployment

Pushing to `main` starts the configured Cloudflare Pages deployment for the frontend. The Node backend is deployed separately to Vercel. Production secrets and variables are managed in the hosting dashboards; GitHub Actions receives only the public build variables it needs.

## Contributing

Pull requests from forks and topic branches are welcome. `main` is protected: contributors cannot push directly, and merging requires an approved pull request, a review from the repository owner, and passing CI checks. Read [CONTRIBUTING.md](CONTRIBUTING.md) before starting work.

## Licenses

- Source code: [MIT](LICENSE)
- Original learning content: [CC BY 4.0](LICENSE-CONTENT)
- External references remain under their owners' terms.
