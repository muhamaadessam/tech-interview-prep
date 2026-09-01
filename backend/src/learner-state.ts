export type ProgressValue = "not-started" | "reviewing" | "mastered";
export type LearnerState = { progress: Array<{ questionId: string; progress: ProgressValue }>; favorites: string[] };

export class LearnerStateError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number) { super(code); this.name = "LearnerStateError"; this.code = code; this.status = status; }
}

type FetchLike = typeof fetch;
export type AskedMarkerResult = { personalCount: number | null; interviewFrequency: number };
type Store = {
  read: (userId: string) => Promise<LearnerState>;
  write: (userId: string, state: LearnerState) => Promise<void>;
  readAsked: (questionIds: string[], userId?: string) => Promise<Record<string, AskedMarkerResult>>;
  adjustAsked: (questionId: string, delta: -1 | 1, userId: string) => Promise<AskedMarkerResult>;
};

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
      await request("rpc/replace_learner_state_for_account", { method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ p_account_id: userId, p_progress: progress, p_favorites: favorites.map(({ question_id }) => question_id) }) });
    },
    async readAsked(questionIds, userId) {
      const filter = questionIds.map(encodeURIComponent).join(",");
      const [frequencies, personal] = await Promise.all([
        (await request(`interview_question_frequencies?select=question_id,frequency&question_id=in.(${filter})`)).json() as Promise<Array<{ question_id?: unknown; frequency?: unknown }>>,
        userId ? (await request(`asked_markers?select=question_id,asked_count&account_id=eq.${encodeURIComponent(userId)}&question_id=in.(${filter})`)).json() as Promise<Array<{ question_id?: unknown; asked_count?: unknown }>> : [],
      ]);
      const frequencyById = new Map(frequencies.flatMap((row) => typeof row.question_id === "string" && typeof row.frequency === "number" ? [[row.question_id, row.frequency] as const] : []));
      const personalById = new Map(personal.flatMap((row) => typeof row.question_id === "string" && typeof row.asked_count === "number" ? [[row.question_id, row.asked_count] as const] : []));
      return Object.fromEntries(questionIds.map((id) => [id, { personalCount: userId ? personalById.get(id) ?? 0 : null, interviewFrequency: frequencyById.get(id) ?? 0 }]));
    },
    async adjustAsked(questionId, delta, userId) {
      const response = await fetchUpstream(fetchImpl, `${base}/rest/v1/rpc/adjust_asked_marker_for_account`, { method: "POST", headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ p_account_id: userId, p_question_id: questionId, p_delta: delta }) });
      const payload = await response.json().catch(() => ({})) as Record<string, unknown> | Array<Record<string, unknown>>;
      const body = Array.isArray(payload) ? payload[0] ?? {} : payload;
      if (!response.ok) throw new LearnerStateError(typeof body.message === "string" ? body.message : "asked_marker_unavailable", response.status >= 500 ? response.status : 400);
      if (typeof body.personal_count !== "number" || typeof body.interview_frequency !== "number") throw new LearnerStateError("asked_marker_invalid_response", 502);
      return { personalCount: body.personal_count, interviewFrequency: body.interview_frequency };
    },
  };
}
import { fetchUpstream } from "./upstream.ts";
