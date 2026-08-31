import { pathToFileURL } from "node:url";

import Fastify, { type FastifyInstance } from "fastify";

type LogSink = { info?: (line: string) => void; error?: (line: string) => void };

export type ServerOptions = {
  allowedOrigins: string[];
  ready?: boolean | (() => boolean | Promise<boolean>);
  logger?: LogSink;
};

function requestId(value: unknown): string {
  return typeof value === "string" && /^[a-zA-Z0-9._:-]{1,120}$/.test(value) ? value : crypto.randomUUID();
}

export async function buildServer({ allowedOrigins, ready = true, logger = console }: ServerOptions): Promise<FastifyInstance> {
  const origins = new Set(allowedOrigins.filter(Boolean));
  const startedAt = new WeakMap<object, bigint>();
  const app = Fastify({ logger: false, genReqId: (request) => requestId(request.headers["x-request-id"]) });

  app.addHook("onRequest", async (request, reply) => {
    startedAt.set(request, process.hrtime.bigint());
    const id = request.id;
    reply.header("x-request-id", id);
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

  app.setErrorHandler((error, _request, reply) => {
    const statusCode = typeof error === "object" && error !== null && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500;
    logger.error?.(JSON.stringify({ error: "request_failed", statusCode }));
    reply.code(statusCode >= 400 ? statusCode : 500).send({ error: "internal_error" });
  });
  return app;
}

async function main() {
  const app = await buildServer({ allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? "").split(",").map((origin) => origin.trim()), ready: true });
  const port = Number(process.env.PORT ?? 3000);
  await app.listen({ host: "0.0.0.0", port: Number.isInteger(port) && port > 0 ? port : 3000 });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
