# Complete the Node backend cutover

The browser must use the Node `/v1` interface for every database read, mutation,
moderation action, advisory request, and submission. Supabase remains the
PostgreSQL provider and may host internal functions, but its URL, SDK, REST
interface, function interface, and credentials are forbidden in browser code and
browser bundles.

The temporary frontend route flag and direct-Supabase rollback adapters from
ADR-0003 are removed. Clerk session tokens are verified by Node; server-only RPCs
accept the verified Account ID and are executable only by `service_role`.
Rollback deploys previous frontend and backend artifacts together rather than
changing the browser's data provider.
