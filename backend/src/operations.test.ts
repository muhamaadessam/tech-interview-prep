import assert from "node:assert/strict";
import test from "node:test";

import { createSupabaseOperations } from "./operations.ts";

test("privileged operations are called only from Node with server client credentials", async () => {
  const requests: Request[] = [];
  const operations = createSupabaseOperations({ url: "https://db.example", serviceRoleKey: "service-secret", fetchImpl: async (input, init) => { requests.push(new Request(input, init)); return Response.json({ ok: true }); } });
  await operations.moderate({ action: "list_submissions" }, "clerk-token");
  await operations.advise("submission-1", "clerk-token");
  assert.deepEqual(requests.map(({ url }) => url), ["https://db.example/functions/v1/moderator-actions", "https://db.example/functions/v1/ai-advisory"]);
  assert.ok(requests.every((request) => request.headers.get("apikey") === "service-secret" && request.headers.get("Authorization") === "Bearer clerk-token"));
});
