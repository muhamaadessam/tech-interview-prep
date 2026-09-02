import assert from "node:assert/strict";
import test from "node:test";

import { createSupabaseOperations } from "./operations.ts";

test("privileged operations are called only from Node with server client credentials", async () => {
  const requests: Request[] = [];
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_URL = "https://db.example";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-secret";
  const operations = createSupabaseOperations({ url: "https://db.example", serviceRoleKey: "service-secret", fetchImpl: async (input, init) => {
    const request = new Request(input, init);
    requests.push(request);
    if (request.url.includes("/account_roles?")) return Response.json([{ role: "moderator", suspended: false }]);
    if (request.url.includes("/submissions?")) return Response.json([{ id: "submission-1", status: "pending", track_id: "flutter", topic_ids: ["layout"], difficulty: "Junior", payload: { question: "What is a widget?" }, display_name: null, review_notes: null, created_at: "2026-09-02T00:00:00Z" }]);
    if (request.url.includes("/submission_revisions?")) return Response.json([{ track_id: "flutter", topic_ids: [], difficulty: "Junior", payload: {} }]);
    return Response.json({ ok: true });
  } });
  try {
    await operations.moderate({ action: "list_submissions" }, "clerk-token", "moderator-1");
    assert.match(requests[0].url, /https:\/\/db\.example\/rest\/v1\/submissions\?/);
    assert.equal(requests[0].headers.get("Authorization"), "Bearer service-secret");
    const result = await operations.moderate({ action: "list_submissions" }, "clerk-token", "moderator-1") as { submissions: Array<{ prompt: string }> };
    assert.match(result.submissions[0].prompt, /Return one valid JSON object only/);
    assert.ok(requests.every((request) => !request.url.includes("/functions/v1/")));
  } finally {
    if (previousUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  }
});
