export type ModerationStatus = "pending" | "issue_created" | "in_review" | "changes_requested" | "approved" | "rejected" | "published" | "failed";

export type ModerationSubmission = {
  id: string;
  status: ModerationStatus;
  track_id: string;
  topic_ids: string[];
  difficulty: string;
  payload: { question?: string; shortAnswer?: string; explanation?: string; sources?: string[] };
  review_notes: string | null;
  github_issue_number: number | null;
  github_issue_url: string | null;
  created_at: string;
};

function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

export class ModerationError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number) { super(code); this.code = code; this.status = status; }
}

export async function moderationRequest<T>({
  getToken,
  body,
  fetchImpl = fetch,
}: {
  getToken: () => Promise<string | null>;
  body: Record<string, unknown>;
  fetchImpl?: typeof fetch;
}): Promise<T> {
  const config = supabaseConfig();
  if (!config) throw new ModerationError("moderation_unavailable", 503);
  const token = await getToken();
  if (!token) throw new ModerationError("unauthenticated", 401);
  const result = await fetchImpl(`${config.url}/functions/v1/moderator-actions`, {
    method: "POST",
    headers: { apikey: config.key, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const response = await result.json().catch(() => ({})) as Record<string, unknown>;
  if (!result.ok) throw new ModerationError(typeof response.error === "string" ? response.error : "moderation_unavailable", result.status);
  return response as T;
}
