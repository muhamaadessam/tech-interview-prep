import type { ValidatedSubmission } from "./validation.ts";

export const reviewIssueLabels = ["community-submission", "needs-review", "suggested-question"];

export function buildReviewIssue({ draft, submissionId }: { draft: ValidatedSubmission; submissionId: string }) {
  const body = [
    `<!-- submission-id: ${submissionId} -->`,
    "## Community submission",
    `- Submission ID: \`${submissionId}\``,
    `- Track: ${draft.trackId}`,
    draft.topicIds.length ? `- Topics: ${draft.topicIds.join(", ")}` : "",
    draft.difficulty ? `- Difficulty: ${draft.difficulty}` : "",
    draft.displayName ? `- Contributor: ${draft.displayName}` : "",
    `### Question\n${draft.question}`,
    draft.shortAnswer ? `### Short answer\n${draft.shortAnswer}` : "",
    draft.explanation ? `### Explanation\n${draft.explanation}` : "",
    draft.codeExample ? `### Code example\n\`\`\`\n${draft.codeExample}\n\`\`\`` : "",
    draft.commonMistakes.length ? `### Common mistakes\n${draft.commonMistakes.map((item) => `- ${item}`).join("\n")}` : "",
    draft.followUpQuestions.length ? `### Follow-up questions\n${draft.followUpQuestions.map((item) => `- ${item}`).join("\n")}` : "",
    draft.sources.length ? `### Sources\n${draft.sources.map((source) => `- ${source}`).join("\n")}` : "",
    "> This issue is a review record. Closing it does not publish content.",
  ].filter(Boolean).join("\n\n");
  return { title: `[Community submission] ${draft.question.slice(0, 80)}`, body, labels: reviewIssueLabels };
}
