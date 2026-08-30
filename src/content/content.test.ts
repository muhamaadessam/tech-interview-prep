import assert from "node:assert/strict";
import test from "node:test";

import { questions, validateQuestions } from "./questions.ts";

test("the public question catalogue accepts the permanent Dart questions", () => {
  assert.doesNotThrow(() => validateQuestions(questions));
  const dartQuestions = questions.filter((question) => question.topicIds.includes("dart"));
  assert.equal(dartQuestions.length, 12);
  const slugs = new Set(dartQuestions.map((question) => question.slug));
  assert.ok(slugs.has("final-vs-const-in-dart"));
  assert.ok(slugs.has("var-vs-dynamic-in-dart"));
  assert.deepEqual(new Set(dartQuestions.map((question) => question.difficulty)), new Set(["Junior", "Mid", "Senior"]));
  for (const question of dartQuestions) {
    assert.ok(question.question.length > 20);
    assert.ok(question.shortAnswer.length > 20);
    assert.ok(question.explanation.length > 40);
    assert.ok(question.sources.every((source) => source.url.startsWith("https://dart.dev/")));
    assert.match(question.lastReviewedAt, /^2026-08-\d{2}$/);
  }
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
