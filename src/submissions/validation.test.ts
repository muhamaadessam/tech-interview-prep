import assert from "node:assert/strict";
import test from "node:test";

import { normalizeQuestion, validateSubmission } from "./validation.ts";

const valid = {
  trackId: "flutter",
  topicIds: [],
  question: "What is final?",
  shortAnswer: "",
  explanation: "",
  difficulty: null,
  sources: [],
  licenseConsent: true,
  idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
};

test("submission validation accepts required fields and defaults optional fields", () => {
  const minimal = validateSubmission({ ...valid, shortAnswer: "  ", codeExample: "\n", displayName: " " });
  assert.equal(minimal.difficulty, null);
  assert.equal(minimal.shortAnswer, null);
  assert.equal(minimal.codeExample, null);
  assert.deepEqual(minimal.commonMistakes, []);
  assert.equal(minimal.displayName, null);
});

test("submission validation rejects HTML, missing consent, and non-HTTPS sources", () => {
  assert.throws(() => validateSubmission({ ...valid, explanation: "<script>alert(1)</script>" }), /explanation_invalid/);
  assert.throws(() => validateSubmission({ ...valid, licenseConsent: false }), /license_consent_required/);
  assert.throws(() => validateSubmission({ ...valid, sources: ["http://example.com"] }), /sources_invalid/);
  assert.throws(() => validateSubmission({ ...valid, codeExample: "```dart\nfinal x = 1;\n```" }), /code_invalid/);
});

test("submission validation accepts optional enrichment but enforces its boundaries", () => {
  const enriched = validateSubmission({
    ...valid,
    topicIds: ["dart"],
    difficulty: "Senior",
    shortAnswer: "Single assignment.",
    sources: ["https://dart.dev/language/variables"],
    displayName: "Ada",
  });
  assert.equal(enriched.difficulty, "Senior");
  assert.equal(enriched.displayName, "Ada");
  assert.throws(() => validateSubmission({ ...valid, topicIds: ["dart", "dart"] }), /topics_invalid/);
  assert.throws(() => validateSubmission({ ...valid, question: "<b>Question</b>" }), /question_invalid/);
  assert.throws(() => validateSubmission({ ...valid, question: "x".repeat(501) }), /question_invalid/);
});

test("duplicate advisory normalization is stable", () => {
  assert.equal(normalizeQuestion(" `Final`   vs   const? "), "final vs const?");
});
