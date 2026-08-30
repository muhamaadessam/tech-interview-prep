import assert from "node:assert/strict";
import test from "node:test";

import { questions, validateQuestions } from "./questions.ts";

test("the public question catalogue accepts the permanent Dart question", () => {
  assert.doesNotThrow(() => validateQuestions(questions));
  assert.equal(questions.length, 1);
  assert.equal(questions[0]?.slug, "final-vs-const-in-dart");
});

test("the public question catalogue rejects missing data and duplicate identity", () => {
  const question = questions[0];
  assert.ok(question);

  assert.throws(
    () => validateQuestions([{ ...question, question: "" }]),
    /missing required data/,
  );
  assert.throws(
    () => validateQuestions([question, { ...question }]),
    /duplicate id or slug/,
  );
});
