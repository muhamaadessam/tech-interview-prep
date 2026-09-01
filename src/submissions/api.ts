import type { SubmissionDraft } from "./validation";
import { nodeRequest } from "../backend/api.ts";

export type SubmissionResult = {
  submissionId: string;
  status: "pending" | "approved" | "published" | "failed";
  duplicateAdvisory?: boolean;
  retryable?: boolean;
};

export class SubmissionError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

export async function submitQuestion({
  draft,
  getToken,
  fetchImpl = fetch,
}: {
  draft: SubmissionDraft;
  getToken: () => Promise<string | null>;
  fetchImpl?: typeof fetch;
}): Promise<SubmissionResult> {
  const token = await getToken();
  if (!token) throw new SubmissionError("unauthenticated", 401);
  try { return await nodeRequest<SubmissionResult>({ path: "/submissions", token, fetchImpl, init: { method: "POST", body: JSON.stringify(draft) } }); }
  catch (error) { throw new SubmissionError((error as { code?: string }).code ?? "submission_unavailable", (error as { status?: number }).status ?? 503); }
}
