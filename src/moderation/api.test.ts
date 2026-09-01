import assert from "node:assert/strict";
import test from "node:test";

import { hasModeratorAccess, ModerationError, moderationRequest } from "./api.ts";

process.env.NEXT_PUBLIC_API_URL = "https://api.example";

test("moderationRequest sends the Clerk token and returns the response", async () => {
  let request: Request | undefined;
  const result = await moderationRequest<{ ok: boolean }>({
    getToken: async () => "clerk-token",
    body: { action: "list_submissions", status: "pending" },
    fetchImpl: async (input, init) => {
      request = new Request(input, init);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
  });
  assert.deepEqual(result, { ok: true });
  assert.equal(request?.url, "https://api.example/v1/moderation/actions");
  assert.equal(request?.headers.get("Authorization"), "Bearer clerk-token");
  assert.deepEqual(await request?.json(), { action: "list_submissions", status: "pending" });
});

test("moderationRequest reports function errors", async () => {
  await assert.rejects(
    moderationRequest({ getToken: async () => "token", body: { action: "list_submissions" }, fetchImpl: async () => new Response(JSON.stringify({ error: "moderator_required" }), { status: 403 }) }),
    (error: unknown) => error instanceof ModerationError && error.code === "moderator_required" && error.status === 403,
  );
});

test("navigation access is decided by the Node policy endpoint", async () => {
  const check = (body: unknown, status = 200) => hasModeratorAccess({ userId: "browser-id-is-ignored", getToken: async () => "token", fetchImpl: async (input) => { assert.equal(String(input), "https://api.example/v1/me/moderator-access"); return new Response(JSON.stringify(body), { status }); } });
  assert.equal(await check({ allowed: true }), true);
  assert.equal(await check({ error: "moderator_required" }, 403), false);
});
