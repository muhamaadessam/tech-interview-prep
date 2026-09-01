import assert from "node:assert/strict";
import test from "node:test";

import { createSupabaseCommunityStore } from "./community.ts";

test("Community adapter reads and mutates with server credentials", async () => {
  const requests: Request[] = [];
  const store = createSupabaseCommunityStore({ url: "https://db.example", serviceRoleKey: "service-secret", fetchImpl: async (input, init) => {
    const request = new Request(input, init); requests.push(request);
    if (request.url.includes("interview_questions?")) return Response.json([{ id: "q1", slug: "community", track_id: "flutter", difficulty: "Junior", visibility: "community", community_contributor_username: "Contributor", community_published_at: "2026-09-01", community_unpublished_at: null, promoted_at: null, promotion_like_count: null, published_revision_id: "r1" }]);
    if (request.url.includes("question_revision_locales?")) return Response.json([{ revision_id: "r1", locale: "en", question: "Question", short_answer: "Answer" }]);
    if (request.url.includes("question_topics?")) return Response.json([{ question_id: "q1", topic_id: "dart" }]);
    if (request.url.includes("community_question_like_counts?")) return Response.json([{ question_id: "q1", like_count: 4 }]);
    if (request.url.includes("question_likes?")) return Response.json([{ question_id: "q1" }]);
    if (request.url.endsWith("/rpc/set_question_like_for_account")) return Response.json([{ liked: true, like_count: 5, promoted: false }]);
    return Response.json({ error: "unexpected" }, { status: 500 });
  } });

  assert.equal((await store.listQuestions("flutter", "en"))[0].question, "Question");
  assert.deepEqual(await store.likedQuestionIds(["q1"], "account-1"), ["q1"]);
  assert.deepEqual(await store.setLike("q1", true, "account-1"), { liked: true, likeCount: 5, promoted: false });
  assert.ok(requests.every((request) => request.headers.get("Authorization") === "Bearer service-secret"));
  assert.deepEqual(await requests.at(-1)?.json(), { p_account_id: "account-1", p_question_id: "q1", p_liked: true });
});
