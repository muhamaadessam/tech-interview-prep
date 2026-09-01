import { validateSubmission, type SubmissionDraft } from "../../src/submissions/validation.ts";
import { handleSubmit } from "./submit-question.ts";

export class SubmissionRouteError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number) { super(code); this.name = "SubmissionRouteError"; this.code = code; this.status = status; }
}

export type SubmissionRouteStore = { submit: (draft: SubmissionDraft, accessToken?: string, userId?: string) => Promise<unknown> };

export function createSupabaseSubmissionStore({ url, serviceRoleKey, fetchImpl = fetch }: { url: string; serviceRoleKey: string; fetchImpl?: typeof fetch }): SubmissionRouteStore {
  const base = url.replace(/\/$/, "");
  return {
    async submit(draft, accessToken, userId) {
      if (!accessToken) throw new SubmissionRouteError("unauthenticated", 401);
      if (!userId) throw new SubmissionRouteError("unauthenticated", 401);
      try { validateSubmission(draft); } catch (error) { throw new SubmissionRouteError(error instanceof Error ? error.message : "payload_invalid", 400); }
      const response = await handleSubmit(new Request("http://node.internal/v1/submissions", { method: "POST", headers: { "x-account-id": userId, "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(draft) }), fetchImpl);
      const body = (await response.json().catch(() => ({}))) as { error?: unknown };
      if (!response.ok) throw new SubmissionRouteError(typeof body?.error === "string" ? body.error : "submission_unavailable", response.status >= 500 ? response.status : response.status);
      return body;
    },
  };
}
