# Introduce a Node backend as the application seam

The browser must no longer access Supabase or GitHub directly because authorization, validation, moderation, and side effects need one server-owned policy seam. We will add an independent TypeScript Node.js backend while keeping the static Next.js frontend, Clerk identity, and Supabase database; migration will be incremental, preserve URLs and behaviour first, retain the schema where practical, and begin with a Tracks and Track Preferences read-only vertical slice. PostgreSQL remains authoritative for data invariants, while Node owns request authorization and orchestration.

The seam will initially be a separate `api.` origin with explicit CORS, while frontend units migrate route-by-route behind one client and a temporary rollback flag. Clerk's JWT `sub` remains the canonical Account key; the first slice reads public Tracks and authenticated Track Preferences without moving preference writes.

The first mutation after that read slice is saving Track Preferences. Existing Edge Functions remain only as rollback implementations while their routes move to Node; GitHub Issue creation, AI advisory, moderation, community Likes/promotion, and full catalogue reads stay out of the first phase. No bootstrap response is introduced until repeated calls justify it.

The HTTP contract is versioned REST JSON under `/v1`, using Clerk Bearer tokens in `Authorization` and an exact CORS allowlist. The backend starts with structured logs, request IDs, latency/status metrics, and redaction; rate limits remain explicit at Node and in PostgreSQL, while idempotency is required for Submission/GitHub side effects rather than every request. A managed Node host is preferred initially, with a VPS retained as a documented alternative.

Fastify is the initial Node framework, with the existing frontend left at the repository root and a separate `backend/` application package rather than a new workspace layout. The first phase is accepted only after parity, integration/E2E, security checks, metrics, and a working route flag rollback; rollback changes routing only and does not require a schema migration. Direct browser access is removed only after each slice passes those checks and a code/bundle search confirms that Supabase secrets and GitHub credentials are server-only.

## Considered Options

- Keep direct browser-to-Supabase access: rejected because it leaves policy and secrets distributed across clients.
- Big-bang backend rewrite: rejected because it increases rollback and parity risk.
- Use the backend primarily to raise the load-test ceiling: rejected because recent flooding was caused by route prefetching rather than proven database JOIN pressure.
