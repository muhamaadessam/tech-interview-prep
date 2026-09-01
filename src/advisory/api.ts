import { nodeRequest } from "../backend/api.ts";

export class AdvisoryError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number) { super(code); this.code = code; this.status = status; }
}

export async function runAdvisory({ getToken, submissionId, fetchImpl = fetch }: { getToken: () => Promise<string | null>; submissionId: string; fetchImpl?: typeof fetch }): Promise<{ status: string; commentId?: number }> {
  const token = await getToken();
  if (!token) throw new AdvisoryError("unauthenticated", 401);
  try { return await nodeRequest<{ status: string; commentId?: number }>({ path: "/advisories", token, fetchImpl, init: { method: "POST", body: JSON.stringify({ submissionId }) } }); }
  catch (error) { throw new AdvisoryError((error as { code?: string }).code ?? "advisory_unavailable", (error as { status?: number }).status ?? 503); }
}
