# Account policy cutover

The Node backend owns Clerk verification and Account policy when
`ACCOUNT_POLICY_ENABLED=true` (the default). It reads `SUPABASE_URL` and the
server-only `SUPABASE_SERVICE_ROLE_KEY` to resolve `account_roles`; those values
must never be exposed to the static frontend.

Every browser operation uses the Node `/v1` interface. There is no browser
rollback path to Supabase; rollback deploys the previous known-good frontend and
backend artifacts together.

To roll back Account policy only, set `ACCOUNT_POLICY_ENABLED=false` and restart
the backend. Do not reintroduce direct database access from the browser.

## Verification

```sh
npm run backend:test
npm run typecheck
npm test
npm run build
npm run security:check
npm run test:e2e
npm run load:test -- --url http://127.0.0.1:3000/ --users 1,2 --duration 1 --ramp 0 --think 0
```

The backend integration tests cover anonymous, authenticated, moderator,
suspended, unconfirmed, ownership, and service-role boundaries. Before a
production switch, run the E2E suite with the deployment's Clerk and Supabase
configuration, then inspect the built bundle for privileged values:

```sh
npm run security:check
```

Any match in `out/` or browser code is a release blocker. Keep the previous
deployment artifact available until the new routes pass smoke checks.

The local load smoke on 2026-09-01 passed at 1 and 2 concurrent users (0% errors;
p95 389.7ms and 284.4ms respectively, under the 1000ms/1% default SLO). This is
a development baseline, not a capacity claim; rerun the full `README.md` load
profile against the deployed target before switching traffic. The Node backend
is the only application path; Supabase is a database provider and migration
source only.
