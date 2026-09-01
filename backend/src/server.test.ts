import assert from "node:assert/strict";
import test from "node:test";

import { PolicyError } from "./account-policy.ts";
import { buildServer } from "./server-impl.ts";

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

test("public Track route delegates to the configured store", async () => {
  let locale = "";
  const app = await buildServer({ allowedOrigins: [], tracks: { listTracks: async (value) => { locale = value; return [{ id: "flutter", slug: "flutter", name: "Flutter" }]; }, getPreferences: async () => ({ tracks: [], preferences: [], unavailableTracks: [] }), savePreferences: async () => undefined } });
  const response = await app.inject({ method: "GET", url: "/v1/tracks?locale=ar" });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { tracks: [{ id: "flutter", slug: "flutter", name: "Flutter" }] });
  assert.equal(locale, "ar");
  await app.close();
});

test("public question route delegates locale and slug to the catalogue", async () => {
  let received = "";
  const app = await buildServer({ allowedOrigins: [], catalogue: { getQuestion: async (slug, locale) => { received = `${slug}:${locale}`; return { id: "q1", slug, trackId: "flutter", topicIds: ["dart"], topicNames: ["Dart"], difficulty: "Junior", lastReviewedAt: "2026-08-30", translations: { ar: { question: "س", shortAnswer: "ج", explanation: "ش", commonMistakes: [], followUpQuestions: [], sources: [] }, en: { question: "q", shortAnswer: "a", explanation: "e", commonMistakes: [], followUpQuestions: [], sources: [] } } }; } } });
  const response = await app.inject({ method: "GET", url: "/v1/questions/source?locale=en" });
  assert.equal(response.statusCode, 200);
  assert.equal(received, "source:en");
  assert.equal((await app.inject({ method: "GET", url: "/v1/questions/source?locale=fr" })).statusCode, 400);
  await app.close();
});

test("Asked Marker HTTP interface keeps public frequency and Account state behind Node", async () => {
  const calls: Array<{ ids?: string[]; userId?: string; questionId?: string; delta?: number }> = [];
  const learnerState = {
    read: async () => ({ progress: [], favorites: [] }),
    write: async () => undefined,
    readAsked: async (ids: string[], userId?: string) => { calls.push({ ids, userId }); return Object.fromEntries(ids.map((id) => [id, { personalCount: userId ? 2 : null, interviewFrequency: 7 }])); },
    adjustAsked: async (questionId: string, delta: -1 | 1, userId: string) => { calls.push({ questionId, delta, userId }); return { personalCount: 3, interviewFrequency: 8 }; },
  };
  const auth = { preHandler: async (request: Parameters<NonNullable<Parameters<typeof buildServer>[0]["auth"]>["preHandler"]>[0]) => { request.account = { sub: "account-1", claims: {}, token: "token" }; } };
  const policy = { requireAuthenticated: async () => undefined, requireModerator: async () => undefined, requireConfirmedEmail: async () => undefined, requireOwnership: async () => "account-1" };
  const app = await buildServer({ allowedOrigins: [], auth, policy, learnerState });

  assert.deepEqual((await app.inject({ method: "GET", url: "/v1/asked-markers?questionIds=q1,q2,q1" })).json(), { q1: { personalCount: null, interviewFrequency: 7 }, q2: { personalCount: null, interviewFrequency: 7 } });
  assert.deepEqual((await app.inject({ method: "GET", url: "/v1/me/asked-markers?questionIds=q1" })).json(), { q1: { personalCount: 2, interviewFrequency: 7 } });
  assert.deepEqual((await app.inject({ method: "POST", url: "/v1/questions/q1/asked-marker", payload: { delta: 1 } })).json(), { personalCount: 3, interviewFrequency: 8 });
  assert.deepEqual(calls, [
    { ids: ["q1", "q2"], userId: undefined },
    { ids: ["q1"], userId: "account-1" },
    { questionId: "q1", delta: 1, userId: "account-1" },
  ]);
  await app.close();
});

test("Community Question HTTP interface owns catalogue and Like traffic", async () => {
  const calls: unknown[] = [];
  const community = {
    listQuestions: async (trackId: string, locale: "ar" | "en") => { calls.push(["list", trackId, locale]); return [{ id: "q1", slug: "community", trackId, database: true as const, topicIds: ["dart"], difficulty: "Junior" as const, question: "Q", shortAnswer: "A", visibility: "community" as const, contributorUsername: "Contributor", likeCount: 4, promotedAt: null, publishedAt: null, likedByViewer: false }]; },
    likedQuestionIds: async (questionIds: string[], userId: string) => { calls.push(["liked", questionIds, userId]); return ["q1"]; },
    setLike: async (questionId: string, liked: boolean, userId: string) => { calls.push(["set", questionId, liked, userId]); return { liked, likeCount: 5, promoted: false }; },
  };
  const auth = { preHandler: async (request: Parameters<NonNullable<Parameters<typeof buildServer>[0]["auth"]>["preHandler"]>[0]) => { request.account = { sub: "account-1", claims: { email_verified: true }, token: "token" }; } };
  const policy = { requireAuthenticated: async () => undefined, requireModerator: async () => undefined, requireConfirmedEmail: async () => undefined, requireOwnership: async () => "account-1" };
  const app = await buildServer({ allowedOrigins: [], auth, policy, community });

  const catalogue = await app.inject({ method: "GET", url: "/v1/community/questions?trackId=flutter&locale=en" });
  assert.equal(catalogue.statusCode, 200);
  assert.equal(catalogue.json().questions[0].id, "q1");
  assert.deepEqual((await app.inject({ method: "GET", url: "/v1/me/community-likes?questionIds=q1,q2" })).json(), { questionIds: ["q1"] });
  assert.deepEqual((await app.inject({ method: "POST", url: "/v1/questions/q1/like", payload: { liked: true } })).json(), { liked: true, likeCount: 5, promoted: false });
  assert.deepEqual(calls, [["list", "flutter", "en"], ["liked", ["q1", "q2"], "account-1"], ["set", "q1", true, "account-1"]]);
  await app.close();
});

test("Moderator HTTP interface owns access checks, actions, and advisory traffic", async () => {
  const calls: unknown[] = [];
  const operations = {
    moderate: async (body: Record<string, unknown>, token: string) => { calls.push(["moderate", body, token]); return { submissions: [] }; },
    advise: async (submissionId: string, token: string) => { calls.push(["advise", submissionId, token]); return { status: "completed", commentId: 42 }; },
  };
  const auth = { preHandler: async (request: Parameters<NonNullable<Parameters<typeof buildServer>[0]["auth"]>["preHandler"]>[0]) => { request.account = { sub: "moderator-1", claims: {}, token: "clerk-token" }; } };
  const policy = { requireAuthenticated: async () => undefined, requireModerator: async () => undefined, requireConfirmedEmail: async () => undefined, requireOwnership: async () => "moderator-1" };
  const app = await buildServer({ allowedOrigins: [], auth, policy, operations });

  assert.deepEqual((await app.inject({ method: "GET", url: "/v1/me/moderator-access" })).json(), { allowed: true });
  assert.deepEqual((await app.inject({ method: "POST", url: "/v1/moderation/actions", payload: { action: "list_submissions" } })).json(), { submissions: [] });
  assert.deepEqual((await app.inject({ method: "POST", url: "/v1/advisories", payload: { submissionId: "submission-1" } })).json(), { status: "completed", commentId: 42 });
  assert.deepEqual(calls, [["moderate", { action: "list_submissions" }, "clerk-token"], ["advise", "submission-1", "clerk-token"]]);
  await app.close();
});

test("moderator access reports a normal learner as denied without a failed request", async () => {
  const auth = { preHandler: async (request: Parameters<NonNullable<Parameters<typeof buildServer>[0]["auth"]>["preHandler"]>[0]) => { request.account = { sub: "learner-1", claims: {}, token: "token" }; } };
  const policy = { requireAuthenticated: async () => undefined, requireModerator: async () => { throw new PolicyError("moderator_required"); }, requireConfirmedEmail: async () => undefined, requireOwnership: async () => "learner-1" };
  const app = await buildServer({ allowedOrigins: [], auth, policy });

  const response = await app.inject({ method: "GET", url: "/v1/me/moderator-access" });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { allowed: false });
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
