import { getSupabaseToken, type SupabaseTokenProvider } from "../supabase/auth-token.ts";

export type AskedMarkerState = { personalCount: number | null; interviewFrequency: number };
export type AskedMarkerStates = Record<string, AskedMarkerState>;

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function config(): { url: string; key: string } {
  if (!supabaseUrl || !supabaseKey) throw new Error("asked_marker_unavailable");
  return { url: supabaseUrl, key: supabaseKey };
}

function idsQuery(ids: string[]): string {
  return ids.map((id) => encodeURIComponent(id)).join(",");
}

function stateFor(ids: string[], frequencies: Array<{ question_id?: unknown; frequency?: unknown }>, personal: Array<{ question_id?: unknown; asked_count?: unknown }> = []): AskedMarkerStates {
  const frequencyById = new Map(frequencies.flatMap((row) => typeof row.question_id === "string" && typeof row.frequency === "number" && Number.isInteger(row.frequency) && row.frequency >= 0 ? [[row.question_id, row.frequency] as const] : []));
  const personalById = new Map(personal.flatMap((row) => typeof row.question_id === "string" && typeof row.asked_count === "number" && Number.isInteger(row.asked_count) && row.asked_count >= 0 ? [[row.question_id, row.asked_count] as const] : []));
  return Object.fromEntries(ids.map((id) => [id, { personalCount: personalById.get(id) ?? null, interviewFrequency: frequencyById.get(id) ?? 0 }]));
}

export async function loadAskedMarkerStates({ questionIds, userId, getToken, fetchImpl = fetch }: { questionIds: string[]; userId?: string | null; getToken?: SupabaseTokenProvider; fetchImpl?: FetchLike }): Promise<AskedMarkerStates> {
  const ids = [...new Set(questionIds.filter(Boolean))];
  if (!ids.length) return {};
  const { url, key } = config();
  const frequencyResponse = await fetchImpl(`${url}/rest/v1/interview_question_frequencies?select=question_id,frequency&question_id=in.(${idsQuery(ids)})`, { headers: { apikey: key, Accept: "application/json" } });
  if (!frequencyResponse.ok) throw new Error("asked_marker_unavailable");
  const personal: Array<{ question_id?: unknown; asked_count?: unknown }> = [];
  if (userId && getToken) {
    const token = await getSupabaseToken(getToken);
    if (token) {
      const response = await fetchImpl(`${url}/rest/v1/asked_markers?select=question_id,asked_count&account_id=eq.${encodeURIComponent(userId)}&question_id=in.(${idsQuery(ids)})`, { headers: { apikey: key, Authorization: `Bearer ${token}`, Accept: "application/json" } });
      if (response.ok) personal.push(...await response.json() as Array<{ question_id?: unknown; asked_count?: unknown }>);
    }
  }
  return stateFor(ids, await frequencyResponse.json() as Array<{ question_id?: unknown; frequency?: unknown }>, personal);
}

export async function adjustAskedMarker({ questionId, delta, getToken, fetchImpl = fetch }: { questionId: string; delta: -1 | 1; getToken: SupabaseTokenProvider; fetchImpl?: FetchLike }): Promise<AskedMarkerState> {
  const { url, key } = config();
  const token = await getSupabaseToken(getToken);
  if (!token) throw new Error("unauthenticated");
  const response = await fetchImpl(`${url}/rest/v1/rpc/adjust_asked_marker`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ p_question_id: questionId, p_delta: delta }) });
  const body = await response.json().catch(() => ({})) as Record<string, unknown> | Array<Record<string, unknown>>;
  if (!response.ok) {
    const error = Array.isArray(body) ? body[0] : body;
    throw new Error(typeof error?.message === "string" ? error.message : typeof error?.error === "string" ? error.error : "asked_marker_unavailable");
  }
  const row = Array.isArray(body) ? body[0] : body;
  if (typeof row?.personal_count !== "number" || typeof row.interview_frequency !== "number") throw new Error("asked_marker_invalid_response");
  return { personalCount: row.personal_count, interviewFrequency: row.interview_frequency };
}

export function sortByInterviewFrequency<T extends { id: string }>(questions: T[], states: AskedMarkerStates): T[] {
  return questions
    .map((question, index) => ({ question, index, frequency: states[question.id]?.interviewFrequency ?? 0 }))
    .sort((a, b) => (b.frequency - a.frequency) || (a.index - b.index))
    .map(({ question }) => question);
}
