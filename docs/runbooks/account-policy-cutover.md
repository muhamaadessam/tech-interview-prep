# Account policy cutover

The Node backend owns Clerk verification and Account policy when
`ACCOUNT_POLICY_ENABLED=true` (the default). It reads `SUPABASE_URL` and the
server-only `SUPABASE_SERVICE_ROLE_KEY` to resolve `account_roles`; those values
must never be exposed to the static frontend.

Migrated handlers select `selectRoute(accountPolicyEnabled(), nodeHandler,
legacyHandler)`. Track Preferences now use the Node route when
`NEXT_PUBLIC_NODE_API_ENABLED=true`; disabling that frontend flag is the rollback
seam to the existing Supabase path.

To roll back without a schema change, set `ACCOUNT_POLICY_ENABLED=false`, set
`NEXT_PUBLIC_NODE_API_ENABLED=false`, rebuild the static frontend, and restart
the backend. The frontend then uses its existing Supabase/Edge Function paths;
the deployed Edge Functions (`submit-question`, `moderator-actions`,
`account-delete`, and `ai-advisory`) remain the rollback implementations.

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
Edge Function deployment available until the new route has passed its smoke
checks and rollback flag has been tested.

The local load smoke on 2026-09-01 passed at 1 and 2 concurrent users (0% errors;
p95 389.7ms and 284.4ms respectively, under the 1000ms/1% default SLO). This is
a development baseline, not a capacity claim; rerun the full `README.md` load
profile against the deployed target before switching traffic. In the deployment
account, `supabase functions list` is the rollback deployability smoke; the four
existing Edge Functions must remain present before enabling the Node path.
