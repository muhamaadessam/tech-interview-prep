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
  const call = async (name: string, body: Record<string, unknown>, accessToken: string) => {
    const response = await fetchUpstream(fetchImpl, `${base}/functions/v1/${name}`, { method: "POST", headers: { apikey: serviceRoleKey, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) throw new OperationError(typeof payload.error === "string" ? payload.error : `${name}_unavailable`, response.status);
    return payload;
  };
  return {
    moderate: (body, accessToken) => call("moderator-actions", body, accessToken),
    advise: (submissionId, accessToken) => call("ai-advisory", { submissionId, revisionNumber: 1 }, accessToken),
  };
}
