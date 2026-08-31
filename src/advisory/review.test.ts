import test from "node:test";
import assert from "node:assert/strict";

import { advisoryComment, buildAdvisoryEnvelope, validateAdvisoryResult } from "./review.ts";

test("advisory envelope excludes identity and scrubs obvious PII", () => {
  const envelope = buildAdvisoryEnvelope({ submissionId: "sub-1", trackId: "flutter", topicIds: ["dart"], difficulty: null, payload: { question: "Email me at dev@example.com or +20 100 123 4567" } });
  assert.equal("display_name" in envelope, false);
  assert.match(envelope.question, /redacted-email/);
  assert.match(envelope.question, /redacted-phone/);
});

test("advisory result requires the strict bounded contract", () => {
  assert.deepEqual(validateAdvisoryResult({ flags: [], summary: "Looks useful", needs_human_attention: false, confidence: 0.8 }), { flags: [], summary: "Looks useful", needs_human_attention: false, confidence: 0.8 });
  assert.equal(validateAdvisoryResult({ flags: [], summary: "", needs_human_attention: false, confidence: 0.8 }), null);
  assert.equal(validateAdvisoryResult({ flags: [], summary: "Looks useful", needs_human_attention: false, confidence: 2 }), null);
});

test("advisory comment has one machine-readable marker and moderator boundary", () => {
  const comment = advisoryComment({ flags: [], summary: "Looks useful", needs_human_attention: false, confidence: 0.8 }, { submissionId: "sub-1", revisionNumber: 1 });
  assert.equal((comment.match(/ai-advisory:v1/g) ?? []).length, 1);
  assert.match(comment, /Moderator decision required/);
});
