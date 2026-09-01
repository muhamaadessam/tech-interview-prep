import assert from "node:assert/strict";
import test from "node:test";

import { createSupabaseSubmissionStore, SubmissionRouteError } from "./submissions.ts";

const draft = { trackId: "flutter", topicIds: ["dart"], question: "What is final?", shortAnswer: "A", explanation: "B", difficulty: "Junior" as const, sources: ["https://dart.dev"], licenseConsent: true, idempotencyKey: "123e4567-e89b-12d3-a456-426614174000" };

test("submission adapter validates input and keeps provider credentials server-side", async () => {
  let request: { url: string; init?: RequestInit } | undefined;
  const store = createSupabaseSubmissionStore({ url: "https://db.example", serviceRoleKey: "service-secret", fetchImpl: async (input, init) => { request = { url: String(input), init }; return Response.json({ submissionId: "s1", status: "pending" }); } });
  assert.deepEqual(await store.submit(draft, "clerk-token"), { submissionId: "s1", status: "pending" });
  assert.equal(request?.url, "https://db.example/functions/v1/submit-question");
  assert.equal(new Headers(request?.init?.headers).get("Authorization"), "Bearer clerk-token");
  assert.equal(new Headers(request?.init?.headers).get("apikey"), "service-secret");
  await assert.rejects(store.submit({ ...draft, question: "<script>" }, "clerk-token"), (error: unknown) => error instanceof SubmissionRouteError && error.status === 400);
});
