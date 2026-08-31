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
  const result = await fetch(`${Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "")}${path}`, { ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
  if (!result.ok) throw new Error("database_error");
  return result;
}

async function handle(request: Request): Promise<Response> {
  if (!request.headers.get("apikey")) return response({ error: "invalid_client" }, 401);
  const auth = await clerkAuth(request);
  const userId = typeof auth?.claims.sub === "string" ? auth.claims.sub : null;
  if (!userId) return response({ error: "unauthenticated" }, 401);
  const secret = Deno.env.get("CLERK_SECRET_KEY");
  if (!secret) return response({ error: "server_configuration_error" }, 503);
  try {
    const { key } = config();
    const anonymousId = `deleted:${await pseudonymousUserId(userId)}`;
    const submissions = await (await db(`/rest/v1/submissions?select=id,status&submitted_by=eq.${encodeURIComponent(userId)}`, key)).json() as Array<{ id: string; status: string }>;
    const published = submissions.filter((submission) => submission.status === "published").map((submission) => submission.id);
    const communityQuestions = await (await db(`/rest/v1/interview_questions?select=id&community_contributor_user_id=eq.${encodeURIComponent(userId)}`, key)).json() as Array<{ id: string }>;
    const communityQuestionIds = communityQuestions.map((question) => question.id);
    if (communityQuestionIds.length) {
      await db(`/rest/v1/interview_questions?id=in.(${communityQuestionIds.map(encodeURIComponent).join(",")})`, key, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ community_contributor_user_id: anonymousId, community_contributor_username: "Community contributor" }) });
    }
    if (published.length) {
      await db(`/rest/v1/submissions?id=in.(${published.map(encodeURIComponent).join(",")})`, key, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ submitted_by: anonymousId, display_name: "Community contributor" }) });
      await db(`/rest/v1/submission_revisions?submission_id=in.(${published.map(encodeURIComponent).join(",")})`, key, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ submitted_by: anonymousId }) });
    }
    await db(`/rest/v1/question_likes?account_id=eq.${encodeURIComponent(userId)}`, key, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    await db(`/rest/v1/submissions?submitted_by=eq.${encodeURIComponent(userId)}&status=neq.published`, key, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    await db(`/rest/v1/question_progress?user_id=eq.${encodeURIComponent(userId)}`, key, { method: "DELETE" });
    await db(`/rest/v1/favorites?user_id=eq.${encodeURIComponent(userId)}`, key, { method: "DELETE" });
    await db(`/rest/v1/account_track_preferences?user_id=eq.${encodeURIComponent(userId)}`, key, { method: "DELETE" });
    await db(`/rest/v1/submission_rate_limits?user_id=eq.${encodeURIComponent(userId)}`, key, { method: "DELETE" });
    await db(`/rest/v1/account_roles?user_id=eq.${encodeURIComponent(userId)}`, key, { method: "DELETE" });
    await db("/rest/v1/moderation_audit_events", key, { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify([{ actor_user_id: anonymousId, action: "account_deleted", target_type: "account", target_id: anonymousId, metadata: { published_submission_count: published.length } }]) });
    const deleted = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`, { method: "DELETE", headers: { Authorization: `Bearer ${secret}`, Accept: "application/json" } });
    if (!deleted.ok && deleted.status !== 404) return response({ error: "account_deletion_retryable" }, 503);
    return response({ ok: true });
  } catch (error) {
    console.error(error);
    return response({ error: "account_deletion_unavailable" }, 503);
  }
}

Deno.serve((request) => request.method === "OPTIONS" ? new Response("ok", { headers: cors }) : request.method !== "POST" ? response({ error: "method_not_allowed" }, 405) : handle(request));
