import assert from "node:assert/strict";
import test from "node:test";

import { buildReviewIssue } from "./review-issue.ts";

test("Review Issue has fixed labels and omits unsupplied optional content", () => {
  const issue = buildReviewIssue({
    submissionId: "0f934359-96d9-42f4-b741-40b25b1cf625",
    draft: {
      trackId: "flutter",
      topicIds: [],
      question: "What is final?",
      shortAnswer: null,
      explanation: null,
      difficulty: null,
      sources: [],
      codeExample: null,
      commonMistakes: [],
      followUpQuestions: [],
      displayName: null,
      licenseConsent: true,
      idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
    },
  });

  assert.deepEqual(issue.labels, ["community-submission", "needs-review", "suggested-question"]);
  assert.match(issue.body, /### Question\nWhat is final\?/);
  for (const omitted of ["Topics:", "Difficulty:", "Contributor:", "Short answer", "Explanation", "Sources"])
    assert.doesNotMatch(issue.body, new RegExp(omitted));
  assert.doesNotMatch(issue.body, /550e8400/);
});
