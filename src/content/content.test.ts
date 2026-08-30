import assert from "node:assert/strict";
import test from "node:test";

import { questions, validateQuestions } from "./questions.ts";

test("the public question catalogue accepts the permanent Dart questions", () => {
  assert.doesNotThrow(() => validateQuestions(questions));
  const dartQuestions = questions.filter((question) => question.topicIds.includes("dart"));
  assert.equal(dartQuestions.length, 12);
  const requiredDartSlugs = [
    "final-vs-const-in-dart",
    "var-vs-dynamic-in-dart",
    "nullable-and-non-nullable-types-in-dart",
    "late-variables-in-dart",
    "object-and-type-safety-in-dart",
    "list-set-and-map-in-dart",
    "spread-and-collection-if-in-dart",
    "named-and-optional-parameters-in-dart",
    "cascade-notation-in-dart",
    "classes-constructors-and-factory-in-dart",
    "extension-methods-in-dart",
    "async-await-and-futures-in-dart",
  ];
  const slugs = new Set(dartQuestions.map((question) => question.slug));
  for (const slug of requiredDartSlugs) assert.ok(slugs.has(slug));
  assert.deepEqual(new Set(dartQuestions.map((question) => question.difficulty)), new Set(["Junior", "Mid", "Senior"]));
  for (const question of dartQuestions) {
    assert.ok(question.question);
    assert.ok(question.shortAnswer);
    assert.ok(question.explanation);
    assert.ok(question.sources.every((source) => {
      const url = new URL(source.url);
      return url.protocol === "https:" && (url.hostname === "dart.dev" || url.hostname.endsWith(".dart.dev"));
    }));
    assert.match(question.lastReviewedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(new Date(`${question.lastReviewedAt}T00:00:00Z`).toISOString().slice(0, 10), question.lastReviewedAt);
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
  assert.throws(
    () => validateQuestions([{ ...question, trackId: "missing" }]),
    /invalid Track or Topic reference/,
  );
  assert.throws(
    () => validateQuestions([{ ...question, topicIds: ["missing"] }]),
    /invalid Track or Topic reference/,
  );
});
