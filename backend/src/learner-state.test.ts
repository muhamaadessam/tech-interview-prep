import assert from "node:assert/strict";
import test from "node:test";

import { createSupabaseLearnerStateStore } from "./learner-state.ts";

test("learner state adapter keeps progress/favorites separate and forwards Clerk token for asked markers", async () => {
  const urls: string[] = [];
  const store = createSupabaseLearnerStateStore({ url: "https://db.example", serviceRoleKey: "service-secret", fetchImpl: async (input, init) => {
    urls.push(String(input));
    if (String(input).includes("question_progress?select")) return Response.json([{ question_id: "q1", progress: "mastered" }]);
    if (String(input).includes("favorites?select")) return Response.json([{ question_id: "q2" }]);
    if (String(input).includes("adjust_asked_marker")) return Response.json({ personal_count: 1, interview_frequency: 3 });
    return new Response(null, { status: 204 });
  } });
  assert.deepEqual(await store.read("user_123"), { progress: [{ questionId: "q1", progress: "mastered" }], favorites: ["q2"] });
  await store.write("user_123", { progress: [{ questionId: "q1", progress: "mastered" }], favorites: ["q2"] });
  assert.deepEqual(await store.adjustAsked("q1", 1, "clerk-token"), { personalCount: 1, interviewFrequency: 3 });
  assert.ok(urls.some((url) => url.includes("user_id=eq.user_123")));
});
