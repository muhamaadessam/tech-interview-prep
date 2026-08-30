import {
  getSavedQuestions,
  saveSavedQuestions,
  type QuestionProgress,
  type SavedQuestions,
  type StudyStorage,
} from "./progress.ts";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const progressRank: Record<QuestionProgress, number> = {
  "not-started": 0,
  reviewing: 1,
  mastered: 2,
};

export type CloudProgressRow = { question_id: string; progress: QuestionProgress };
export type CloudFavoriteRow = { question_id: string };

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
type TokenProvider = (options?: { template?: string }) => Promise<string | null>;

export function mergeSavedQuestions(local: SavedQuestions, remote: SavedQuestions): SavedQuestions {
  const merged: SavedQuestions = {};
  const ids = new Set([...Object.keys(local), ...Object.keys(remote)]);
  for (const id of ids) {
    const localState = local[id];
    const remoteState = remote[id];
    const progress = !localState ? remoteState.progress : !remoteState ? localState.progress : progressRank[localState.progress] >= progressRank[remoteState.progress] ? localState.progress : remoteState.progress;
    const favorite = Boolean(localState?.favorite || remoteState?.favorite);
    if (progress !== "not-started" || favorite) merged[id] = { progress, favorite };
  }
  return merged;
}

function headers(token: string): HeadersInit {
  return { apikey: supabaseKey ?? "", Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function request(fetchImpl: FetchLike, url: string, token: string, init?: RequestInit): Promise<Response> {
  const response = await fetchImpl(url, { ...init, headers: { ...headers(token), ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error(`Supabase request failed (${response.status})`);
  return response;
}

function rowsToSaved(progressRows: CloudProgressRow[], favoriteRows: CloudFavoriteRow[]): SavedQuestions {
  const data: SavedQuestions = {};
  for (const row of progressRows) {
    if (row && typeof row.question_id === "string" && typeof row.progress === "string" && Object.hasOwn(progressRank, row.progress)) data[row.question_id] = { progress: row.progress as QuestionProgress, favorite: false };
  }
  for (const row of favoriteRows) {
    if (row && typeof row.question_id === "string") data[row.question_id] = { progress: data[row.question_id]?.progress ?? "not-started", favorite: true };
  }
  return data;
}

function questionFilter(ids: string[]): string {
  return ids.map((id) => encodeURIComponent(id)).join(",");
}

export async function syncStudyProgress({
  storage,
  userId,
  getToken,
  fetchImpl = fetch,
  mode = "merge",
  storageKey,
}: {
  storage: Pick<StudyStorage, "getItem" | "setItem">;
  userId: string;
  getToken: TokenProvider;
  fetchImpl?: FetchLike;
  mode?: "merge" | "replace";
  storageKey?: string;
}): Promise<{ synced: boolean; merged: SavedQuestions }> {
  const local = getSavedQuestions(storage, storageKey);
  if (!supabaseUrl || !supabaseKey) return { synced: false, merged: local };
  const token = await getToken();
  if (!token) return { synced: false, merged: local };

  const progressResponse = await request(fetchImpl, `${supabaseUrl}/rest/v1/question_progress?select=question_id,progress&user_id=eq.${encodeURIComponent(userId)}`, token);
  const favoriteResponse = await request(fetchImpl, `${supabaseUrl}/rest/v1/favorites?select=question_id&user_id=eq.${encodeURIComponent(userId)}`, token);
  const remote = rowsToSaved(await progressResponse.json() as CloudProgressRow[], await favoriteResponse.json() as CloudFavoriteRow[]);
  const merged = mode === "merge" ? mergeSavedQuestions(local, remote) : local;
  const ids = new Set([...Object.keys(local), ...Object.keys(remote)]);
  const progressToSave = [...ids].filter((id) => merged[id]?.progress !== undefined && merged[id].progress !== "not-started").map((questionId) => ({ user_id: userId, question_id: questionId, progress: merged[questionId].progress }));
  const favoriteToSave = [...ids].filter((id) => merged[id]?.favorite).map((questionId) => ({ user_id: userId, question_id: questionId }));
  if (progressToSave.length) await request(fetchImpl, `${supabaseUrl}/rest/v1/question_progress?on_conflict=user_id,question_id`, token, { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify(progressToSave) });
  if (favoriteToSave.length) await request(fetchImpl, `${supabaseUrl}/rest/v1/favorites?on_conflict=user_id,question_id`, token, { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify(favoriteToSave) });

  const progressToDelete = [...ids].filter((id) => remote[id]?.progress !== undefined && (!merged[id] || merged[id].progress === "not-started"));
  const favoritesToDelete = [...ids].filter((id) => remote[id]?.favorite && !merged[id]?.favorite);
  if (progressToDelete.length) await request(fetchImpl, `${supabaseUrl}/rest/v1/question_progress?user_id=eq.${encodeURIComponent(userId)}&question_id=in.(${questionFilter(progressToDelete)})`, token, { method: "DELETE" });
  if (favoritesToDelete.length) await request(fetchImpl, `${supabaseUrl}/rest/v1/favorites?user_id=eq.${encodeURIComponent(userId)}&question_id=in.(${questionFilter(favoritesToDelete)})`, token, { method: "DELETE" });
  const latest = getSavedQuestions(storage, storageKey);
  if (JSON.stringify(latest) !== JSON.stringify(local)) return { synced: true, merged: latest };
  saveSavedQuestions(storage, merged, storageKey);
  return { synced: true, merged };
}
