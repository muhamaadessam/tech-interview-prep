import type { SubmissionDraft } from "./validation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export type SubmissionResult = {
  submissionId: string;
  status: "pending" | "issue_created" | "failed";
  githubIssueNumber?: number | null;
  githubIssueUrl?: string | null;
  duplicateAdvisory?: boolean;
  retryable?: boolean;
};

export class SubmissionError extends Error {
  constructor(public readonly code: string, public readonly status: number) {
    super(code);
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
  if (!supabaseUrl || !supabaseKey) throw new SubmissionError("submission_unavailable", 503);
  const token = await getToken();
  if (!token) throw new SubmissionError("unauthenticated", 401);
  const result = await fetchImpl(`${supabaseUrl}/functions/v1/submit-question`, {
    method: "POST",
    headers: { apikey: supabaseKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  const body = await result.json().catch(() => ({})) as Record<string, unknown>;
  if (!result.ok) throw new SubmissionError(typeof body.error === "string" ? body.error : "submission_unavailable", result.status);
  return body as SubmissionResult;
}
