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

test("the Flutter Fundamentals topic contains its planned question set", () => {
  const slugs = new Set(questions.filter((question) => question.topicIds.includes("flutter-fundamentals")).map((question) => question.slug));
  for (const slug of [
    "flutter-framework-engine-and-embedder",
    "declarative-ui-in-flutter",
    "widget-element-render-object-trees",
    "flutter-frame-rendering-pipeline",
    "hot-reload-vs-hot-restart",
    "debug-profile-and-release-modes",
    "pubspec-dependencies-and-packages",
    "flutter-app-lifecycle",
    "assets-and-images-in-flutter",
    "flutter-flavors-and-build-configurations",
  ]) assert.ok(slugs.has(slug), `missing Flutter Fundamentals question: ${slug}`);
});

test("the Widgets topic contains its planned question set", () => {
  const slugs = new Set(questions.filter((question) => question.topicIds.includes("widgets")).map((question) => question.slug));
  for (const slug of [
    "statelesswidget-and-build",
    "statefulwidget-state-lifecycle",
    "buildcontext-scope-and-inherited-widgets",
    "keys-and-widget-identity",
    "flutter-constraints-go-down-sizes-go-up",
    "composition-vs-inheritance-in-flutter",
    "const-widgets-and-rebuild-cost",
    "setstate-and-rebuild-scope",
    "didchangedependencies-and-inheritedwidget",
    "globalkey-tradeoffs",
  ]) assert.ok(slugs.has(slug), `missing Widgets question: ${slug}`);
});

test("the State Management topic contains its planned question set", () => {
  const slugs = new Set(questions.filter((question) => question.topicIds.includes("state-management")).map((question) => question.slug));
  for (const slug of [
    "local-vs-shared-state",
    "lifting-state-up-in-flutter",
    "immutable-state-and-change-notification",
    "unidirectional-data-flow",
    "state-controller-lifecycle-and-dispose",
    "testable-state-management-boundaries",
    "valuenotifier-and-changenotifier",
    "streams-vs-notifiers-for-state",
    "choosing-a-state-management-approach",
    "state-restoration-and-persistence",
  ]) assert.ok(slugs.has(slug), `missing State Management question: ${slug}`);
});

test("the Navigation and Networking topics contain their planned question sets", () => {
  const expected = {
    navigation: [
      "navigator-route-stack-and-push-pop",
      "passing-data-between-flutter-routes",
      "deep-links-and-route-information",
      "imperative-vs-declarative-navigation",
      "nested-navigation-flows",
    ],
    networking: [
      "http-responses-and-status-codes",
      "json-serialization-and-typed-models",
      "future-loading-success-and-error-states",
      "network-timeouts-and-retry-boundaries",
      "cancelling-network-work-with-widget-lifecycle",
      "service-repository-network-boundaries",
      "websockets-and-stream-lifecycle",
    ],
  } as const;
  for (const [topic, slugs] of Object.entries(expected)) {
    const actual = new Set(questions.filter((question) => question.topicIds.includes(topic)).map((question) => question.slug));
    assert.equal(actual.size, slugs.length, `${topic} question count changed`);
    for (const slug of slugs) assert.ok(actual.has(slug), `missing ${topic} question: ${slug}`);
  }
});

test("the Local Storage and Platform Integration topics contain their planned question sets", () => {
  const expected = {
    "local-storage": [
      "preferences-files-and-local-databases",
      "key-value-preferences-for-small-settings",
      "files-for-local-documents-and-blobs",
      "sqlite-for-structured-local-data",
      "testable-and-resilient-local-persistence",
    ],
    "platform-integration": [
      "platform-channels-and-native-boundaries",
      "choosing-flutter-plugins-and-native-integration",
    ],
  } as const;
  for (const [topic, slugs] of Object.entries(expected)) {
    const actual = new Set(questions.filter((question) => question.topicIds.includes(topic)).map((question) => question.slug));
    assert.equal(actual.size, slugs.length, `${topic} question count changed`);
    for (const slug of slugs) assert.ok(actual.has(slug), `missing ${topic} question: ${slug}`);
  }
});

test("the Architecture topic contains its planned question set", () => {
  const expected = [
    "presentation-domain-and-data-boundaries",
    "dependency-injection-in-flutter",
    "testing-architecture-seams",
    "feature-boundaries-and-folder-organization",
    "dependency-inversion-in-flutter",
    "solid-boundaries-in-flutter-widgets",
    "when-not-to-apply-solid",
    "service-repository-network-boundaries",
  ];
  const actual = new Set(questions.filter((question) => question.topicIds.includes("architecture")).map((question) => question.slug));
  assert.equal(actual.size, expected.length);
  for (const slug of expected) assert.ok(actual.has(slug), `missing Architecture question: ${slug}`);
});

test("the Testing topic contains its planned question set", () => {
  const expected = [
    "unit-tests-for-flutter-domain-logic",
    "widget-tests-and-user-visible-behavior",
    "integration-tests-for-critical-flows",
    "fakes-mocks-and-test-doubles",
    "deterministic-and-reliable-flutter-tests",
    "testing-architecture-seams",
  ];
  const actual = new Set(questions.filter((question) => question.topicIds.includes("testing")).map((question) => question.slug));
  assert.equal(actual.size, expected.length);
  for (const slug of expected) assert.ok(actual.has(slug), `missing Testing question: ${slug}`);
});

test("the Performance and Async & Isolates topics contain their planned question sets", () => {
  const expected = {
    performance: [
      "profiling-before-performance-optimization",
      "frame-budget-and-jank-diagnosis",
      "lazy-list-builders-and-large-collections",
      "avoiding-expensive-work-in-build",
      "image-memory-and-render-cost",
    ],
    "async-isolates": [
      "dart-event-loop-and-microtasks",
      "async-await-and-futures-in-dart",
      "streams-and-multiple-async-values",
      "isolates-for-cpu-bound-work",
    ],
  } as const;
  for (const [topic, slugs] of Object.entries(expected)) {
    const actual = new Set(questions.filter((question) => question.topicIds.includes(topic)).map((question) => question.slug));
    assert.equal(actual.size, slugs.length, `${topic} question count changed`);
    for (const slug of slugs) assert.ok(actual.has(slug), `missing ${topic} question: ${slug}`);
  }
});

test("the catalogue keeps official HTTPS sources and real review dates", () => {
  for (const question of questions) {
    assert.equal(new Date(`${question.lastReviewedAt}T00:00:00Z`).toISOString().slice(0, 10), question.lastReviewedAt);
    for (const source of question.sources) {
      const url = new URL(source.url);
      assert.equal(url.protocol, "https:");
      assert.ok(["dart.dev", "api.dart.dev", "docs.flutter.dev", "api.flutter.dev", "blog.cleancoder.com", "www.rfc-editor.org"].includes(url.hostname));
    }
  }
});
