import assert from "node:assert/strict";
import test from "node:test";

import { ModerationError, moderationRequest } from "./api.ts";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable";

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
  assert.equal(request?.headers.get("Authorization"), "Bearer clerk-token");
  assert.deepEqual(await request?.json(), { action: "list_submissions", status: "pending" });
});

test("moderationRequest reports function errors", async () => {
  await assert.rejects(
    moderationRequest({ getToken: async () => "token", body: { action: "list_submissions" }, fetchImpl: async () => new Response(JSON.stringify({ error: "moderator_required" }), { status: 403 }) }),
    (error: unknown) => error instanceof ModerationError && error.code === "moderator_required" && error.status === 403,
  );
});
