import assert from "node:assert/strict";
import test from "node:test";

import { buildServer } from "./server.ts";

test("health is public and returns process health", async () => {
  const app = await buildServer({ allowedOrigins: ["https://frontend.example"] });
  const response = await app.inject({ method: "GET", url: "/health" });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: "ok" });
  assert.match(response.headers["x-request-id"] as string, /^[a-z0-9-]+$/);
  await app.close();
});

test("versioned health and readiness routes are available", async () => {
  const app = await buildServer({ allowedOrigins: [], ready: true });
  assert.equal((await app.inject({ method: "GET", url: "/v1/health" })).statusCode, 200);
  assert.equal((await app.inject({ method: "GET", url: "/v1/ready" })).statusCode, 200);
  await app.close();
});

test("readiness is public and reports the configured process state", async () => {
  const app = await buildServer({ allowedOrigins: ["https://frontend.example"], ready: async () => true });
  const response = await app.inject({ method: "GET", url: "/ready" });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: "ready" });
  await app.close();
});

test("readiness returns 503 when a dependency check fails", async () => {
  const app = await buildServer({ allowedOrigins: [], ready: () => false });
  const response = await app.inject({ method: "GET", url: "/v1/ready" });

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.json(), { status: "not_ready" });
  await app.close();
});

test("CORS allows configured origins and rejects unknown origins", async () => {
  const app = await buildServer({ allowedOrigins: ["https://frontend.example"] });

  const allowed = await app.inject({ method: "OPTIONS", url: "/health", headers: { origin: "https://frontend.example", "access-control-request-method": "GET" } });
  assert.equal(allowed.statusCode, 204);
  assert.equal(allowed.headers["access-control-allow-origin"], "https://frontend.example");

  const denied = await app.inject({ method: "OPTIONS", url: "/health", headers: { origin: "https://evil.example", "access-control-request-method": "GET" } });
  assert.equal(denied.statusCode, 403);
  await app.close();
});

test("request IDs are accepted and returned without leaking authorization", async () => {
  const logs: string[] = [];
  const app = await buildServer({ allowedOrigins: ["https://frontend.example"], logger: { info: (line: string) => logs.push(line), error: (line: string) => logs.push(line) } });
  const response = await app.inject({ method: "GET", url: "/health?token=secret-token", headers: { "x-request-id": "request-123", authorization: "Bearer secret-token" } });

  assert.equal(response.headers["x-request-id"], "request-123");
  assert.ok(logs.every((line) => !line.includes("secret-token") && !line.toLowerCase().includes("authorization") && line.includes('"durationMs"')));
  await app.close();
});
