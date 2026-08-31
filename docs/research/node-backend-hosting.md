# Node.js 22 hosting for the independent backend

Research date: 2026-09-01

## Decision

Use a managed web-service host for the first `api.` deployment. Render is the
best fit for the agreed first phase: it can run a stateless TypeScript/Fastify
web service from the existing repository, pin Node.js 22, store backend-only
secrets, expose HTTPS, and perform readiness checks without adding an
operations layer to the migration.

Keep Hetzner Cloud as the documented VPS alternative, not as the first
deployment target. It can run the same Node.js 22 container or process with
more control and potentially lower baseline cost, but the project would own
the process supervisor, TLS/reverse proxy, patching, monitoring, backups, and
failure recovery that Render supplies as platform features.

Node.js 22 remains an official LTS line in the Node.js release table. Pin the
exact major/minor/patch version rather than accepting a moving `latest` value;
Render explicitly warns that an unbounded version range can change over time.
[Node.js release schedule](https://nodejs.org/en/about/previous-releases) ·
[Render Node.js version selection](https://render.com/docs/node-version)

## Options

| Option | Runtime and deployment | Secrets and health | Regions and frontend fit | Main trade-off |
| --- | --- | --- | --- | --- |
| **Render Web Service (recommended)** | Native JavaScript/TypeScript runtime, or Docker; configure build/start commands; connect the GitHub repository for automatic deploys. Pin Node 22 with `NODE_VERSION`, `.node-version`, `.nvmrc`, or a bounded `engines` range. [Web Services](https://render.com/docs/web-services) · [Native Runtimes](https://render.com/docs/native-runtimes) · [Node.js version](https://render.com/docs/node-version) | Dashboard/Blueprint environment variables, secret files, and environment groups; HTTP health-check path; failed new deploys are not routed and unhealthy instances can be restarted. [Environment variables and secrets](https://render.com/docs/configure-environment-variables) · [Health Checks](https://render.com/docs/health-checks) | Oregon, Ohio, Virginia, Frankfurt, and Singapore; Render static sites use a global CDN, while a web service runs in one selected region. A custom domain gets managed TLS and HTTP→HTTPS redirect, so `https://api.example.com` can be called by the Cloudflare Pages origin after exact CORS configuration. [Regions](https://render.com/docs/regions) · [Custom domains](https://render.com/docs/custom-domains) | Lowest operational burden. Do not use the Free plan for production: it spins down after 15 minutes idle and can take about a minute to wake. [Free instances](https://render.com/docs/free) |
| **Hetzner Cloud VPS (fallback)** | A Cloud Server is a VM where the project selects an OS and runs its own programs; use a pinned official Node 22 image in Docker or install Node 22 directly. Deploy via CI/SSH or a self-managed image pipeline. [Cloud Servers overview](https://docs.hetzner.com/cloud/servers/overview/) · [Official Node Docker image](https://github.com/nodejs/docker-node) | No equivalent application platform is assumed by the cited server docs. The project must choose and operate secret injection, process supervision, HTTP health checks, alerting, TLS, patching, backups, and recovery; Hetzner supplies server-level firewall controls. [Hetzner Firewalls](https://docs.hetzner.com/cloud/firewalls/getting-started/creating-a-firewall/) | Falkenstein, Nuremberg, Helsinki, Ashburn, Hillsboro, and Singapore. A public `api.` hostname is possible, but HTTPS termination and renewal must be operated on the VM or delegated to another edge/CDN. [Locations](https://docs.hetzner.com/cloud/general/locations/) | Maximum control and portability, but materially higher operational ownership and a larger failure surface during the first migration. |

## Render implementation fit

The minimal Render shape is one stateless Web Service rooted at `backend/`:

```text
Cloudflare Pages frontend
        │ HTTPS fetch, exact CORS allowlist
        ▼
https://api.example.com (Render Web Service)
        │ Node.js 22 + Fastify
        ▼
Supabase PostgreSQL / Clerk / later GitHub side effects
```

Render supports a repository subdirectory as the service root and separates
the build and start commands. That matches the ADR's separate `backend/`
package without forcing a new workspace layout. The first deployment should
use a paid stateless service, a bounded Node 22 version, and a health endpoint
that verifies process readiness (and, when appropriate, a lightweight
database connectivity check). [Your First Render Deploy](https://render.com/docs/your-first-deploy) ·
[Health Checks](https://render.com/docs/health-checks)

Recommended environment categories:

| Category | Examples | Browser exposure |
| --- | --- | --- |
| Public runtime | `NODE_ENV`, `PORT`, log level | None required; keep API configuration server-side |
| Clerk server credentials | Clerk secret/JWT verification configuration | Never |
| Supabase server credentials | URL plus server-only publishable/service credentials as required by the chosen data-access path | Never |
| CORS policy | Exact Cloudflare Pages production origin and local development origin | Not a secret, but server-owned |
| External side effects | GitHub App credentials, later AI provider keys | Never; out of the first slice |

Do not put secret values in `render.yaml`; Render's documentation explicitly
recommends placeholders there and populating secret values through the
Dashboard/environment configuration. [Environment variables and secrets](https://render.com/docs/configure-environment-variables)

## Hetzner fallback minimum

If the project later chooses the VPS, keep the application contract identical:
same `/v1` paths, same health endpoint, same CORS allowlist, and same server
only secrets. The additional operational checklist is the reason it is a
fallback rather than the first host:

1. Build from the official Node 22 image or a pinned Node 22 release and run
   the compiled Fastify process as a non-root user.
2. Bind only the application port locally; expose 80/443 through a maintained
   TLS/reverse-proxy setup and restrict other inbound traffic with a Hetzner
   Firewall.
3. Add a process supervisor, deploy rollback, log retention, health probing,
   alerting, OS/security updates, and tested backups before production use.
4. Place the VM near the Supabase project and primary learners, then measure
   API-to-database latency rather than choosing a region by name alone.

The Hetzner documentation confirms that locations are distinct network zones
and that cross-zone traffic is billed; this makes a single-region first
deployment the simpler default. [Hetzner locations](https://docs.hetzner.com/cloud/general/locations/)

## Recommendation for the ADR

The managed-host preference earns its complexity reduction here. Render gives
the first vertical slice deploy, secret storage, managed TLS, readiness checks,
zero-downtime deploy behaviour, and rollback primitives in the same host model
without changing the frontend's static Cloudflare Pages deployment. Start in
Frankfurt when it is close to the Supabase project and measured user traffic;
otherwise choose the nearest available Render region and record the latency
measurement.

Do not design for multi-region API instances yet. The first slice is a single
stateless service with a rollbackable route flag; add a second region only when
latency, availability, or load measurements justify the operational and data
consistency cost.

## Sources

- [Node.js Releases](https://nodejs.org/en/about/previous-releases)
- [Render Web Services](https://render.com/docs/web-services)
- [Render Native Runtimes](https://render.com/docs/native-runtimes)
- [Render Node.js version selection](https://render.com/docs/node-version)
- [Render Regions](https://render.com/docs/regions)
- [Render Environment Variables and Secrets](https://render.com/docs/configure-environment-variables)
- [Render Health Checks](https://render.com/docs/health-checks)
- [Render Deploying](https://render.com/docs/deploys)
- [Render Custom Domains](https://render.com/docs/custom-domains)
- [Render Free Instances](https://render.com/docs/free)
- [Hetzner Cloud Servers overview](https://docs.hetzner.com/cloud/servers/overview/)
- [Hetzner Cloud locations](https://docs.hetzner.com/cloud/general/locations/)
- [Hetzner Cloud Firewalls](https://docs.hetzner.com/cloud/firewalls/getting-started/creating-a-firewall/)
- [Node.js official Docker image](https://github.com/nodejs/docker-node)
