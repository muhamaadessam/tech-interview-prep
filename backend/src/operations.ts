import { handleModerator } from "./moderator-actions.ts";
import { buildSubmissionPrompt } from "../../src/submissions/validation.ts";

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
    const response = await fetchImpl(`${base}/rest/v1/submissions?select=id,status,track_id,topic_ids,difficulty,payload,display_name,review_notes,created_at&status=eq.${encodeURIComponent(status)}&order=created_at.asc&limit=50`, { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } });
    const payload = await response.json().catch(() => []) as Array<{ id: string; status: string; track_id: string; topic_ids: string[]; difficulty: "Junior" | "Mid" | "Senior" | null; payload: Record<string, unknown>; display_name: string | null; review_notes: string | null; created_at: string }>;
    if (!response.ok) throw new OperationError("moderation_unavailable", response.status);
    return { submissions: payload.map((row) => ({ ...row, prompt: buildSubmissionPrompt({ trackId: row.track_id, topicIds: row.topic_ids, difficulty: row.difficulty, question: String(row.payload.question ?? ""), shortAnswer: typeof row.payload.shortAnswer === "string" ? row.payload.shortAnswer : null, explanation: typeof row.payload.explanation === "string" ? row.payload.explanation : null, codeExample: typeof row.payload.codeExample === "string" ? row.payload.codeExample : null, commonMistakes: Array.isArray(row.payload.commonMistakes) ? row.payload.commonMistakes.filter((item): item is string => typeof item === "string") : [], followUpQuestions: Array.isArray(row.payload.followUpQuestions) ? row.payload.followUpQuestions.filter((item): item is string => typeof item === "string") : [], sources: Array.isArray(row.payload.sources) ? row.payload.sources.filter((item): item is string => typeof item === "string") : [], displayName: row.display_name }) })) };
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
