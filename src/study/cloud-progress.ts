import {
  getSavedQuestions,
  saveSavedQuestions,
  type QuestionProgress,
  type SavedQuestions,
  type StudyStorage,
} from "./progress.ts";
import { nodeRequest } from "../backend/api.ts";

const progressRank: Record<QuestionProgress, number> = {
  "not-started": 0,
  reviewing: 1,
  mastered: 2,
};

type FetchLike = typeof fetch;
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
  const token = await getToken();
  if (!token) return { synced: false, merged: local };
  if (mode === "merge") {
    const remote = await nodeRequest<{ progress: Array<{ questionId: string; progress: QuestionProgress }>; favorites: string[] }>({ path: "/me/learner-state", token, fetchImpl });
    const remoteSaved: SavedQuestions = {};
    for (const row of remote.progress) remoteSaved[row.questionId] = { progress: row.progress, favorite: false };
    for (const id of remote.favorites) remoteSaved[id] = { progress: remoteSaved[id]?.progress ?? "not-started", favorite: true };
    const merged = mergeSavedQuestions(local, remoteSaved);
    await nodeRequest({ path: "/me/learner-state", token, fetchImpl, init: { method: "PUT", body: JSON.stringify({ progress: Object.entries(merged).map(([questionId, state]) => ({ questionId, progress: state.progress })), favorites: Object.entries(merged).filter(([, state]) => state.favorite).map(([questionId]) => questionId) }) } });
    saveSavedQuestions(storage, merged, storageKey);
    return { synced: true, merged };
  }
  await nodeRequest({ path: "/me/learner-state", token, fetchImpl, init: { method: "PUT", body: JSON.stringify({ progress: Object.entries(local).map(([questionId, state]) => ({ questionId, progress: state.progress })), favorites: Object.entries(local).filter(([, state]) => state.favorite).map(([questionId]) => questionId) }) } });
  return { synced: true, merged: local };
}
