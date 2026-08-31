import assert from "node:assert/strict";
import { createServer } from "node:http";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import { exportJWK, SignJWT } from "jose";

import { createClerkAuth } from "./auth.ts";
import { createAccountPolicy } from "./account-policy.ts";
import { buildServer } from "./server.ts";

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
