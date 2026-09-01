import { validateSubmission, type SubmissionDraft } from "../../src/submissions/validation.ts";
import { fetchUpstream } from "./upstream.ts";

export class SubmissionRouteError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number) { super(code); this.name = "SubmissionRouteError"; this.code = code; this.status = status; }
}

export type SubmissionRouteStore = { submit: (draft: SubmissionDraft, accessToken?: string) => Promise<unknown> };

export function createSupabaseSubmissionStore({ url, serviceRoleKey, fetchImpl = fetch }: { url: string; serviceRoleKey: string; fetchImpl?: typeof fetch }): SubmissionRouteStore {
  const base = url.replace(/\/$/, "");
  return {
    async submit(draft, accessToken) {
      if (!accessToken) throw new SubmissionRouteError("unauthenticated", 401);
      try { validateSubmission(draft); } catch (error) { throw new SubmissionRouteError(error instanceof Error ? error.message : "payload_invalid", 400); }
      const response = await fetchUpstream(fetchImpl, `${base}/functions/v1/submit-question`, { method: "POST", headers: { apikey: serviceRoleKey, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const body = (await response.json().catch(() => ({}))) as { error?: unknown };
      if (!response.ok) throw new SubmissionRouteError(typeof body?.error === "string" ? body.error : "submission_unavailable", response.status >= 500 ? response.status : response.status);
      return body;
    },
  };
}
