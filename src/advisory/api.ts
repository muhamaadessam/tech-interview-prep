export class AdvisoryError extends Error {
  constructor(public readonly code: string, public readonly status: number) { super(code); }
}

export async function runAdvisory({ getToken, submissionId, fetchImpl = fetch }: { getToken: () => Promise<string | null>; submissionId: string; fetchImpl?: typeof fetch }): Promise<{ status: string; commentId?: number }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const token = await getToken();
  if (!url || !key) throw new AdvisoryError("advisory_unavailable", 503);
  if (!token) throw new AdvisoryError("unauthenticated", 401);
  const result = await fetchImpl(`${url}/functions/v1/ai-advisory`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ submissionId, revisionNumber: 1 }) });
  const body = await result.json().catch(() => ({})) as { status?: string; commentId?: number; error?: string };
  if (!result.ok) throw new AdvisoryError(body.error ?? body.status ?? "advisory_unavailable", result.status);
  return { status: body.status ?? "completed", commentId: body.commentId };
}
