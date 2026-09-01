import { handleModerator } from "./moderator-actions.ts";

export class OperationError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number) { super(code); this.name = "OperationError"; this.code = code; this.status = status; }
}

export type Operations = {
  moderate: (body: Record<string, unknown>, accessToken: string, userId?: string) => Promise<unknown>;
};

export function createSupabaseOperations({ url, serviceRoleKey, fetchImpl = fetch }: { url: string; serviceRoleKey: string; fetchImpl?: typeof fetch }): Operations {
  const base = url.replace(/\/$/, "");
  const listSubmissions = async (body: Record<string, unknown>) => {
    const status = typeof body.status === "string" ? body.status : "pending";
    const response = await fetchImpl(`${base}/rest/v1/submissions?select=id,status,track_id,topic_ids,difficulty,payload,review_notes,created_at&status=eq.${encodeURIComponent(status)}&order=created_at.asc&limit=50`, { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new OperationError("moderation_unavailable", response.status);
    return { submissions: payload };
  };
  const call = async (handler: (request: Request, fetchImpl?: typeof fetch) => Promise<Response>, body: Record<string, unknown>, userId: string) => {
    const response = await handler(new Request("http://node.internal", { method: "POST", headers: { "x-account-id": userId, "Content-Type": "application/json" }, body: JSON.stringify(body) }), fetchImpl);
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) throw new OperationError(typeof payload.error === "string" ? payload.error : "operation_unavailable", response.status);
    return payload;
  };
  return {
    moderate: (body, _accessToken, userId) => userId ? body.action === "list_submissions" ? listSubmissions(body) : call(handleModerator, body, userId) : Promise.reject(new OperationError("unauthenticated", 401)),
  };
}
