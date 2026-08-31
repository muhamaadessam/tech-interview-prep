import assert from "node:assert/strict";
import { createServer } from "node:http";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import { exportJWK, SignJWT } from "jose";

import { createClerkAuth } from "./auth.ts";
import { createAccountPolicy, createSupabaseAccountRoleStore } from "./account-policy.ts";
import { accountPolicyEnabled, buildServer, selectRoute } from "./server.ts";

const issuer = "https://clerk.example";

async function keyPair(kid: string) {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  return { privateKey, jwk: { ...(await exportJWK(publicKey)), kid, alg: "RS256", use: "sig" } };
}

async function token(privateKey: Parameters<SignJWT["sign"]>[0], kid: string, claims: Record<string, unknown> = {}) {
  return new SignJWT(claims).setProtectedHeader({ alg: "RS256", kid, typ: "JWT" }).setIssuer(issuer).setSubject("user_123").setIssuedAt().setExpirationTime("5m").sign(privateKey);
}

async function jwksServer(jwks: () => unknown): Promise<{ url: string; close: () => Promise<void> }> {
  const server = createServer((_request, response) => {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ keys: jwks() }));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("JWKS server did not bind");
  return { url: `http://127.0.0.1:${address.port}/jwks.json`, close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) };
}

test("valid Clerk JWT creates trusted request context through the HTTP seam", async () => {
  const key = await keyPair("key-1");
  const jwks = await jwksServer(() => [key.jwk]);
  const auth = createClerkAuth({ jwksUrl: jwks.url, issuer });
  const policy = createAccountPolicy({ getRole: async () => ({ role: "learner", suspended: false }) });
  const app = await buildServer({ allowedOrigins: [], logger: { info: () => undefined }, auth, policy });
  app.get("/v1/protected", { preHandler: [app.authenticate, app.requireAuthenticated] }, async (request) => ({ sub: request.account?.sub }));

  const response = await app.inject({ method: "GET", url: "/v1/protected", headers: { authorization: `Bearer ${await token(key.privateKey, "key-1")}` } });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { sub: "user_123" });
  await app.close();
  await jwks.close();
});

test("unconfigured authentication fails closed", async () => {
  const app = await buildServer({ allowedOrigins: [] });
  app.get("/v1/protected", { preHandler: app.authenticate }, async () => ({ reached: true }));

  const response = await app.inject({ method: "GET", url: "/v1/protected" });
  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.json(), { error: "auth_not_configured" });
  await app.close();
});

test("Fastify, Clerk, Account policy, and Supabase adapter integrate through one route", async () => {
  const key = await keyPair("key-1");
  const jwks = await jwksServer(() => [key.jwk]);
  let role = { role: "moderator", suspended: false };
  const roleStore = createSupabaseAccountRoleStore({ url: "https://db.example", serviceRoleKey: "service-secret", fetchImpl: async () => new Response(JSON.stringify([role]), { status: 200 }) });
  let saved: { userId: string; token?: string } | undefined;
  const app = await buildServer({ allowedOrigins: [], auth: createClerkAuth({ jwksUrl: jwks.url, issuer }), policy: createAccountPolicy(roleStore), tracks: {
    listTracks: async () => [{ id: "flutter", slug: "flutter", name: "Flutter" }],
    getPreferences: async () => ({ tracks: [{ id: "flutter", slug: "flutter", name: "Flutter" }], preferences: [{ trackId: "flutter", isDefault: true }], unavailableTracks: [] }),
    savePreferences: async (userId, _trackIds, _defaultTrackId, token) => { saved = { userId, token }; },
  } });
  app.get("/v1/moderator", { preHandler: [app.authenticate, app.requireModerator] }, async () => ({ ok: true }));
  app.get("/v1/contribute", { preHandler: [app.authenticate, app.requireConfirmedEmail] }, async () => ({ ok: true }));
  const bearer = async (claims?: Record<string, unknown>) => `Bearer ${await token(key.privateKey, "key-1", claims)}`;

  assert.equal((await app.inject({ method: "GET", url: "/v1/moderator" })).statusCode, 401);
  assert.equal((await app.inject({ method: "GET", url: "/v1/moderator", headers: { authorization: await bearer() } })).statusCode, 200);
  assert.equal((await app.inject({ method: "GET", url: "/v1/me/track-preferences?locale=en", headers: { authorization: await bearer() } })).statusCode, 200);
  assert.equal((await app.inject({ method: "PUT", url: "/v1/me/track-preferences", headers: { authorization: await bearer(), "content-type": "application/json" }, payload: { trackIds: ["flutter"], defaultTrackId: "flutter" } })).statusCode, 204);
  assert.equal(saved?.userId, "user_123");
  role = { role: "moderator", suspended: true };
  assert.equal((await app.inject({ method: "GET", url: "/v1/moderator", headers: { authorization: await bearer() } })).statusCode, 403);
  role = { role: "learner", suspended: false };
  assert.equal((await app.inject({ method: "GET", url: "/v1/contribute", headers: { authorization: await bearer({ email_verified: false }) } })).statusCode, 403);
  assert.equal(accountPolicyEnabled("false"), false);
  assert.equal(accountPolicyEnabled("true"), true);
  assert.equal(selectRoute(false, "node", "edge"), "edge");
  assert.equal(selectRoute(true, "node", "edge"), "node");
  await app.close();
  await jwks.close();
});

test("missing, expired, wrong issuer, wrong algorithm, and bad signature are rejected", async () => {
  const key = await keyPair("key-1");
  const other = await keyPair("key-2");
  const jwks = await jwksServer(() => [key.jwk]);
  const auth = createClerkAuth({ jwksUrl: jwks.url, issuer });
  const logs: string[] = [];
  const app = await buildServer({ allowedOrigins: [], logger: { info: (line: string) => logs.push(line) } });
  app.get("/v1/protected", { preHandler: auth.preHandler }, async () => ({ reached: true }));
  const request = (authorization?: string, url = "/v1/protected") => app.inject({ method: "GET", url, ...(authorization ? { headers: { authorization } } : {}) });

  assert.deepEqual((await request()).json(), { error: "missing_bearer_token" });
  assert.equal((await request("Bearer malformed", "/v1/protected?token=secret-token")).statusCode, 401);
  assert.equal((await request(`Bearer ${await new SignJWT({}).setProtectedHeader({ alg: "RS256", kid: "key-1" }).setIssuer(issuer).setSubject("user_123").setExpirationTime("-1s").sign(key.privateKey)}`)).statusCode, 401);
  assert.equal((await request(`Bearer ${await new SignJWT({}).setProtectedHeader({ alg: "RS256", kid: "key-1" }).setIssuer(issuer).setSubject("user_123").setNotBefore("5m").setExpirationTime("10m").sign(key.privateKey)}`)).statusCode, 401);
  assert.equal((await request(`Bearer ${await new SignJWT({}).setProtectedHeader({ alg: "RS256", kid: "key-1" }).setIssuer("https://wrong.example").setSubject("user_123").setExpirationTime("5m").sign(key.privateKey)}`)).statusCode, 401);
  assert.equal((await request(`Bearer ${await new SignJWT({}).setProtectedHeader({ alg: "HS256", kid: "key-1" }).setIssuer(issuer).setSubject("user_123").setExpirationTime("5m").sign(new TextEncoder().encode("secret"))}`)).statusCode, 401);
  assert.equal((await request(`Bearer ${await token(other.privateKey, "key-1")}`)).statusCode, 401);
  assert.ok(logs.every((line) => !line.includes("secret-token") && !line.toLowerCase().includes("authorization") && !line.includes("?")));
  await app.close();
  await jwks.close();
});

test("unknown key IDs refresh the bounded JWKS cache", async () => {
  const first = await keyPair("key-1");
  const rotated = await keyPair("key-2");
  let current = first;
  const jwks = await jwksServer(() => [current.jwk]);
  const auth = createClerkAuth({ jwksUrl: jwks.url, issuer, cooldownDuration: 0 });
  const app = await buildServer({ allowedOrigins: [] });
  app.get("/v1/protected", { preHandler: auth.preHandler }, async (request) => ({ sub: request.account?.sub }));

  assert.equal((await app.inject({ method: "GET", url: "/v1/protected", headers: { authorization: `Bearer ${await token(first.privateKey, "key-1")}` } })).statusCode, 200);
  current = rotated;
  const response = await app.inject({ method: "GET", url: "/v1/protected", headers: { authorization: `Bearer ${await token(rotated.privateKey, "key-2")}` } });
  assert.equal(response.statusCode, 200);
  await app.close();
  await jwks.close();
});
