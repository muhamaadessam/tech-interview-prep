import { nodeRequest } from "../backend/api.ts";

export type TokenProvider = (options?: { template?: string }) => Promise<string | null>;

export class CommunityLikeError extends Error { readonly code: string; constructor(code: string) { super(code); this.code = code; } }

export async function setQuestionLike({ getToken, questionId, liked, fetchImpl = fetch }: { getToken: TokenProvider; questionId: string; liked: boolean; fetchImpl?: typeof fetch }): Promise<{ liked: boolean; likeCount: number; promoted: boolean }> {
  const token = await getToken();
  if (!token) throw new CommunityLikeError("unauthenticated");
  try { return await nodeRequest({ path: `/questions/${encodeURIComponent(questionId)}/like`, token, fetchImpl, init: { method: "POST", body: JSON.stringify({ liked }) } }); }
  catch (error) { throw new CommunityLikeError((error as { code?: string }).code ?? "community_unavailable"); }
}
