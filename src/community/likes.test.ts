import test from "node:test";
import assert from "node:assert/strict";
import { setQuestionLike } from "./likes.ts";

test("setQuestionLike sends authenticated intent and parses promotion state", async () => {
  process.env.NEXT_PUBLIC_API_URL = "https://api.example";
  const result = await setQuestionLike({ getToken: async () => "token", questionId: "q-1", liked: true, fetchImpl: async (input, init) => {
    assert.equal(String(input), "https://api.example/v1/questions/q-1/like");
    assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer token");
    assert.equal(init?.body, JSON.stringify({ liked: true }));
    return new Response(JSON.stringify({ liked: true, likeCount: 50, promoted: true }), { status: 200 });
  } });
  assert.deepEqual(result, { liked: true, likeCount: 50, promoted: true });
});
