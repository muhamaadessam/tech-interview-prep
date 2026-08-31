import {
  advisoryComment,
  advisoryCommentMarker,
  advisoryModel,
  advisoryPromptVersion,
  advisoryProvider,
  advisorySchema,
  advisorySystemPrompt,
  buildAdvisoryEnvelope,
  validateAdvisoryResult,
} from "../../../src/advisory/review.ts";
import { clerkAuth } from "../_shared/clerk-auth.ts";

const cors = { "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
const transientStatuses = new Set([408, 429, 500, 502, 503, 504]);
const timeoutMs = 25_000;

type DbRow = Record<string, unknown>;
type AdvisoryRow = { id: string; status: string; result: unknown; github_comment_id: number | null };

function response(body: Record<string, unknown>, status = 200): Response { return new Response(JSON.stringify(body), { status, headers: cors }); }

function config(): { url: string; key: string } {
  const url = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("server_configuration_error");
  return { url, key };
}

async function db(path: string, key: string, init: RequestInit = {}): Promise<Response> {
  const result = await fetch(`${Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "")}${path}`, { ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
  if (!result.ok) throw new Error("database_error");
  return result;
}

async function isModerator(userId: string, key: string): Promise<boolean> {
  const rows = await (await db(`/rest/v1/account_roles?select=role,suspended&user_id=eq.${encodeURIComponent(userId)}&limit=1`, key)).json() as Array<{ role?: string; suspended?: boolean }>;
  return rows[0]?.role === "moderator" && rows[0]?.suspended !== true;
}

function githubBase(): { owner: string; repository: string } {
  const owner = Deno.env.get("GITHUB_REPOSITORY_OWNER");
  const repository = Deno.env.get("GITHUB_REPOSITORY_NAME");
  if (!owner || !repository) throw new Error("github_configuration_error");
  return { owner, repository };
}

function base64Url(value: Uint8Array): string { let binary = ""; for (const byte of value) binary += String.fromCharCode(byte); return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""); }
function pemBytes(pem: string): Uint8Array { return Uint8Array.from(atob(pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "")), (character) => character.charCodeAt(0)); }

async function githubToken(): Promise<string> {
  const appId = Deno.env.get("GITHUB_APP_ID");
  const installationId = Deno.env.get("GITHUB_INSTALLATION_ID");
  const privateKey = Deno.env.get("GITHUB_APP_PRIVATE_KEY")?.replaceAll("\\n", "\n");
  if (!appId || !installationId || !privateKey) throw new Error("github_configuration_error");
  const header = base64Url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64Url(new TextEncoder().encode(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId })));
  const key = await crypto.subtle.importKey("pkcs8", pemBytes(privateKey).buffer as ArrayBuffer, { hash: "SHA-256", name: "RSASSA-PKCS1-v1_5" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${payload}`));
  const result = await fetch(`https://api.github.com/app/installations/${encodeURIComponent(installationId)}/access_tokens`, { method: "POST", headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${header}.${payload}.${base64Url(new Uint8Array(signature))}`, "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "tech-interview-prep" } });
  if (!result.ok) throw new Error("github_token_error");
  const token = (await result.json() as { token?: string }).token;
  if (!token) throw new Error("github_token_error");
  return token;
}

async function postAdvisoryComment(issueNumber: number, body: string, key: { submissionId: string; revisionNumber: number }): Promise<number> {
  const token = await githubToken();
  const { owner, repository } = githubBase();
  const headers = { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "tech-interview-prep" };
  const comments = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/${issueNumber}/comments?per_page=100`, { headers });
  if (!comments.ok) throw new Error("github_comments_error");
  const existing = await comments.json() as Array<{ id?: number; body?: string }>;
  const match = existing.find((comment) => typeof comment.body === "string" && comment.body.includes(advisoryCommentMarker(key)));
  if (match?.id) return match.id;
  const created = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/${issueNumber}/comments`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
  if (!created.ok) throw new Error("github_comment_error");
  const result = await created.json() as { id?: number };
  if (!result.id) throw new Error("github_comment_error");
  return result.id;
}

function outputText(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const object = value as Record<string, unknown>;
  if (typeof object.output_text === "string") return object.output_text;
  const output = Array.isArray(object.output) ? object.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as Record<string, unknown>).content) ? (item as Record<string, unknown>).content as unknown[] : [];
    for (const part of content) if (part && typeof part === "object" && typeof (part as Record<string, unknown>).text === "string") return (part as Record<string, unknown>).text as string;
  }
  return null;
}

async function openAiReview(envelope: ReturnType<typeof buildAdvisoryEnvelope>): Promise<ReturnType<typeof validateAdvisoryResult>> {
  const secret = Deno.env.get("OPENAI_API_KEY");
  if (!secret) throw new Error("openai_configuration_error");
  let lastError = "openai_request_failed";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const result = await fetch("https://api.openai.com/v1/responses", { method: "POST", signal: controller.signal, headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: advisoryModel, input: [{ role: "system", content: advisorySystemPrompt }, { role: "user", content: JSON.stringify(envelope) }], tools: [], max_output_tokens: 1200, text: { format: { type: "json_schema", name: "advisory_review", strict: true, schema: advisorySchema } } }) });
      if (!result.ok) { lastError = `openai_http_${result.status}`; if (!transientStatuses.has(result.status) || attempt === 2) throw new Error(lastError); }
      else {
        const raw = outputText(await result.json());
        if (!raw) throw new Error("openai_schema_invalid");
        const parsed = validateAdvisoryResult(JSON.parse(raw));
        if (!parsed) throw new Error("openai_schema_invalid");
        return parsed;
      }
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error("openai_schema_invalid");
      lastError = error instanceof Error && error.name === "AbortError" ? "openai_timeout" : error instanceof Error ? error.message : lastError;
      if (!(error instanceof Error && (error.name === "AbortError" || error.name === "TypeError" || error.message.startsWith("openai_http_"))) || attempt === 2) throw new Error(lastError);
    } finally { clearTimeout(timer); }
    await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt + Math.floor(Math.random() * 100)));
  }
  throw new Error(lastError);
}

async function handle(request: Request): Promise<Response> {
  if (!request.headers.get("apikey")) return response({ error: "invalid_client" }, 401);
  const auth = await clerkAuth(request);
  const userId = typeof auth?.claims.sub === "string" ? auth.claims.sub : null;
  if (!userId) return response({ error: "unauthenticated" }, 401);
  try {
    const { key } = config();
    if (!(await isModerator(userId, key))) return response({ error: "moderator_required" }, 403);
    const body = await request.json() as { submissionId?: unknown; revisionNumber?: unknown };
    const submissionId = typeof body.submissionId === "string" && /^[0-9a-f-]{36}$/i.test(body.submissionId) ? body.submissionId : "";
    const revisionNumber = Number.isInteger(body.revisionNumber) && Number(body.revisionNumber) > 0 && Number(body.revisionNumber) <= 1000 ? Number(body.revisionNumber) : 1;
    if (!submissionId) return response({ error: "payload_invalid" }, 400);
    const submissions = await (await db(`/rest/v1/submissions?select=id,status,track_id,topic_ids,difficulty,github_issue_number&id=eq.${encodeURIComponent(submissionId)}&limit=1`, key)).json() as DbRow[];
    const submission = submissions[0];
    if (!submission || typeof submission.github_issue_number !== "number") return response({ error: "submission_not_ready" }, 409);
    if (!["issue_created", "in_review", "changes_requested", "approved"].includes(String(submission.status))) return response({ error: "submission_not_reviewable" }, 409);
    const revisions = await (await db(`/rest/v1/submission_revisions?select=revision_number,track_id,topic_ids,difficulty,payload&submission_id=eq.${encodeURIComponent(submissionId)}&revision_number=eq.${revisionNumber}&limit=1`, key)).json() as DbRow[];
    const revision = revisions[0];
    if (!revision) return response({ error: "revision_not_found" }, 404);
    if (String(revision.track_id) !== String(submission.track_id)) return response({ error: "revision_invalid" }, 409);
    const existingRows = await (await db(`/rest/v1/submission_advisories?select=id,status,result,github_comment_id&submission_id=eq.${encodeURIComponent(submissionId)}&revision_number=eq.${revisionNumber}&prompt_version=eq.${advisoryPromptVersion}&provider=eq.${advisoryProvider}&model=eq.${advisoryModel}&limit=1`, key)).json() as AdvisoryRow[];
    let existing = existingRows[0];
    let claimed = false;
    if (existing?.status === "completed" && existing.github_comment_id) return response({ status: existing.status, commentId: existing.github_comment_id });
    if (existing?.status === "running") return response({ status: "running", retryable: true }, 409);
    if (!existing) {
      try {
        existing = (await (await db("/rest/v1/submission_advisories", key, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify([{ submission_id: submissionId, revision_number: revisionNumber, status: "running", provider: advisoryProvider, model: advisoryModel, prompt_version: advisoryPromptVersion }]) })).json() as AdvisoryRow[])[0];
        claimed = true;
      } catch {
        existing = (await (await db(`/rest/v1/submission_advisories?select=id,status,result,github_comment_id&submission_id=eq.${encodeURIComponent(submissionId)}&revision_number=eq.${revisionNumber}&prompt_version=eq.${advisoryPromptVersion}&provider=eq.${advisoryProvider}&model=eq.${advisoryModel}&limit=1`, key)).json() as AdvisoryRow[])[0];
      }
    } else {
      await db(`/rest/v1/submission_advisories?id=eq.${encodeURIComponent(existing.id)}`, key, { method: "PATCH", body: JSON.stringify({ status: "running", last_error: null }) });
    }
    if (!existing?.id) throw new Error("database_error");
    if (existing.status === "running" && !claimed) return response({ status: "running", retryable: true }, 409);
    let result = validateAdvisoryResult(existing.result);
    try {
      if (!result) result = await openAiReview(buildAdvisoryEnvelope({ submissionId, trackId: String(revision.track_id ?? submission.track_id), topicIds: revision.topic_ids, difficulty: revision.difficulty, payload: revision.payload }));
      if (!result) throw new Error("openai_schema_invalid");
      await db(`/rest/v1/submission_advisories?id=eq.${encodeURIComponent(existing.id)}`, key, { method: "PATCH", body: JSON.stringify({ status: "comment_pending", result, last_error: null }) });
      const commentId = await postAdvisoryComment(Number(submission.github_issue_number), advisoryComment(result, { submissionId, revisionNumber }), { submissionId, revisionNumber });
      await db(`/rest/v1/submission_advisories?id=eq.${encodeURIComponent(existing.id)}`, key, { method: "PATCH", body: JSON.stringify({ status: "completed", github_comment_id: commentId, last_error: null }) });
      return response({ status: "completed", commentId });
    } catch (error) {
      const code = error instanceof Error ? error.message.slice(0, 120) : "advisory_failed";
      await db(`/rest/v1/submission_advisories?id=eq.${encodeURIComponent(existing.id)}`, key, { method: "PATCH", body: JSON.stringify({ status: result ? "comment_pending" : "failed", result, last_error: code }) }).catch(() => undefined);
      return response({ status: result ? "comment_pending" : "failed", retryable: true }, 503);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : "advisory_unavailable");
    return response({ error: "advisory_unavailable" }, 503);
  }
}

Deno.serve((request) => request.method === "OPTIONS" ? new Response("ok", { headers: cors }) : request.method !== "POST" ? response({ error: "method_not_allowed" }, 405) : handle(request));
