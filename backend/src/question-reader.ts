import type { DifficultyLevel, FollowUpQuestionRef, Locale, QuestionTranslation } from "../../src/content/questions.ts";
import type { DatabaseQuestion } from "../../src/questions/database.ts";

export class QuestionNotFound extends Error {}

type Config = { url: string; key: string };
type Row = Record<string, unknown>;

function text(value: unknown): string | null { return typeof value === "string" && value.trim() ? value.trim() : null; }
function list(value: unknown): string[] | null { return Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim()) ? value.map((item) => (item as string).trim()) : null; }

function translation(row: Row): QuestionTranslation | null {
  const question = text(row.question); const shortAnswer = text(row.short_answer); const explanation = text(row.explanation);
  const sources = Array.isArray(row.sources) && row.sources.every((source) => source && typeof source === "object" && text((source as Row).title) && typeof (source as Row).url === "string" && /^https:\/\/[^\s]+$/i.test((source as Row).url as string)) ? row.sources as { title: string; url: string }[] : null;
  if (!question || !shortAnswer || !explanation || !sources?.length) return null;
  const commonMistakes = row.common_mistakes == null ? [] : list(row.common_mistakes);
  const followUpQuestions = row.follow_up_questions == null ? [] : list(row.follow_up_questions);
  return commonMistakes && followUpQuestions ? { question, shortAnswer, explanation, codeExample: text(row.code_example) ?? undefined, commonMistakes, followUpQuestions, sources } : null;
}

export function createQuestionReader({ url, key, fetchImpl = fetch }: { url: string; key: string; fetchImpl?: typeof fetch }) {
  const config: Config = { url: url.replace(/\/$/, ""), key };
  const read = async <T>(path: string): Promise<T> => {
    const response = await fetchImpl(`${config.url}/rest/v1/${path}`, { headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, Accept: "application/json" } });
    if (!response.ok) throw new Error("database_request_failed");
    return response.json() as Promise<T>;
  };

  return async (slug: string, locale: Locale): Promise<DatabaseQuestion> => {
    const questions = await read<Row[]>(`interview_questions?select=id,slug,track_id,difficulty,published_revision_id&slug=eq.${encodeURIComponent(slug)}&published_revision_id=not.is.null&or=(visibility.eq.public,community_unpublished_at.is.null)&limit=1`);
    const row = questions[0];
    if (!row || typeof row.id !== "string" || typeof row.slug !== "string" || typeof row.track_id !== "string" || typeof row.published_revision_id !== "string") throw new QuestionNotFound();
    if (row.difficulty !== "Junior" && row.difficulty !== "Mid" && row.difficulty !== "Senior") throw new Error("database_payload_invalid");
    const difficulty = row.difficulty as DifficultyLevel;
    const revisionId = encodeURIComponent(row.published_revision_id);
    const revisions = await read<Row[]>(`question_revisions?select=id,question_id,reviewed_at&id=eq.${revisionId}&question_id=eq.${encodeURIComponent(row.id)}&status=eq.published&limit=1`);
    if (typeof revisions[0]?.reviewed_at !== "string") throw new Error("database_payload_invalid");
    const localeRows = await read<Row[]>(`question_revision_locales?select=locale,question,short_answer,explanation,code_example,common_mistakes,follow_up_questions,sources&revision_id=eq.${revisionId}`);
    const translations = Object.fromEntries((["ar", "en"] as const).map((key) => {
      const parsed = translation(localeRows.find((candidate) => candidate.locale === key) ?? {});
      if (!parsed) throw new Error("database_payload_invalid");
      return [key, parsed];
    })) as Record<Locale, QuestionTranslation>;

    const followUps = await read<Row[]>(`question_follow_ups?select=target_question_id,position&source_revision_id=eq.${revisionId}&order=position.asc`);
    const targetIds = followUps.flatMap((candidate) => typeof candidate.target_question_id === "string" ? [candidate.target_question_id] : []);
    if (targetIds.length) {
      const encodedTargets = [...new Set(targetIds)].map(encodeURIComponent).join(",");
      const targets = await read<Row[]>(`interview_questions?select=id,slug,track_id,published_revision_id&id=in.(${encodedTargets})&track_id=eq.${encodeURIComponent(row.track_id)}&published_revision_id=not.is.null`);
      const targetRevisions = targets.flatMap((target) => typeof target.published_revision_id === "string" ? [target.published_revision_id] : []);
      const targetLocales = targetRevisions.length ? await read<Row[]>(`question_revision_locales?select=revision_id,locale,question&revision_id=in.(${targetRevisions.map(encodeURIComponent).join(",")})&locale=in.(ar,en)`) : [];
      const targetById = new Map(targets.flatMap((target) => typeof target.id === "string" ? [[target.id, target] as const] : []));
      const labels = new Map(targetLocales.flatMap((target) => typeof target.revision_id === "string" && typeof target.locale === "string" && typeof target.question === "string" ? [[`${target.revision_id}:${target.locale}`, target.question] as const] : []));
      for (const language of ["ar", "en"] as const) {
        const refs: FollowUpQuestionRef[] = followUps.flatMap((followUp) => {
          if (typeof followUp.target_question_id !== "string") return [];
          const target = targetById.get(followUp.target_question_id);
          if (!target || target.track_id !== row.track_id || typeof target.id !== "string" || typeof target.slug !== "string" || typeof target.published_revision_id !== "string") return [];
          const label = labels.get(`${target.published_revision_id}:${language}`);
          return label ? [{ id: target.id, slug: target.slug, label, href: `/questions/view?slug=${encodeURIComponent(target.slug)}&track=${encodeURIComponent(row.track_id as string)}` }] : [];
        });
        translations[language] = { ...translations[language], followUpQuestionRefs: refs };
      }
    }

    const topics = await read<Row[]>(`question_topics?select=topic_id&question_id=eq.${encodeURIComponent(row.id)}`);
    const topicIds = topics.flatMap((topic) => typeof topic.topic_id === "string" ? [topic.topic_id] : []);
    if (!topicIds.length) throw new Error("database_payload_invalid");
    const topicLocales = await read<Row[]>(`topic_locales?select=topic_id,name&topic_id=in.(${topicIds.map(encodeURIComponent).join(",")})&locale=eq.${locale}`);
    const names = new Map(topicLocales.flatMap((topic) => typeof topic.topic_id === "string" && typeof topic.name === "string" ? [[topic.topic_id, topic.name] as const] : []));
    return { id: row.id, slug: row.slug, trackId: row.track_id, topicIds, topicNames: topicIds.map((id) => names.get(id) ?? id), difficulty, lastReviewedAt: revisions[0].reviewed_at, translations };
  };
}
