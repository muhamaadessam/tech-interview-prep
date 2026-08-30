import assert from "node:assert/strict";
import test from "node:test";

import { normalizeQuestion, validateSubmission } from "./validation.ts";

const valid = {
  trackId: "flutter",
  topicIds: ["dart"],
  question: "What is final?",
  shortAnswer: "A runtime single assignment.",
  explanation: "Explain it.",
  difficulty: "Junior",
  sources: ["https://dart.dev/language/variables"],
  licenseConsent: true,
  idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
};

test("submission validation accepts required fields and defaults optional fields", () => {
  assert.deepEqual(validateSubmission(valid).commonMistakes, []);
  assert.equal(validateSubmission(valid).displayName, "Community contributor");
});

test("submission validation rejects HTML, missing consent, and non-HTTPS sources", () => {
  assert.throws(() => validateSubmission({ ...valid, explanation: "<script>alert(1)</script>" }), /explanation_invalid/);
  assert.throws(() => validateSubmission({ ...valid, licenseConsent: false }), /license_consent_required/);
  assert.throws(() => validateSubmission({ ...valid, sources: [] }), /sources_invalid/);
  assert.throws(() => validateSubmission({ ...valid, sources: ["http://example.com"] }), /sources_invalid/);
});

test("duplicate advisory normalization is stable", () => {
  assert.equal(normalizeQuestion(" `Final`   vs   const? "), "final vs const?");
});
