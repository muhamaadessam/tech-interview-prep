import type { CommunityQuestion } from "../../src/community/catalogue.ts";
import type { DifficultyLevel } from "../../src/content/questions.ts";
import { fetchUpstream } from "./upstream.ts";

export class CommunityStoreError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number) { super(code); this.name = "CommunityStoreError"; this.code = code; this.status = status; }
}

export type CommunityStore = {
  listQuestions: (trackId: string, locale: "ar" | "en") => Promise<CommunityQuestion[]>;
  likedQuestionIds: (questionIds: string[], userId: string) => Promise<string[]>;
  setLike: (questionId: string, liked: boolean, userId: string) => Promise<{ liked: boolean; likeCount: number; promoted: boolean }>;
};

type Row = Record<string, unknown>;

function text(value: unknown): string | null { return typeof value === "string" && value.trim() ? value.trim() : null; }
function list(values: string[]): string { return values.map(encodeURIComponent).join(","); }

export function createSupabaseCommunityStore({ url, serviceRoleKey, fetchImpl = fetch }: { url: string; serviceRoleKey: string; fetchImpl?: typeof fetch }): CommunityStore {
  const base = url.replace(/\/$/, "");
  const request = async (path: string, init?: RequestInit) => {
    const response = await fetchUpstream(fetchImpl, `${base}/rest/v1/${path}`, { ...init, headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, Accept: "application/json", ...init?.headers } });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: unknown };
      throw new CommunityStoreError(typeof body.message === "string" ? body.message : "community_unavailable", response.status >= 500 ? 503 : 400);
    }
    return response;
  };

  return {
    async listQuestions(trackId, locale) {
      const rows = await (await request(`interview_questions?select=id,slug,track_id,difficulty,visibility,community_contributor_username,community_published_at,community_unpublished_at,promoted_at,promotion_like_count,published_revision_id&track_id=eq.${encodeURIComponent(trackId)}&published_revision_id=not.is.null&community_unpublished_at=is.null&visibility=in.(community,public)&limit=1000`)).json() as Row[];
      const questions = rows.flatMap((row) => {
        const id = text(row.id); const slug = text(row.slug); const track = text(row.track_id);
        const visibility = row.visibility === "community" || row.visibility === "public" ? row.visibility as "community" | "public" : null;
        const difficulty = row.difficulty === "Junior" || row.difficulty === "Mid" || row.difficulty === "Senior" ? row.difficulty as DifficultyLevel : null;
        return id && slug && track && visibility && difficulty && typeof row.published_revision_id === "string" ? [{ row, id, slug, track, visibility, difficulty, revisionId: row.published_revision_id }] : [];
      });
      if (!questions.length) return [];
      const ids = questions.map(({ id }) => id);
      const revisionIds = questions.map(({ revisionId }) => revisionId);
      const [locales, topics, counts] = await Promise.all([
        (await request(`question_revision_locales?select=revision_id,locale,question,short_answer&locale=eq.${locale}&revision_id=in.(${list(revisionIds)})`)).json() as Promise<Row[]>,
        (await request(`question_topics?select=question_id,topic_id&question_id=in.(${list(ids)})`)).json() as Promise<Row[]>,
        (await request(`community_question_like_counts?select=question_id,like_count&question_id=in.(${list(ids)})`)).json() as Promise<Row[]>,
      ]);
      const content = new Map(locales.flatMap((row) => typeof row.revision_id === "string" && row.locale === locale && typeof row.question === "string" && typeof row.short_answer === "string" ? [[row.revision_id, { question: row.question, shortAnswer: row.short_answer }] as const] : []));
      const topicIds = new Map<string, string[]>();
      for (const row of topics) if (typeof row.question_id === "string" && typeof row.topic_id === "string") topicIds.set(row.question_id, [...(topicIds.get(row.question_id) ?? []), row.topic_id]);
      const likeCounts = new Map(counts.flatMap((row) => typeof row.question_id === "string" && typeof row.like_count === "number" ? [[row.question_id, row.like_count] as const] : []));
      return questions.flatMap(({ row, id, slug, track, visibility, difficulty, revisionId }) => {
        const localized = content.get(revisionId);
        if (!localized) return [];
        return [{ id, slug, trackId: track, database: true, topicIds: topicIds.get(id) ?? [], difficulty, question: localized.question, shortAnswer: localized.shortAnswer, visibility, contributorUsername: text(row.community_contributor_username), likeCount: typeof row.promotion_like_count === "number" ? row.promotion_like_count : likeCounts.get(id) ?? 0, promotedAt: typeof row.promoted_at === "string" ? row.promoted_at : null, publishedAt: typeof row.community_published_at === "string" ? row.community_published_at : null, likedByViewer: false } satisfies CommunityQuestion];
      });
    },
    async likedQuestionIds(questionIds, userId) {
      if (!questionIds.length) return [];
      const rows = await (await request(`question_likes?select=question_id&account_id=eq.${encodeURIComponent(userId)}&active=is.true&question_id=in.(${list(questionIds)})`)).json() as Row[];
      return rows.flatMap((row) => typeof row.question_id === "string" ? [row.question_id] : []);
    },
    async setLike(questionId, liked, userId) {
      const response = await request("rpc/set_question_like_for_account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ p_account_id: userId, p_question_id: questionId, p_liked: liked }) });
      const payload = await response.json() as Row | Row[];
      const row = Array.isArray(payload) ? payload[0] : payload;
      if (!row || typeof row.liked !== "boolean" || typeof row.like_count !== "number" || typeof row.promoted !== "boolean") throw new CommunityStoreError("invalid_response", 502);
      return { liked: row.liked, likeCount: row.like_count, promoted: row.promoted };
    },
  };
}
