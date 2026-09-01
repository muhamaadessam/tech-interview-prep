# Backend capacity and performance runbook

## What is optimized in code

- Fastify limits request bodies to 256 KiB to bound per-connection memory.
- Upstream calls abort after `UPSTREAM_TIMEOUT_MS` (5 seconds by default).
- Set `TRUST_PROXY_HOPS=1` only when one trusted reverse proxy is in front of
  Node; leave it at `0` when Node is directly exposed.
- Public catalogue reads use the published/track indexes below; learner reads
  use account-scoped indexes. PostgreSQL remains the source of truth.
- Node routes keep stable rollback flags. No in-process cache is treated as a
  correctness layer, so replicas can scale horizontally without cache drift.

## Capacity model

50,000 open browser connections is not the same as 50,000 requests/second.
Before production, measure the real journey and derive:

`required replicas = ceil(peak requests/sec / measured requests/sec per replica)`

Budget database connections separately. Set the Supabase pooler limit so that
`replicas × pool-size` stays below the database connection budget, leaving room
for migrations, dashboards, and background jobs. Use the transaction pooler for
short REST/RPC calls; do not create one database client per request.

## Required load gates

Run the existing load harness against a deployed backend and frontend, increasing
stages until the first SLO failure:

```sh
npm run load:test -- --url https://staging.example \
  --users 1000,5000,10000,25000,50000 \
  --duration 60 --ramp 30 --think 250 --timeout 5000 \
  --p95 1000 --errors 1
```

Record p50/p95/p99, error rate, requests/sec, CPU, memory, event-loop delay,
upstream latency, database CPU, pool wait time, and cache hit rate (if a shared
cache is introduced). A 50k claim is valid only when the highest stage passes
with headroom and a second run reproduces it.

## Query verification

For each Node read route, capture `EXPLAIN (ANALYZE, BUFFERS)` on staging before
and after the index migration. Keep the plan and round-trip count with the
release record. Do not add a cache or replace the eight-read catalogue reader
with a large SQL view until measurements show those reads are the bottleneck.

## Rollback

Disable the relevant `NEXT_PUBLIC_NODE_API_ENABLED` operation flag and rebuild
the static frontend. Indexes are additive; leaving them in place is safe during
rollback and avoids a destructive migration under traffic.

## First staging deployment

The repository includes a Render blueprint at `/render.yaml`. Populate its
secret values in the host dashboard (never in the blueprint), deploy the
backend from the `backend/` root, then apply migrations from a controlled
operator environment:

```sh
supabase db push
npm run supabase:seed:check
```

Verify `GET /v1/ready` before routing frontend traffic. Start with one paid
replica, capture the baseline, then increase replicas only when CPU, event-loop
delay, or pool wait is the measured bottleneck.
