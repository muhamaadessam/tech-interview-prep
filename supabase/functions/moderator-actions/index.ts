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
    const body = await request.json() as { action?: unknown; targetUserId?: unknown; submissionId?: unknown; questionId?: unknown; reason?: unknown; status?: unknown; targetQuestionIds?: unknown };
    const action = text(body.action, 60);
    const reason = text(body.reason);
    if (!action) return response({ error: "payload_invalid" }, 400);
    if (action === "list_follow_up_editor") {
      const questions = await (await db("/rest/v1/interview_questions?select=id,slug,track_id,published_revision_id&published_revision_id=not.is.null&order=track_id,slug&limit=1000", key)).json() as Array<{ id?: string; slug?: string; track_id?: string; published_revision_id?: string }>;
      const relations = await (await db("/rest/v1/question_follow_ups?select=source_revision_id,target_question_id,position&order=position.asc&limit=5000", key)).json() as Array<{ source_revision_id?: string; target_question_id?: string; position?: number }>;
      return response({
        sources: questions.flatMap((question) => typeof question.id === "string" && typeof question.slug === "string" && typeof question.track_id === "string" && typeof question.published_revision_id === "string" ? [{ id: question.id, slug: question.slug, track_id: question.track_id, target_ids: relations.filter((relation) => relation.source_revision_id === question.published_revision_id).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).flatMap((relation) => typeof relation.target_question_id === "string" ? [relation.target_question_id] : []) }] : []),
        targets: questions.flatMap((question) => typeof question.id === "string" && typeof question.slug === "string" && typeof question.track_id === "string" ? [{ id: question.id, slug: question.slug, track_id: question.track_id }] : []),
      });
    }
    if (action === "save_follow_ups") {
      const questionId = text(body.questionId, 120);
      const targetIds = Array.isArray(body.targetQuestionIds) ? [...new Set(body.targetQuestionIds.flatMap((value) => typeof value === "string" ? [value.trim()] : []).filter(Boolean))] : null;
      if (!questionId || !targetIds || targetIds.length > 8) return response({ error: "payload_invalid" }, 400);
      const sourceRows = await (await db(`/rest/v1/interview_questions?select=id,track_id,published_revision_id&id=eq.${encodeURIComponent(questionId)}&published_revision_id=not.is.null&limit=1`, key)).json() as Array<{ id: string; track_id: string; published_revision_id: string }>;
      const source = sourceRows[0];
      if (!source) return response({ error: "question_not_published" }, 409);
      if (targetIds.length) {
        const targetRows = await (await db(`/rest/v1/interview_questions?select=id,track_id,published_revision_id&id=in.(${targetIds.map(encodeURIComponent).join(",")})&track_id=eq.${encodeURIComponent(source.track_id)}&published_revision_id=not.is.null`, key)).json() as Array<{ id: string }>;
        if (targetRows.length !== targetIds.length || targetIds.includes(questionId)) return response({ error: "follow_up_target_invalid" }, 409);
      }
      const currentLocales = await (await db(`/rest/v1/question_revision_locales?select=locale,question,short_answer,explanation,code_example,common_mistakes,follow_up_questions,sources&revision_id=eq.${encodeURIComponent(source.published_revision_id)}`, key)).json() as Array<Record<string, unknown>>;
      if (!currentLocales.some((locale) => locale.locale === "ar") || !currentLocales.some((locale) => locale.locale === "en")) return response({ error: "question_translation_required" }, 409);
      const latest = await (await db(`/rest/v1/question_revisions?select=revision_number&question_id=eq.${encodeURIComponent(questionId)}&order=revision_number.desc&limit=1`, key)).json() as Array<{ revision_number?: number }>;
      const revisionNumber = (latest[0]?.revision_number ?? 0) + 1;
      const revisionRows = await (await db("/rest/v1/question_revisions", key, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify([{ question_id: questionId, revision_number: revisionNumber, status: "draft", reviewed_at: new Date().toISOString().slice(0, 10), created_by: actor }]) })).json() as Array<{ id?: string }>;
      const revisionId = revisionRows[0]?.id;
      if (!revisionId) return response({ error: "revision_create_failed" }, 503);
      await db("/rest/v1/question_revision_locales", key, { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(currentLocales.map((locale) => ({ ...locale, revision_id: revisionId }))) });
      if (targetIds.length) await db("/rest/v1/question_follow_ups", key, { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(targetIds.map((targetId, index) => ({ source_revision_id: revisionId, target_question_id: targetId, position: index + 1 }))) });
      await db(`/rest/v1/question_revisions?id=eq.${encodeURIComponent(revisionId)}`, key, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "published" }) });
      await db(`/rest/v1/interview_questions?id=eq.${encodeURIComponent(questionId)}`, key, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ published_revision_id: revisionId }) });
      await audit(key, actor, action, "question_revision", questionId, null, { revision_id: revisionId, target_question_ids: targetIds });
      return response({ ok: true, questionId, revisionId });
    }
    if (action === "list_submissions") {
      const allowed = ["pending", "issue_created", "in_review", "changes_requested", "approved"];
      const status = text(body.status, 40) ?? "pending";
      if (!allowed.includes(status)) return response({ error: "payload_invalid" }, 400);
      const rows = await (await db(`/rest/v1/submissions?select=id,status,track_id,topic_ids,difficulty,payload,review_notes,github_issue_number,github_issue_url,created_at&status=eq.${encodeURIComponent(status)}&order=created_at.asc&limit=50`, key)).json();
      return response({ submissions: rows });
    }
    if (action === "list_community_questions") {
      const rows = await (await db("/rest/v1/interview_questions?select=id,slug,track_id,visibility,community_contributor_username,community_published_at,community_unpublished_at,promoted_at,promotion_like_count,published_revision_id,source_submission_id&or=(visibility.eq.community,promoted_at.not.is.null)&order=community_published_at.desc.nullslast&limit=100", key)).json();
      return response({ questions: rows });
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
    if (action === "publish_submission") {
      const submissionId = text(body.submissionId, 80);
      const questionId = text(body.questionId, 120);
      if (!submissionId || !questionId) return response({ error: "payload_invalid" }, 400);
      const submissions = await (await db(`/rest/v1/submissions?select=id,status,track_id,submitted_by,display_name,github_issue_number,published_question_id&id=eq.${encodeURIComponent(submissionId)}&limit=1`, key)).json() as Array<{ id: string; status: string; track_id: string; submitted_by: string; display_name: string | null; github_issue_number: number | null; published_question_id: string | null }>;
      const submission = submissions[0];
      if (!submission) return response({ error: "not_found" }, 404);
      if (submission.status === "published") {
        if (submission.published_question_id === questionId) return response({ ok: true, status: "published", questionId });
        return response({ error: "submission_already_published" }, 409);
      }
      if (submission.status !== "approved") return response({ error: "submission_not_approved" }, 409);
      const questions = await (await db(`/rest/v1/interview_questions?select=id,track_id,published_revision_id,visibility,source_submission_id&id=eq.${encodeURIComponent(questionId)}&limit=1`, key)).json() as Array<{ id: string; track_id: string; published_revision_id: string | null; visibility: string; source_submission_id: string | null }>;
      const question = questions[0];
      if (!question) return response({ error: "question_not_found" }, 404);
      if (question.track_id !== submission.track_id) return response({ error: "track_mismatch" }, 409);
      if (!question.published_revision_id) return response({ error: "question_revision_required" }, 409);
      if (question.source_submission_id && question.source_submission_id !== submissionId) return response({ error: "question_already_linked" }, 409);
      const closed = await closeGithubIssue(submission.github_issue_number);
      if (!closed) return response({ error: "github_close_failed", retryable: true }, 503);
      await db(`/rest/v1/interview_questions?id=eq.${encodeURIComponent(questionId)}`, key, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ visibility: "community", source_submission_id: submissionId, community_contributor_user_id: submission.submitted_by, community_contributor_username: submission.display_name || "Community contributor", community_published_at: new Date().toISOString() }) });
      await db(`/rest/v1/submissions?id=eq.${encodeURIComponent(submissionId)}`, key, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "published", published_question_id: questionId, reviewed_by: actor, reviewed_at: new Date().toISOString(), last_error: null }) });
      await audit(key, actor, action, "question", questionId, null, { submission_id: submissionId, github_closed: closed });
      return response({ ok: true, status: "published", questionId });
    }
    if (action === "unpublish_question") {
      const questionId = text(body.questionId, 120);
      if (!questionId || !reason) return response({ error: "payload_invalid" }, 400);
      const current = await (await db(`/rest/v1/interview_questions?select=id,visibility&id=eq.${encodeURIComponent(questionId)}&limit=1`, key)).json() as Array<{ id: string; visibility: string }>;
      if (!current[0]) return response({ error: "not_found" }, 404);
      if (current[0].visibility !== "community") return response({ error: "question_not_community" }, 409);
      const updated = await (await db(`/rest/v1/interview_questions?id=eq.${encodeURIComponent(questionId)}`, key, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ community_unpublished_at: new Date().toISOString() }) })).json() as Array<{ id: string }>;
      if (!updated.length) return response({ error: "not_found" }, 404);
      await audit(key, actor, action, "question", questionId, reason);
      return response({ ok: true });
    }
    if (action === "republish_question") {
      const questionId = text(body.questionId, 120);
      if (!questionId) return response({ error: "payload_invalid" }, 400);
      const updated = await (await db(`/rest/v1/interview_questions?id=eq.${encodeURIComponent(questionId)}&published_revision_id=not.is.null`, key, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ community_unpublished_at: null, visibility: "community", community_published_at: new Date().toISOString() }) })).json() as Array<{ id: string }>;
      if (!updated.length) return response({ error: "question_not_ready" }, 409);
      await audit(key, actor, action, "question", questionId, null);
      return response({ ok: true });
    }
    return response({ error: "unsupported_action" }, 400);
  } catch (error) {
    console.error(error);
    return response({ error: "moderation_unavailable" }, 503);
  }
}

Deno.serve((request) => request.method === "OPTIONS" ? new Response("ok", { headers: cors }) : request.method !== "POST" ? response({ error: "method_not_allowed" }, 405) : handle(request));
