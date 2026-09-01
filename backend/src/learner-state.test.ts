import assert from "node:assert/strict";
import test from "node:test";

import { createSupabaseLearnerStateStore } from "./learner-state.ts";

test("learner state adapter keeps every Supabase request behind server credentials", async () => {
  const urls: string[] = [];
  const store = createSupabaseLearnerStateStore({ url: "https://db.example", serviceRoleKey: "service-secret", fetchImpl: async (input, init) => {
    urls.push(String(input));
    if (String(input).includes("question_progress?select")) return Response.json([{ question_id: "q1", progress: "mastered" }]);
    if (String(input).includes("favorites?select")) return Response.json([{ question_id: "q2" }]);
    if (String(input).includes("interview_question_frequencies")) return Response.json([{ question_id: "q1", frequency: 3 }]);
    if (String(input).includes("asked_markers?select")) return Response.json([{ question_id: "q1", asked_count: 1 }]);
    if (String(input).includes("adjust_asked_marker")) return Response.json([{ personal_count: 2, interview_frequency: 4 }]);
    return new Response(null, { status: 204 });
  } });
  assert.deepEqual(await store.read("user_123"), { progress: [{ questionId: "q1", progress: "mastered" }], favorites: ["q2"] });
  assert.deepEqual(await store.readAsked(["q1"], "user_123"), { q1: { personalCount: 1, interviewFrequency: 3 } });
  await store.write("user_123", { progress: [{ questionId: "q1", progress: "mastered" }], favorites: ["q2"] });
  assert.deepEqual(await store.adjustAsked("q1", 1, "user_123"), { personalCount: 2, interviewFrequency: 4 });
  assert.ok(urls.some((url) => url.includes("user_id=eq.user_123")));
  assert.ok(urls.some((url) => url.endsWith("/rpc/adjust_asked_marker_for_account")));
});
