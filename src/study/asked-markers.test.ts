import assert from "node:assert/strict";
import test from "node:test";

import { sortByInterviewFrequency } from "./asked-markers.ts";

test("sortByInterviewFrequency keeps stable order for equal counts", () => {
  const questions = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.deepEqual(sortByInterviewFrequency(questions, {
    a: { personalCount: 0, interviewFrequency: 2 },
    b: { personalCount: 1, interviewFrequency: 5 },
    c: { personalCount: 0, interviewFrequency: 2 },
  }).map(({ id }) => id), ["b", "a", "c"]);
});
