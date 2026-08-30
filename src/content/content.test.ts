import assert from "node:assert/strict";
import test from "node:test";

import { questions, validateQuestions } from "./questions.ts";

test("the public question catalogue accepts the permanent Dart questions", () => {
  assert.doesNotThrow(() => validateQuestions(questions));
  const dartQuestions = questions.filter((question) => question.topicIds.includes("dart"));
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
    assert.match(question.lastReviewedAt, /^\d{4}-\d{2}-\d{2}$/);
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

test("the OOP and SOLID topics contain their planned question sets", () => {
  const expected = {
    oop: ["class-and-object-in-dart", "encapsulation-and-private-members-in-dart", "composition-vs-inheritance-in-flutter", "polymorphism-and-interfaces-in-dart", "abstract-class-and-interface-in-dart", "mixins-and-reusable-behavior-in-dart", "equality-and-hashcode-for-dart-objects", "immutable-value-objects-in-dart"],
    solid: ["single-responsibility-in-flutter", "open-closed-principle-for-renderers", "liskov-substitution-in-dart", "interface-segregation-in-flutter", "dependency-inversion-in-flutter", "solid-boundaries-in-flutter-widgets", "when-not-to-apply-solid", "refactoring-legacy-flutter-code-with-solid"],
  } as const;
  for (const [topic, slugs] of Object.entries(expected)) {
    const actual = new Set(questions.filter((question) => question.topicIds.includes(topic)).map((question) => question.slug));
    for (const slug of slugs) assert.ok(actual.has(slug));
  }
});

test("the catalogue keeps official HTTPS sources and real review dates", () => {
  for (const question of questions) {
    assert.equal(new Date(`${question.lastReviewedAt}T00:00:00Z`).toISOString().slice(0, 10), question.lastReviewedAt);
    for (const source of question.sources) {
      const url = new URL(source.url);
      assert.equal(url.protocol, "https:");
      assert.ok(["dart.dev", "api.dart.dev", "docs.flutter.dev", "blog.cleancoder.com"].includes(url.hostname));
    }
  }
});
