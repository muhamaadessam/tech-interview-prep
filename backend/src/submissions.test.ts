import assert from "node:assert/strict";
import test from "node:test";

import { createSupabaseSubmissionStore, SubmissionRouteError } from "./submissions.ts";

const draft = { trackId: "flutter", topicIds: ["dart"], question: "What is final?", shortAnswer: "A", explanation: "B", difficulty: "Junior" as const, sources: ["https://dart.dev"], licenseConsent: true, idempotencyKey: "123e4567-e89b-12d3-a456-426614174000" };

test("submission adapter validates input and keeps provider credentials server-side", async () => {
  const requests: Request[] = [];
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_URL = "https://db.example";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-secret";
  const store = createSupabaseSubmissionStore({ url: "https://db.example", serviceRoleKey: "service-secret", fetchImpl: async (input, init) => {
    const request = new Request(input, init);
    requests.push(request);
    return requests.length === 1
      ? Response.json([])
      : Response.json([{ id: "s1", status: "issue_created", github_issue_number: null, github_issue_url: null, duplicate_advisory: false, updated_at: new Date().toISOString() }]);
  } });
  try {
    assert.deepEqual(await store.submit(draft, "clerk-token", "account-1"), { submissionId: "s1", status: "issue_created", githubIssueNumber: null, githubIssueUrl: null, duplicateAdvisory: false });
    assert.equal(requests[0].url, "https://db.example/rest/v1/account_roles?select=suspended&user_id=eq.account-1&limit=1");
    assert.equal(requests[0].headers.get("Authorization"), "Bearer service-secret");
    assert.ok(requests.every((request) => !request.url.includes("/functions/v1/")));
    await assert.rejects(store.submit({ ...draft, question: "<script>" }, "clerk-token", "account-1"), (error: unknown) => error instanceof SubmissionRouteError && error.status === 400);
  } finally {
    if (previousUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  }
});
