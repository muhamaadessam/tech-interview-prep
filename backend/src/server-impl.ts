import { pathToFileURL } from "node:url";

import Fastify, { type FastifyInstance } from "fastify";
import { AuthError, createClerkAuth, type ClerkAuth } from "./auth.ts";
import { createAccountPolicy, createSupabaseAccountRoleStore, PolicyError, type AccountRoleStore } from "./account-policy.ts";
import { createSupabaseTrackStore, TrackStoreError, type TrackStore } from "./tracks.ts";
import { createSupabaseCatalogueStore, CatalogueError, type CatalogueStore } from "./catalogue.ts";
import { createSupabaseLearnerStateStore, LearnerStateError, type LearnerState } from "./learner-state.ts";
import { createSupabaseSubmissionStore, SubmissionRouteError, type SubmissionRouteStore } from "./submissions.ts";
import { CommunityStoreError, createSupabaseCommunityStore, type CommunityStore } from "./community.ts";
import { createSupabaseOperations, OperationError, type Operations } from "./operations.ts";
import { createRateLimiter } from "./rate-limit.ts";

type LogSink = { info?: (line: string) => void; error?: (line: string) => void };

export type ServerOptions = {
  allowedOrigins: string[];
  ready?: boolean | (() => boolean | Promise<boolean>);
  logger?: LogSink;
  auth?: ClerkAuth;
  policy?: ReturnType<typeof createAccountPolicy>;
  tracks?: TrackStore;
  catalogue?: CatalogueStore;
  learnerState?: {
    read: (userId: string) => Promise<LearnerState>;
    write: (userId: string, state: LearnerState) => Promise<void>;
    readAsked: (questionIds: string[], userId?: string) => Promise<Record<string, { personalCount: number | null; interviewFrequency: number }>>;
    adjustAsked: (questionId: string, delta: -1 | 1, userId: string) => Promise<{ personalCount: number | null; interviewFrequency: number }>;
  };
  submission?: SubmissionRouteStore;
  community?: CommunityStore;
  operations?: Operations;
};

export function accountPolicyEnabled(value = process.env.ACCOUNT_POLICY_ENABLED): boolean {
  return value !== "false";
}

export function selectRoute<T>(enabled: boolean, next: T, legacy: T): T {
  return enabled ? next : legacy;
}

function requestId(value: unknown): string {
  return typeof value === "string" && /^[a-zA-Z0-9._:-]{1,120}$/.test(value) ? value : crypto.randomUUID();
}

function questionIds(value: unknown): string[] | null {
  if (typeof value !== "string") return null;
  const ids = [...new Set(value.split(",").map((id) => id.trim()).filter(Boolean))];
  return ids.length > 0 && ids.length <= 200 && ids.every((id) => /^[a-zA-Z0-9._:-]{1,120}$/.test(id)) ? ids : null;
}

export async function buildServer({ allowedOrigins, ready = true, logger = console, auth, policy, tracks, catalogue, learnerState, submission, community, operations }: ServerOptions): Promise<FastifyInstance> {
  const origins = new Set(allowedOrigins.filter(Boolean));
  const limiter = createRateLimiter({ limit: 300, windowMs: 60_000, maxKeys: 10_000 });
  const trustProxy = process.env.TRUST_PROXY_HOPS === "1";
  const startedAt = new WeakMap<object, bigint>();
  const app = Fastify({ logger: false, bodyLimit: 256 * 1024, trustProxy, genReqId: (request) => requestId(request.headers["x-request-id"]) });
  app.decorateRequest("account", null);
  app.decorate("authenticate", auth?.preHandler ?? (async () => { throw new AuthError("auth_not_configured"); }));
  const unavailablePolicy = async () => { throw new PolicyError("policy_not_configured", 503); };
  app.decorate("requireAuthenticated", policy?.requireAuthenticated ?? unavailablePolicy);
  app.decorate("requireModerator", policy?.requireModerator ?? unavailablePolicy);
  app.decorate("requireConfirmedEmail", policy?.requireConfirmedEmail ?? unavailablePolicy);
  app.decorate("requireOwnership", policy?.requireOwnership ?? unavailablePolicy);

  app.addHook("onRequest", async (request, reply) => {
    startedAt.set(request, process.hrtime.bigint());
    const id = request.id;
    reply.header("x-request-id", id);
    if ((request.url.startsWith("/v1/questions") || request.url.startsWith("/v1/tracks") || request.url.startsWith("/v1/submissions")) && !limiter.allow(`${request.ip}:${request.url.split("?")[0]}`)) {
      reply.code(429).send({ error: "rate_limit_exceeded" });
      return;
    }
    const origin = request.headers.origin;
    if (origin && !origins.has(origin)) {
      reply.code(403).send({ error: "cors_origin_denied" });
      return;
    }
    if (origin) {
      reply.header("access-control-allow-origin", origin);
      reply.header("vary", "Origin");
      reply.header("access-control-allow-headers", "Authorization, Content-Type, X-Request-Id");
      reply.header("access-control-allow-methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    }
    if (request.method === "OPTIONS") {
      reply.code(204).send();
    }
  });

  app.addHook("onResponse", async (request, reply) => {
    const start = startedAt.get(request);
    const durationMs = start === undefined ? undefined : Number(process.hrtime.bigint() - start) / 1_000_000;
    const url = new URL(request.url, "http://localhost").pathname;
    logger.info?.(JSON.stringify({ requestId: request.id, method: request.method, url, statusCode: reply.statusCode, durationMs }));
  });

  app.get("/health", async () => ({ status: "ok" }));
  app.get("/v1/health", async () => ({ status: "ok" }));
  app.get("/ready", async (_request, reply) => {
    const isReady = typeof ready === "function" ? await ready() : ready;
    if (!isReady) return reply.code(503).send({ status: "not_ready" });
    return { status: "ready" };
  });
  app.get("/v1/ready", async (_request, reply) => {
    const isReady = typeof ready === "function" ? await ready() : ready;
    if (!isReady) return reply.code(503).send({ status: "not_ready" });
    return { status: "ready" };
  });
  app.get("/v1/tracks", async (request, reply) => {
    if (!tracks) return reply.code(503).send({ error: "tracks_not_configured" });
    const locale = typeof (request.query as { locale?: unknown }).locale === "string" ? (request.query as { locale: string }).locale : "en";
    return { tracks: await tracks.listTracks(locale) };
  });
  app.get("/v1/me/track-preferences", { preHandler: [app.authenticate, app.requireAuthenticated] }, async (request, reply) => {
    if (!tracks) return reply.code(503).send({ error: "tracks_not_configured" });
    const locale = typeof (request.query as { locale?: unknown }).locale === "string" ? (request.query as { locale: string }).locale : "en";
    return tracks.getPreferences(request.account!.sub, locale);
  });
  app.put("/v1/me/track-preferences", { preHandler: [app.authenticate, app.requireAuthenticated] }, async (request, reply) => {
    if (!tracks) return reply.code(503).send({ error: "tracks_not_configured" });
    const body = request.body as { trackIds?: unknown; defaultTrackId?: unknown };
    if (!Array.isArray(body?.trackIds) || !body.trackIds.every((id) => typeof id === "string") || typeof body.defaultTrackId !== "string") return reply.code(400).send({ error: "invalid_track_preferences" });
    await tracks.savePreferences(request.account!.sub, body.trackIds, body.defaultTrackId);
    return reply.code(204).send();
  });
  app.get("/v1/questions/:slug", async (request, reply) => {
    if (!catalogue) return reply.code(503).send({ error: "catalogue_not_configured" });
    const { slug } = request.params as { slug?: unknown };
    const locale = (request.query as { locale?: unknown }).locale;
    if (typeof slug !== "string" || !slug || (locale !== "ar" && locale !== "en")) return reply.code(400).send({ error: "invalid_question_request" });
    return catalogue.getQuestion(slug, locale);
  });
  app.get("/v1/community/questions", async (request, reply) => {
    if (!community) return reply.code(503).send({ error: "community_not_configured" });
    const { trackId, locale } = request.query as { trackId?: unknown; locale?: unknown };
    if (typeof trackId !== "string" || !trackId || (locale !== "ar" && locale !== "en")) return reply.code(400).send({ error: "invalid_community_request" });
    return { questions: await community.listQuestions(trackId, locale) };
  });
  app.get("/v1/me/community-likes", { preHandler: [app.authenticate, app.requireAuthenticated] }, async (request, reply) => {
    if (!community) return reply.code(503).send({ error: "community_not_configured" });
    const ids = questionIds((request.query as { questionIds?: unknown }).questionIds);
    if (!ids) return reply.code(400).send({ error: "invalid_question_ids" });
    return { questionIds: await community.likedQuestionIds(ids, request.account!.sub) };
  });
  app.post("/v1/questions/:questionId/like", { preHandler: [app.authenticate, app.requireAuthenticated, app.requireConfirmedEmail] }, async (request, reply) => {
    if (!community) return reply.code(503).send({ error: "community_not_configured" });
    const questionId = (request.params as { questionId?: unknown }).questionId;
    const liked = (request.body as { liked?: unknown })?.liked;
    if (typeof questionId !== "string" || !questionId || typeof liked !== "boolean") return reply.code(400).send({ error: "invalid_like_request" });
    return community.setLike(questionId, liked, request.account!.sub);
  });
  app.get("/v1/me/moderator-access", { preHandler: [app.authenticate, app.requireAuthenticated] }, async (request) => {
    try {
      await app.requireModerator(request);
      return { allowed: true };
    } catch (error) {
      if (error instanceof PolicyError && error.statusCode === 403) return { allowed: false };
      throw error;
    }
  });
  app.post("/v1/moderation/actions", { preHandler: [app.authenticate, app.requireModerator] }, async (request, reply) => {
    if (!operations) return reply.code(503).send({ error: "moderation_not_configured" });
    const body = request.body;
    if (!body || typeof body !== "object" || Array.isArray(body) || typeof (body as { action?: unknown }).action !== "string") return reply.code(400).send({ error: "invalid_moderation_request" });
    return operations.moderate(body as Record<string, unknown>, request.account!.token!);
  });
  app.post("/v1/advisories", { preHandler: [app.authenticate, app.requireModerator] }, async (request, reply) => {
    if (!operations) return reply.code(503).send({ error: "advisory_not_configured" });
    const submissionId = (request.body as { submissionId?: unknown })?.submissionId;
    if (typeof submissionId !== "string" || !submissionId || submissionId.length > 120) return reply.code(400).send({ error: "invalid_advisory_request" });
    return operations.advise(submissionId, request.account!.token!);
  });
  app.get("/v1/asked-markers", async (request, reply) => {
    if (!learnerState) return reply.code(503).send({ error: "learner_state_not_configured" });
    const ids = questionIds((request.query as { questionIds?: unknown }).questionIds);
    if (!ids) return reply.code(400).send({ error: "invalid_question_ids" });
    return learnerState.readAsked(ids);
  });
  app.get("/v1/me/asked-markers", { preHandler: [app.authenticate, app.requireAuthenticated] }, async (request, reply) => {
    if (!learnerState) return reply.code(503).send({ error: "learner_state_not_configured" });
    const ids = questionIds((request.query as { questionIds?: unknown }).questionIds);
    if (!ids) return reply.code(400).send({ error: "invalid_question_ids" });
    return learnerState.readAsked(ids, request.account!.sub);
  });
  app.get("/v1/me/learner-state", { preHandler: [app.authenticate, app.requireAuthenticated] }, async (request, reply) => {
    if (!learnerState) return reply.code(503).send({ error: "learner_state_not_configured" });
    return learnerState.read(request.account!.sub);
  });
  app.put("/v1/me/learner-state", { preHandler: [app.authenticate, app.requireAuthenticated] }, async (request, reply) => {
    if (!learnerState) return reply.code(503).send({ error: "learner_state_not_configured" });
    const body = request.body as { progress?: unknown; favorites?: unknown };
    if (!Array.isArray(body?.progress) || !Array.isArray(body?.favorites)) return reply.code(400).send({ error: "invalid_learner_state" });
    const progress = body.progress.flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const value = row as { questionId?: unknown; progress?: unknown };
      return typeof value.questionId === "string" && (value.progress === "not-started" || value.progress === "reviewing" || value.progress === "mastered") ? [{ questionId: value.questionId, progress: value.progress as LearnerState["progress"][number]["progress"] }] : [];
    });
    const favorites = body.favorites.filter((id): id is string => typeof id === "string");
    if (progress.length !== body.progress.length || favorites.length !== body.favorites.length) return reply.code(400).send({ error: "invalid_learner_state" });
    await learnerState.write(request.account!.sub, { progress, favorites });
    return reply.code(204).send();
  });
  app.post("/v1/questions/:questionId/asked-marker", { preHandler: [app.authenticate, app.requireAuthenticated] }, async (request, reply) => {
    if (!learnerState) return reply.code(503).send({ error: "learner_state_not_configured" });
    const questionId = (request.params as { questionId?: unknown }).questionId;
    const delta = (request.body as { delta?: unknown })?.delta;
    if (typeof questionId !== "string" || !questionId || (delta !== -1 && delta !== 1)) return reply.code(400).send({ error: "invalid_asked_marker" });
    return learnerState.adjustAsked(questionId, delta, request.account!.sub);
  });
  app.post("/v1/submissions", { preHandler: [app.authenticate, app.requireAuthenticated, app.requireConfirmedEmail] }, async (request, reply) => {
    if (!submission) return reply.code(503).send({ error: "submission_not_configured" });
    return submission.submit(request.body as never, request.account!.token);
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AuthError) {
      reply.code(error.statusCode).send({ error: error.code });
      return;
    }
    if (error instanceof PolicyError) {
      reply.code(error.statusCode).send({ error: error.code });
      return;
    }
    if (error instanceof TrackStoreError) {
      reply.code(error.status).send({ error: error.code });
      return;
    }
    if (error instanceof CatalogueError) {
      reply.code(error.status).send({ error: error.code });
      return;
    }
    if (error instanceof LearnerStateError) {
      reply.code(error.status).send({ error: error.code });
      return;
    }
    if (error instanceof SubmissionRouteError) {
      reply.code(error.status).send({ error: error.code });
      return;
    }
    if (error instanceof CommunityStoreError) {
      reply.code(error.status).send({ error: error.code });
      return;
    }
    if (error instanceof OperationError) {
      reply.code(error.status).send({ error: error.code });
      return;
    }
    const statusCode = typeof error === "object" && error !== null && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500;
    logger.error?.(JSON.stringify({ error: "request_failed", statusCode }));
    reply.code(statusCode >= 400 ? statusCode : 500).send({ error: "internal_error" });
  });
  return app;
}

export async function createProductionServer() {
  const jwksUrl = process.env.CLERK_JWKS_URL;
  const issuer = process.env.CLERK_JWT_ISSUER;
  const auth = jwksUrl && issuer ? createClerkAuth({ jwksUrl, issuer }) : undefined;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const roleStore: AccountRoleStore | undefined = supabaseUrl && serviceRoleKey ? createSupabaseAccountRoleStore({ url: supabaseUrl, serviceRoleKey }) : undefined;
  const moderatorUserIds = (process.env.MODERATOR_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  const policy = accountPolicyEnabled() && roleStore ? createAccountPolicy(roleStore, moderatorUserIds) : undefined;
  const tracks = supabaseUrl && serviceRoleKey ? createSupabaseTrackStore({ url: supabaseUrl, serviceRoleKey }) : undefined;
  const catalogue = supabaseUrl && serviceRoleKey ? createSupabaseCatalogueStore({ url: supabaseUrl, serviceRoleKey }) : undefined;
  const learnerState = supabaseUrl && serviceRoleKey ? createSupabaseLearnerStateStore({ url: supabaseUrl, serviceRoleKey }) : undefined;
  const submission = supabaseUrl && serviceRoleKey ? createSupabaseSubmissionStore({ url: supabaseUrl, serviceRoleKey }) : undefined;
  const community = supabaseUrl && serviceRoleKey ? createSupabaseCommunityStore({ url: supabaseUrl, serviceRoleKey }) : undefined;
  const operations = supabaseUrl && serviceRoleKey ? createSupabaseOperations({ url: supabaseUrl, serviceRoleKey }) : undefined;
  return buildServer({ allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? "").split(",").map((origin) => origin.trim()), ready: true, auth, policy, tracks, catalogue, learnerState, submission, community, operations });
}

async function main() {
  const app = await createProductionServer();
  const shutdown = async () => { try { await app.close(); } finally { process.exitCode = 0; } };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
  const port = Number(process.env.PORT ?? 3000);
  await app.listen({ host: "0.0.0.0", port: Number.isInteger(port) && port > 0 ? port : 3000 });
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: ClerkAuth["preHandler"];
    requireAuthenticated: ReturnType<typeof createAccountPolicy>["requireAuthenticated"];
    requireModerator: ReturnType<typeof createAccountPolicy>["requireModerator"];
    requireConfirmedEmail: ReturnType<typeof createAccountPolicy>["requireConfirmedEmail"];
    requireOwnership: ReturnType<typeof createAccountPolicy>["requireOwnership"];
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
