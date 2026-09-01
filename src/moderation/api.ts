export type ModerationStatus = "pending" | "in_review" | "changes_requested" | "approved" | "rejected" | "published" | "failed";

export type ModerationSubmission = {
  id: string;
  status: ModerationStatus;
  track_id: string;
  topic_ids: string[];
  difficulty: string;
  payload: { question?: string; shortAnswer?: string; explanation?: string; sources?: string[] };
  prompt?: string;
  review_notes: string | null;
  created_at: string;
};

import { nodeRequest } from "../backend/api.ts";

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
  const token = await getToken();
  if (!token) throw new ModerationError("unauthenticated", 401);
  try { return await nodeRequest<T>({ path: "/moderation/actions", token, fetchImpl, init: { method: "POST", body: JSON.stringify(body) } }); }
  catch (error) { throw new ModerationError((error as { code?: string }).code ?? "moderation_unavailable", (error as { status?: number }).status ?? 503); }
}

export async function hasModeratorAccess({
  userId,
  getToken,
  fetchImpl = fetch,
}: {
  userId: string;
  getToken: () => Promise<string | null>;
  fetchImpl?: typeof fetch;
}): Promise<boolean> {
  void userId;
  const token = await getToken();
  if (!token) return false;
  try { return (await nodeRequest<{ allowed: boolean }>({ path: "/me/moderator-access", token, fetchImpl })).allowed === true; }
  catch { return false; }
}
