export const submissionLimits = {
  question: 500,
  shortAnswer: 1_000,
  explanation: 5_000,
  code: 10_000,
  item: 500,
  items: 8,
  sources: 5,
  displayName: 80,
} as const;

export type SubmissionDraft = {
  trackId: string;
  topicIds: string[];
  question: string;
  shortAnswer: string;
  explanation: string;
  difficulty: "Junior" | "Mid" | "Senior";
  sources: string[];
  codeExample?: string;
  commonMistakes?: string[];
  followUpQuestions?: string[];
  displayName?: string;
  licenseConsent: boolean;
  idempotencyKey: string;
};

export type ValidatedSubmission = Omit<SubmissionDraft, "question" | "shortAnswer" | "explanation" | "sources" | "codeExample" | "commonMistakes" | "followUpQuestions" | "displayName"> & {
  question: string;
  shortAnswer: string;
  explanation: string;
  sources: string[];
  codeExample: string | null;
  commonMistakes: string[];
  followUpQuestions: string[];
  displayName: string;
};

const htmlTag = /<\/?[a-z][^>]*>/i;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(value: unknown, max: number, field: string): string {
  if (typeof value !== "string") throw new Error(`${field}_invalid`);
  const normalized = value.replaceAll("\r\n", "\n").trim();
  if (!normalized || normalized.length > max || htmlTag.test(normalized)) throw new Error(`${field}_invalid`);
  return normalized;
}

function list(value: unknown, maxItems: number, field: string): string[] {
  if (!Array.isArray(value) || value.length > maxItems) throw new Error(`${field}_invalid`);
  return value.map((item) => text(item, submissionLimits.item, field));
}

export function validateSubmission(value: unknown): ValidatedSubmission {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("payload_invalid");
  const draft = value as Record<string, unknown>;
  const trackId = text(draft.trackId, 80, "track");
  const topicIds = list(draft.topicIds, 20, "topics");
  if (!topicIds.length || new Set(topicIds).size !== topicIds.length) throw new Error("topics_invalid");
  const question = text(draft.question, submissionLimits.question, "question");
  const shortAnswer = text(draft.shortAnswer, submissionLimits.shortAnswer, "short_answer");
  const explanation = text(draft.explanation, submissionLimits.explanation, "explanation");
  const difficulty = draft.difficulty;
  if (difficulty !== "Junior" && difficulty !== "Mid" && difficulty !== "Senior") throw new Error("difficulty_invalid");
  const sources = list(draft.sources, submissionLimits.sources, "sources");
  if (!sources.length || !sources.every((source) => /^https:\/\/[^\s]+$/i.test(source))) throw new Error("sources_invalid");
  const codeExample = draft.codeExample ? text(draft.codeExample, submissionLimits.code, "code") : null;
  const commonMistakes = draft.commonMistakes ? list(draft.commonMistakes, submissionLimits.items, "mistakes") : [];
  const followUpQuestions = draft.followUpQuestions ? list(draft.followUpQuestions, submissionLimits.items, "followups") : [];
  const displayName = draft.displayName ? text(draft.displayName, submissionLimits.displayName, "display_name") : "Community contributor";
  if (/@|\S+@\S+\.\S+/.test(displayName)) throw new Error("display_name_invalid");
  if (draft.licenseConsent !== true) throw new Error("license_consent_required");
  const idempotencyKey = text(draft.idempotencyKey, 80, "idempotency_key");
  if (!uuid.test(idempotencyKey)) throw new Error("idempotency_key_invalid");

  return { trackId, topicIds, question, shortAnswer, explanation, difficulty, sources, codeExample, commonMistakes, followUpQuestions, displayName, licenseConsent: true, idempotencyKey };
}

export function normalizeQuestion(value: string): string {
  return value.toLocaleLowerCase().replace(/[`*_~>#]/g, "").replace(/\s+/g, " ").trim();
}
