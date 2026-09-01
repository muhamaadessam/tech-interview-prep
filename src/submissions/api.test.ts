import assert from "node:assert/strict";
import test from "node:test";

import { submitQuestion } from "./api.ts";

test("submission uses Node route when enabled and rolls back cleanly", async () => {
  process.env.NEXT_PUBLIC_API_URL = "https://api.example";
  try {
    const result = await submitQuestion({ draft: { trackId: "flutter", topicIds: ["dart"], question: "What is final?", shortAnswer: "A", explanation: "B", difficulty: "Junior", sources: ["https://dart.dev"], licenseConsent: true, idempotencyKey: "123e4567-e89b-12d3-a456-426614174000" }, getToken: async () => "token", fetchImpl: async (input, init) => { assert.equal(String(input), "https://api.example/v1/submissions"); assert.equal(init?.method, "POST"); return Response.json({ submissionId: "s1", status: "pending" }); } });
    assert.equal(result.submissionId, "s1");
  } finally { delete process.env.NEXT_PUBLIC_API_URL; }
});
