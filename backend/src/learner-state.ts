export type ProgressValue = "not-started" | "reviewing" | "mastered";
export type LearnerState = { progress: Array<{ questionId: string; progress: ProgressValue }>; favorites: string[] };

export class LearnerStateError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number) { super(code); this.name = "LearnerStateError"; this.code = code; this.status = status; }
}

type FetchLike = typeof fetch;
export type AskedMarkerResult = { personalCount: number | null; interviewFrequency: number };
type Store = { read: (userId: string) => Promise<LearnerState>; write: (userId: string, state: LearnerState) => Promise<void>; adjustAsked: (questionId: string, delta: -1 | 1, accessToken?: string) => Promise<AskedMarkerResult> };

export function createSupabaseLearnerStateStore({ url, serviceRoleKey, fetchImpl = fetch }: { url: string; serviceRoleKey: string; fetchImpl?: FetchLike }): Store {
  const base = url.replace(/\/$/, "");
  const request = async (path: string, init?: RequestInit) => {
    const response = await fetchUpstream(fetchImpl, `${base}/rest/v1/${path}`, { ...init, headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, Accept: "application/json", ...init?.headers } });
    if (!response.ok) throw new LearnerStateError("learner_state_unavailable", response.status >= 500 ? response.status : 503);
    return response;
  };
  return {
    async read(userId) {
      const [progress, favorites] = await Promise.all([
        (await request(`question_progress?select=question_id,progress&user_id=eq.${encodeURIComponent(userId)}`)).json() as Promise<Array<{ question_id?: unknown; progress?: unknown }>>,
        (await request(`favorites?select=question_id&user_id=eq.${encodeURIComponent(userId)}`)).json() as Promise<Array<{ question_id?: unknown }>>,
      ]);
      return { progress: progress.flatMap((row) => typeof row.question_id === "string" && (row.progress === "not-started" || row.progress === "reviewing" || row.progress === "mastered") ? [{ questionId: row.question_id, progress: row.progress }] : []), favorites: favorites.flatMap((row) => typeof row.question_id === "string" ? [row.question_id] : []) };
    },
    async write(userId, state) {
      const progress = state.progress.filter((row) => row.progress !== "not-started").map((row) => ({ user_id: userId, question_id: row.questionId, progress: row.progress }));
      const favorites = [...new Set(state.favorites)].map((questionId) => ({ user_id: userId, question_id: questionId }));
      if (progress.length) await request("question_progress?on_conflict=user_id,question_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify(progress) });
      if (favorites.length) await request("favorites?on_conflict=user_id,question_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify(favorites) });
    },
    async adjustAsked(questionId, delta, accessToken) {
      if (!accessToken) throw new LearnerStateError("unauthenticated", 401);
      const response = await fetchUpstream(fetchImpl, `${base}/rest/v1/rpc/adjust_asked_marker`, { method: "POST", headers: { apikey: serviceRoleKey, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ p_question_id: questionId, p_delta: delta }) });
      const body = await response.json().catch(() => ({})) as Record<string, unknown>;
      if (!response.ok) throw new LearnerStateError(typeof body.message === "string" ? body.message : "asked_marker_unavailable", response.status >= 500 ? response.status : 400);
      if (typeof body.personal_count !== "number" || typeof body.interview_frequency !== "number") throw new LearnerStateError("asked_marker_invalid_response", 502);
      return { personalCount: body.personal_count, interviewFrequency: body.interview_frequency };
    },
  };
}
import { fetchUpstream } from "./upstream.ts";
