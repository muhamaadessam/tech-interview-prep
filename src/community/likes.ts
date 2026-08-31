import { getSupabaseToken, type SupabaseTokenProvider } from "../supabase/auth-token.ts";

export class CommunityLikeError extends Error { readonly code: string; constructor(code: string) { super(code); this.code = code; } }

export async function setQuestionLike({ getToken, questionId, liked, fetchImpl = fetch }: { getToken: SupabaseTokenProvider; questionId: string; liked: boolean; fetchImpl?: typeof fetch }): Promise<{ liked: boolean; likeCount: number; promoted: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new CommunityLikeError("community_unavailable");
  const token = await getSupabaseToken(getToken);
  if (!token) throw new CommunityLikeError("unauthenticated");
  const result = await fetchImpl(`${url}/functions/v1/question-like`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ questionId, liked }) });
  const body = await result.json().catch(() => ({})) as Record<string, unknown>;
  if (!result.ok) throw new CommunityLikeError(typeof body.error === "string" ? body.error : "community_unavailable");
  if (typeof body.liked !== "boolean" || typeof body.likeCount !== "number" || typeof body.promoted !== "boolean") throw new CommunityLikeError("invalid_response");
  return { liked: body.liked, likeCount: body.likeCount, promoted: body.promoted };
}
