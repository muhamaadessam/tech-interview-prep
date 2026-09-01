import type { DifficultyLevel, FollowUpQuestionRef, Locale, QuestionTranslation } from "../content/questions.ts";
import { nodeRequest } from "../backend/api.ts";

export class DatabaseQuestionNotFound extends Error {}

export type DatabaseQuestion = {
  id: string;
  slug: string;
  trackId: string;
  topicIds: string[];
  topicNames: string[];
  difficulty: DifficultyLevel;
  lastReviewedAt: string;
  translations: Record<Locale, QuestionTranslation & { followUpQuestionRefs?: FollowUpQuestionRef[] }>;
};

export async function loadDatabaseQuestion(slug: string, locale: Locale, fetchImpl: typeof fetch = fetch): Promise<DatabaseQuestion> {
  try { return await nodeRequest<DatabaseQuestion>({ path: `/questions/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`, fetchImpl }); }
  catch (error) {
    if ((error as { status?: number }).status === 404) throw new DatabaseQuestionNotFound();
    throw error;
  }
}
