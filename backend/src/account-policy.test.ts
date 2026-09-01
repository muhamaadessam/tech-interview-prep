import assert from "node:assert/strict";
import test from "node:test";

import { createAccountPolicy, createSupabaseAccountRoleStore } from "./account-policy.ts";
import { buildServer } from "./server-impl.ts";

const context = (sub: string, emailVerified = true) => ({ sub, claims: { sub, email_verified: emailVerified } });

test("policy guards enforce authentication, ownership, confirmation, role, and suspension", async () => {
  const policy = createAccountPolicy({ getRole: async (userId) => userId === "moderator" ? { role: "moderator", suspended: false } : userId === "suspended" || userId === "suspended-learner" ? { role: "learner", suspended: true } : { role: "learner", suspended: false } });
  const app = await buildServer({ allowedOrigins: [], policy });
  app.get("/auth", { preHandler: app.requireAuthenticated }, async () => ({ ok: true }));
  const setAccount = (value: ReturnType<typeof context>) => async (request: Parameters<typeof policy.requireAuthenticated>[0]) => { request.account = value; };
  app.get("/owner/:accountId", { preHandler: [setAccount(context("user_123")), app.requireOwnership] }, async () => ({ ok: true }));
  app.get("/owner-query", { preHandler: [setAccount(context("user_123")), app.requireOwnership] }, async () => ({ ok: true }));
  app.get("/moderator", { preHandler: [setAccount(context("moderator")), app.requireModerator] }, async () => ({ ok: true }));
  app.get("/suspended-moderator", { preHandler: [setAccount(context("suspended")), app.requireModerator] }, async () => ({ ok: true }));
  app.get("/suspended-learner", { preHandler: [setAccount(context("suspended-learner")), app.requireConfirmedEmail] }, async () => ({ ok: true }));
  app.get("/contribute", { preHandler: [setAccount(context("user_123", false)), app.requireConfirmedEmail] }, async () => ({ ok: true }));

  assert.equal((await app.inject({ method: "GET", url: "/auth" })).statusCode, 401);
  assert.equal((await app.inject({ method: "GET", url: "/owner/user_123" })).statusCode, 200);
  assert.deepEqual((await app.inject({ method: "GET", url: "/owner/other" })).json(), { error: "account_ownership_mismatch" });
  assert.deepEqual((await app.inject({ method: "GET", url: "/owner-query?accountId=other" })).json(), { error: "account_ownership_mismatch" });
  assert.equal((await app.inject({ method: "GET", url: "/moderator" })).statusCode, 200);
  assert.deepEqual((await app.inject({ method: "GET", url: "/suspended-moderator" })).json(), { error: "moderator_required" });
  assert.deepEqual((await app.inject({ method: "GET", url: "/suspended-learner" })).json(), { error: "account_suspended" });
  assert.deepEqual((await app.inject({ method: "GET", url: "/contribute" })).json(), { error: "email_confirmation_required" });
  await app.close();
});

test("Supabase role adapter keeps service credentials server-side", async () => {
  let received: { url: string; headers: Headers } | undefined;
  const store = createSupabaseAccountRoleStore({ url: "https://db.example/", serviceRoleKey: "service-secret", fetchImpl: async (input, init) => {
    received = { url: String(input), headers: new Headers(init?.headers) };
    return new Response(JSON.stringify([{ role: "moderator", suspended: false }]), { status: 200 });
  } });
  assert.deepEqual(await store.getRole("user_123"), { role: "moderator", suspended: false });
  assert.equal(received?.url, "https://db.example/rest/v1/account_roles?select=role,suspended&user_id=eq.user_123&limit=1");
  assert.equal(received?.headers.get("authorization"), "Bearer service-secret");
});
