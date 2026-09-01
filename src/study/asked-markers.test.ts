import assert from "node:assert/strict";
import test from "node:test";

import { sortByInterviewFrequency } from "./asked-markers.ts";
import { adjustAskedMarker } from "./asked-markers.ts";

test("sortByInterviewFrequency keeps stable order for equal counts", () => {
  const questions = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.deepEqual(sortByInterviewFrequency(questions, {
    a: { personalCount: 0, interviewFrequency: 2 },
    b: { personalCount: 1, interviewFrequency: 5 },
    c: { personalCount: 0, interviewFrequency: 2 },
  }).map(({ id }) => id), ["b", "a", "c"]);
});

test("asked marker writes use the Node route when enabled", async () => {
  process.env.NEXT_PUBLIC_API_URL = "https://api.example";
  try {
    const result = await adjustAskedMarker({ questionId: "q1", delta: 1, getToken: async () => "token", fetchImpl: async (input, init) => { assert.equal(String(input), "https://api.example/v1/questions/q1/asked-marker"); assert.equal(init?.method, "POST"); return Response.json({ personalCount: 1, interviewFrequency: 2 }); } });
    assert.deepEqual(result, { personalCount: 1, interviewFrequency: 2 });
  } finally { delete process.env.NEXT_PUBLIC_API_URL; }
});
