import type { DifficultyLevel, Locale, QuestionTranslation } from "../content/questions";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export class DatabaseQuestionNotFound extends Error {}

type QuestionRow = { id?: unknown; slug?: unknown; track_id?: unknown; difficulty?: unknown; published_revision_id?: unknown };
type RevisionRow = { id?: unknown; question_id?: unknown; reviewed_at?: unknown };
type LocaleRow = { locale?: unknown; question?: unknown; short_answer?: unknown; explanation?: unknown; code_example?: unknown; common_mistakes?: unknown; follow_up_questions?: unknown; sources?: unknown };
type TopicRow = { topic_id?: unknown };
type TopicLocaleRow = { topic_id?: unknown; name?: unknown };

export type DatabaseQuestion = {
  id: string;
  slug: string;
  trackId: string;
  topicIds: string[];
  topicNames: string[];
  difficulty: DifficultyLevel;
  lastReviewedAt: string;
  translations: Record<Locale, QuestionTranslation>;
};

function apiUrl(path: string): string {
  if (!supabaseUrl || !supabaseKey) throw new Error("database_config_missing");
  return `${supabaseUrl}/rest/v1/${path}`;
}

async function read<T>(path: string): Promise<T> {
  const response = await fetch(apiUrl(path), { headers: { apikey: supabaseKey ?? "", Accept: "application/json" } });
  if (!response.ok) throw new Error("database_request_failed");
  return await response.json() as T;
}

function requiredText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringList(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim()) ? value.map((item) => (item as string).trim()) : null;
}

function translation(row: LocaleRow): QuestionTranslation | null {
  const question = requiredText(row.question);
  const shortAnswer = requiredText(row.short_answer);
  const explanation = requiredText(row.explanation);
  const sources = Array.isArray(row.sources) && row.sources.every((source) => {
    if (!source || typeof source !== "object") return false;
    const item = source as { title?: unknown; url?: unknown };
    return Boolean(requiredText(item.title) && typeof item.url === "string" && /^https:\/\/[^\s]+$/i.test(item.url));
  }) ? row.sources as { title: string; url: string }[] : null;
  if (!question || !shortAnswer || !explanation || !sources?.length) return null;
  const commonMistakes = row.common_mistakes == null ? [] : stringList(row.common_mistakes);
  const followUpQuestions = row.follow_up_questions == null ? [] : stringList(row.follow_up_questions);
  if (!commonMistakes || !followUpQuestions) return null;
  return { question, shortAnswer, explanation, codeExample: requiredText(row.code_example) ?? undefined, commonMistakes, followUpQuestions, sources };
}

export async function loadDatabaseQuestion(slug: string, locale: Locale): Promise<DatabaseQuestion> {
  const encodedSlug = encodeURIComponent(slug);
  const questions = await read<QuestionRow[]>(`interview_questions?select=id,slug,track_id,difficulty,published_revision_id&slug=eq.${encodedSlug}&published_revision_id=not.is.null&limit=1`);
  const row = questions[0];
  if (!row || typeof row.id !== "string" || typeof row.slug !== "string" || typeof row.track_id !== "string" || typeof row.published_revision_id !== "string") throw new DatabaseQuestionNotFound();
  if (row.difficulty !== "Junior" && row.difficulty !== "Mid" && row.difficulty !== "Senior") throw new Error("database_payload_invalid");

  const revisionId = encodeURIComponent(row.published_revision_id);
  const revisions = await read<RevisionRow[]>(`question_revisions?select=id,question_id,reviewed_at&id=eq.${revisionId}&question_id=eq.${encodeURIComponent(row.id)}&status=eq.published&limit=1`);
  const revision = revisions[0];
  if (!revision || typeof revision.reviewed_at !== "string") throw new Error("database_payload_invalid");
  const locales = await read<LocaleRow[]>(`question_revision_locales?select=locale,question,short_answer,explanation,code_example,common_mistakes,follow_up_questions,sources&revision_id=eq.${revisionId}`);
  const translations = Object.fromEntries((['ar', 'en'] as const).map((key) => {
    const item = locales.find((candidate) => candidate.locale === key);
    const parsed = item ? translation(item) : null;
    if (!parsed) throw new Error("database_payload_invalid");
    return [key, parsed];
  })) as Record<Locale, QuestionTranslation>;
  const topics = await read<TopicRow[]>(`question_topics?select=topic_id&question_id=eq.${encodeURIComponent(row.id)}`);
  const topicIds = topics.flatMap((topic) => typeof topic.topic_id === "string" ? [topic.topic_id] : []);
  if (!topicIds.length) throw new Error("database_payload_invalid");
  const topicFilter = topicIds.map(encodeURIComponent).join(",");
  const topicLocales = await read<TopicLocaleRow[]>(`topic_locales?select=topic_id,name&topic_id=in.(${topicFilter})&locale=eq.${locale}`);
  const names = new Map(topicLocales.flatMap((topic) => typeof topic.topic_id === "string" && typeof topic.name === "string" ? [[topic.topic_id, topic.name]] as const : []));
  return { id: row.id, slug: row.slug, trackId: row.track_id, topicIds, topicNames: topicIds.map((topicId) => names.get(topicId) ?? topicId), difficulty: row.difficulty, lastReviewedAt: revision.reviewed_at, translations };
}
