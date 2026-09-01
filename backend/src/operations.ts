import { fetchUpstream } from "./upstream.ts";

export class OperationError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number) { super(code); this.name = "OperationError"; this.code = code; this.status = status; }
}

export type Operations = {
  moderate: (body: Record<string, unknown>, accessToken: string) => Promise<unknown>;
  advise: (submissionId: string, accessToken: string) => Promise<unknown>;
};

export function createSupabaseOperations({ url, serviceRoleKey, fetchImpl = fetch }: { url: string; serviceRoleKey: string; fetchImpl?: typeof fetch }): Operations {
  const base = url.replace(/\/$/, "");
  const listSubmissions = async (body: Record<string, unknown>) => {
    const status = typeof body.status === "string" ? body.status : "pending";
    const response = await fetchImpl(`${base}/rest/v1/submissions?select=id,status,track_id,topic_ids,difficulty,payload,review_notes,github_issue_number,github_issue_url,created_at&status=eq.${encodeURIComponent(status)}&order=created_at.asc&limit=50`, { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new OperationError("moderation_unavailable", response.status);
    return { submissions: payload };
  };
  const call = async (name: string, body: Record<string, unknown>, accessToken: string) => {
    const response = await fetchUpstream(fetchImpl, `${base}/functions/v1/${name}`, { method: "POST", headers: { apikey: serviceRoleKey, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) throw new OperationError(typeof payload.error === "string" ? payload.error : `${name}_unavailable`, response.status);
    return payload;
  };
  return {
    moderate: (body, accessToken) => body.action === "list_submissions" ? listSubmissions(body) : call("moderator-actions", body, accessToken),
    advise: (submissionId, accessToken) => call("ai-advisory", { submissionId, revisionNumber: 1 }, accessToken),
  };
}
