import { clerkAuth, pseudonymousUserId } from "../_shared/clerk-auth.ts";

const cors = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

function response(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: cors });
}

function config(): { url: string; key: string } {
  const url = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("server_configuration_error");
  return { url, key };
}

async function db(path: string, key: string, init: RequestInit = {}): Promise<Response> {
  const result = await fetch(`${Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!result.ok) throw new Error("database_error");
  return result;
}

function text(value: unknown, max = 500): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

function base64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function pemBytes(pem: string): Uint8Array {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  return Uint8Array.from(atob(body), (character) => character.charCodeAt(0));
}

async function githubToken(): Promise<string | null> {
  const appId = Deno.env.get("GITHUB_APP_ID");
  const installationId = Deno.env.get("GITHUB_INSTALLATION_ID");
  const privateKey = Deno.env.get("GITHUB_APP_PRIVATE_KEY")?.replaceAll("\\n", "\n");
  if (!appId || !installationId || !privateKey) return null;
  const header = base64Url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64Url(new TextEncoder().encode(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId })));
  const key = await crypto.subtle.importKey("pkcs8", pemBytes(privateKey).buffer as ArrayBuffer, { hash: "SHA-256", name: "RSASSA-PKCS1-v1_5" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${payload}`));
  const jwt = `${header}.${payload}.${base64Url(new Uint8Array(signature))}`;
  const result = await fetch(`https://api.github.com/app/installations/${encodeURIComponent(installationId)}/access_tokens`, { method: "POST", headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${jwt}`, "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "tech-interview-prep" } });
  if (!result.ok) return null;
  return (await result.json() as { token?: string }).token ?? null;
}

async function closeGithubIssue(issueNumber: number | null): Promise<boolean> {
  if (!issueNumber) return true;
  const owner = Deno.env.get("GITHUB_REPOSITORY_OWNER");
  const repository = Deno.env.get("GITHUB_REPOSITORY_NAME");
  const token = await githubToken();
  if (!owner || !repository || !token) return false;
  const result = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/${issueNumber}`, { method: "PATCH", headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "tech-interview-prep" }, body: JSON.stringify({ state: "closed" }) });
  return result.ok;
}

async function audit(key: string, actor: string, action: string, targetType: string, targetId: string | null, reason: string | null, metadata: Record<string, unknown> = {}): Promise<void> {
  await db("/rest/v1/moderation_audit_events", key, { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify([{ actor_user_id: await pseudonymousUserId(actor), action, target_type: targetType, target_id: targetId, reason, metadata }]) });
}

async function handle(request: Request): Promise<Response> {
  if (!request.headers.get("apikey")) return response({ error: "invalid_client" }, 401);
  const auth = await clerkAuth(request);
  const actor = typeof auth?.claims.sub === "string" ? auth.claims.sub : null;
  if (!actor) return response({ error: "unauthenticated" }, 401);
  try {
    const { key } = config();
    const roles = await (await db(`/rest/v1/account_roles?select=role,suspended&user_id=eq.${encodeURIComponent(actor)}&limit=1`, key)).json() as Array<{ role?: string; suspended?: boolean }>;
    if (roles[0]?.role !== "moderator" || roles[0]?.suspended) return response({ error: "moderator_required" }, 403);
    const body = await request.json() as { action?: unknown; targetUserId?: unknown; submissionId?: unknown; questionId?: unknown; reason?: unknown; status?: unknown };
    const action = text(body.action, 60);
    const reason = text(body.reason);
    if (!action) return response({ error: "payload_invalid" }, 400);
    if (action === "list_submissions") {
      const allowed = ["pending", "issue_created", "in_review", "changes_requested", "approved"];
      const status = text(body.status, 40) ?? "pending";
      if (!allowed.includes(status)) return response({ error: "payload_invalid" }, 400);
      const rows = await (await db(`/rest/v1/submissions?select=id,status,track_id,topic_ids,difficulty,payload,review_notes,github_issue_number,github_issue_url,created_at&status=eq.${encodeURIComponent(status)}&order=created_at.asc&limit=50`, key)).json();
      return response({ submissions: rows });
    }
    if (action === "suspend_account" || action === "reinstate_account") {
      const target = text(body.targetUserId, 200);
      if (!target) return response({ error: "payload_invalid" }, 400);
      const suspended = action === "suspend_account";
      await db("/rest/v1/account_roles", key, { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify([{ user_id: target, suspended, suspension_reason: suspended ? reason : null, suspended_at: suspended ? new Date().toISOString() : null }]) });
      await audit(key, actor, action, "account", await pseudonymousUserId(target), reason);
      return response({ ok: true, action });
    }
    if (action === "changes_requested" || action === "reject_submission") {
      const submissionId = text(body.submissionId, 80);
      if (!submissionId || !reason) return response({ error: "payload_invalid" }, 400);
      const rows = await (await db(`/rest/v1/submissions?select=id,github_issue_number,status&id=eq.${encodeURIComponent(submissionId)}&limit=1`, key)).json() as Array<{ id: string; github_issue_number: number | null; status: string }>;
      if (!rows[0]) return response({ error: "not_found" }, 404);
      if (rows[0].status === "published") return response({ error: "use_unpublish_action" }, 409);
      if (action === "changes_requested") {
        await db(`/rest/v1/submissions?id=eq.${encodeURIComponent(submissionId)}`, key, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "changes_requested", review_notes: reason, reviewed_by: actor, reviewed_at: new Date().toISOString() }) });
        await audit(key, actor, action, "submission", submissionId, reason);
        return response({ ok: true });
      }
      const closed = await closeGithubIssue(rows[0].github_issue_number);
      if (!closed) return response({ error: "github_close_failed", retryable: true }, 503);
      await db(`/rest/v1/submissions?id=eq.${encodeURIComponent(submissionId)}`, key, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "rejected", review_notes: reason, reviewed_by: actor, reviewed_at: new Date().toISOString(), closed_at: new Date().toISOString(), closed_by: actor }) });
      await audit(key, actor, action, "submission", submissionId, reason, { github_closed: closed });
      return response({ ok: true, githubClosed: closed });
    }
    if (action === "unpublish_question") {
      const questionId = text(body.questionId, 120);
      if (!questionId || !reason) return response({ error: "payload_invalid" }, 400);
      const updated = await (await db(`/rest/v1/interview_questions?id=eq.${encodeURIComponent(questionId)}`, key, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ published_revision_id: null }) })).json() as Array<{ id: string }>;
      if (!updated.length) return response({ error: "not_found" }, 404);
      await audit(key, actor, action, "question", questionId, reason);
      return response({ ok: true });
    }
    return response({ error: "unsupported_action" }, 400);
  } catch (error) {
    console.error(error);
    return response({ error: "moderation_unavailable" }, 503);
  }
}

Deno.serve((request) => request.method === "OPTIONS" ? new Response("ok", { headers: cors }) : request.method !== "POST" ? response({ error: "method_not_allowed" }, 405) : handle(request));
