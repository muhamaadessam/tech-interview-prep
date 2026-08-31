import type { DifficultyLevel, Locale } from "../content/questions";
import type { SearchableQuestion } from "../content/question-search";
import { getSupabaseToken, type SupabaseTokenProvider } from "../supabase/auth-token";

export type CommunityScope = "public" | "community";

export type CommunityQuestion = SearchableQuestion & {
  visibility: CommunityScope;
  contributorUsername: string | null;
  likeCount: number;
  promotedAt: string | null;
  publishedAt: string | null;
  likedByViewer: boolean;
};

type QuestionRow = {
  id?: unknown;
  slug?: unknown;
  track_id?: unknown;
  difficulty?: unknown;
  visibility?: unknown;
  community_contributor_username?: unknown;
  community_published_at?: unknown;
  community_unpublished_at?: unknown;
  promoted_at?: unknown;
  promotion_like_count?: unknown;
  published_revision_id?: unknown;
};

type RevisionRow = { id?: unknown; question_id?: unknown };
type LocaleRow = { revision_id?: unknown; locale?: unknown; question?: unknown; short_answer?: unknown };
type TopicRow = { question_id?: unknown; topic_id?: unknown };
type CountRow = { question_id?: unknown; like_count?: unknown };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function requiredText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function encodedList(values: string[]): string {
  return values.map((value) => encodeURIComponent(value)).join(",");
}

async function read<T>(path: string, fetchImpl: typeof fetch): Promise<T> {
  if (!supabaseUrl || !supabaseKey) throw new Error("database_config_missing");
  const result = await fetchImpl(`${supabaseUrl}/rest/v1/${path}`, { headers: { apikey: supabaseKey, Accept: "application/json" } });
  if (!result.ok) throw new Error("database_request_failed");
  return await result.json() as T;
}

export async function loadCommunityQuestions({
  trackId,
  locale,
  fetchImpl = fetch,
  getToken,
  userId,
}: {
  trackId: string;
  locale: Locale;
  fetchImpl?: typeof fetch;
  getToken?: SupabaseTokenProvider;
  userId?: string | null;
}): Promise<CommunityQuestion[]> {
  const rows = await read<QuestionRow[]>(`interview_questions?select=id,slug,track_id,difficulty,visibility,community_contributor_username,community_published_at,community_unpublished_at,promoted_at,promotion_like_count,published_revision_id&track_id=eq.${encodeURIComponent(trackId)}&published_revision_id=not.is.null&community_unpublished_at=is.null&visibility=in.(community,public)&limit=1000`, fetchImpl);
  const questions = rows.flatMap((row) => {
    const id = requiredText(row.id);
    const slug = requiredText(row.slug);
    const track = requiredText(row.track_id);
    const visibility = row.visibility === "community" || row.visibility === "public" ? row.visibility : null;
    const difficulty = row.difficulty === "Junior" || row.difficulty === "Mid" || row.difficulty === "Senior" ? row.difficulty as DifficultyLevel : null;
    if (!id || !slug || !track || !visibility || !difficulty || typeof row.published_revision_id !== "string") return [];
    return [{ row, id, slug, track, visibility, difficulty }];
  });
  if (!questions.length) return [];

  const ids = questions.map(({ id }) => id);
  const revisions = await read<RevisionRow[]>(`question_revisions?select=id,question_id&status=eq.published&question_id=in.(${encodedList(ids)})`, fetchImpl);
  const revisionByQuestion = new Map(revisions.flatMap((row) => typeof row.id === "string" && typeof row.question_id === "string" ? [[row.question_id, row.id] as const] : []));
  const revisionIds = [...revisionByQuestion.values()];
  const locales = revisionIds.length ? await read<LocaleRow[]>(`question_revision_locales?select=revision_id,locale,question,short_answer&locale=eq.${locale}&revision_id=in.(${encodedList(revisionIds)})`, fetchImpl) : [];
  const textByRevision = new Map(locales.flatMap((row) => typeof row.revision_id === "string" && row.locale === locale && typeof row.question === "string" && typeof row.short_answer === "string" ? [[row.revision_id, { question: row.question, shortAnswer: row.short_answer }] as const] : []));
  const topics = await read<TopicRow[]>(`question_topics?select=question_id,topic_id&question_id=in.(${encodedList(ids)})`, fetchImpl);
  const topicIdsByQuestion = new Map<string, string[]>();
  for (const topic of topics) {
    if (typeof topic.question_id !== "string" || typeof topic.topic_id !== "string") continue;
    const current = topicIdsByQuestion.get(topic.question_id) ?? [];
    current.push(topic.topic_id);
    topicIdsByQuestion.set(topic.question_id, current);
  }
  const counts = await read<CountRow[]>(`community_question_like_counts?select=question_id,like_count&question_id=in.(${encodedList(ids)})`, fetchImpl);
  const countByQuestion = new Map(counts.flatMap((row) => typeof row.question_id === "string" && typeof row.like_count === "number" ? [[row.question_id, row.like_count] as const] : []));
  const likedIds = new Set<string>();
  if (getToken && userId) {
    if (!supabaseUrl || !supabaseKey) return [];
    const token = await getSupabaseToken(getToken);
    if (token) {
      const liked = await fetchImpl(`${supabaseUrl}/rest/v1/question_likes?select=question_id&account_id=eq.${encodeURIComponent(userId)}&active=is.true&question_id=in.(${encodedList(ids)})`, { headers: { apikey: supabaseKey, Authorization: `Bearer ${token}`, Accept: "application/json" } });
      if (liked.ok) for (const row of await liked.json() as Array<{ question_id?: unknown }>) if (typeof row.question_id === "string") likedIds.add(row.question_id);
    }
  }

  return questions.flatMap(({ row, id, slug, track, visibility, difficulty }) => {
    const content = textByRevision.get(revisionByQuestion.get(id) ?? "");
    if (!content) return [];
    const promotedAt = typeof row.promoted_at === "string" ? row.promoted_at : null;
    const promotionCount = typeof row.promotion_like_count === "number" ? row.promotion_like_count : null;
    return [{
      id,
      slug,
      trackId: track,
      topicIds: topicIdsByQuestion.get(id) ?? [],
      difficulty,
      question: content.question,
      shortAnswer: content.shortAnswer,
      visibility: visibility as CommunityScope,
      contributorUsername: requiredText(row.community_contributor_username),
      likeCount: promotionCount ?? countByQuestion.get(id) ?? 0,
      promotedAt,
      publishedAt: typeof row.community_published_at === "string" ? row.community_published_at : null,
      likedByViewer: likedIds.has(id),
    } satisfies CommunityQuestion];
  });
}
