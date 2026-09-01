import { nodeRequest } from "../backend/api.ts";

export type AskedMarkerState = { personalCount: number | null; interviewFrequency: number };
export type AskedMarkerStates = Record<string, AskedMarkerState>;

type FetchLike = typeof fetch;
export type TokenProvider = (options?: { template?: string }) => Promise<string | null>;

export async function loadAskedMarkerStates({ questionIds, userId, getToken, fetchImpl = fetch }: { questionIds: string[]; userId?: string | null; getToken?: TokenProvider; fetchImpl?: FetchLike }): Promise<AskedMarkerStates> {
  const ids = [...new Set(questionIds.filter(Boolean))];
  if (!ids.length) return {};
  let token: string | undefined;
  if (userId && getToken) {
    token = (await getToken()) ?? undefined;
  }
  return nodeRequest<AskedMarkerStates>({ path: `${token ? "/me" : ""}/asked-markers?questionIds=${ids.map(encodeURIComponent).join(",")}`, token, fetchImpl });
}

export async function adjustAskedMarker({ questionId, delta, getToken, fetchImpl = fetch }: { questionId: string; delta: -1 | 1; getToken: TokenProvider; fetchImpl?: FetchLike }): Promise<AskedMarkerState> {
  const token = await getToken();
  if (!token) throw new Error("unauthenticated");
  try { return await nodeRequest<AskedMarkerState>({ path: `/questions/${encodeURIComponent(questionId)}/asked-marker`, token, fetchImpl, init: { method: "POST", body: JSON.stringify({ delta }) } }); }
  catch (error) { throw new Error((error as { code?: string }).code ?? "asked_marker_unavailable"); }
}

export function sortByInterviewFrequency<T extends { id: string }>(questions: T[], states: AskedMarkerStates): T[] {
  return questions
    .map((question, index) => ({ question, index, frequency: states[question.id]?.interviewFrequency ?? 0 }))
    .sort((a, b) => (b.frequency - a.frequency) || (a.index - b.index))
    .map(({ question }) => question);
}
