import { clerkAuth, emailConfirmed } from "../_shared/clerk-auth.ts";

const cors = { "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
const reply = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });

async function handle(request: Request): Promise<Response> {
  if (!request.headers.get("apikey")) return reply({ error: "invalid_client" }, 401);
  if (Deno.env.get("COMMUNITY_LIKES_DISABLED") === "true") return reply({ error: "likes_disabled" }, 503);
  const auth = await clerkAuth(request);
  const userId = typeof auth?.claims.sub === "string" ? auth.claims.sub : null;
  if (!auth || !userId) return reply({ error: "unauthenticated" }, 401);
  if (!(await emailConfirmed(userId, auth.claims))) return reply({ error: "email_unconfirmed" }, 403);
  const body = await request.json().catch(() => ({})) as { questionId?: unknown; liked?: unknown };
  if (typeof body.questionId !== "string" || !body.questionId.trim() || typeof body.liked !== "boolean") return reply({ error: "payload_invalid" }, 400);
  const url = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
  const key = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? request.headers.get("apikey");
  if (!url || !key) return reply({ error: "server_configuration_error" }, 503);
  const result = await fetch(`${url}/rest/v1/rpc/set_question_like`, { method: "POST", headers: { apikey: key, Authorization: request.headers.get("authorization") ?? "", "Content-Type": "application/json" }, body: JSON.stringify({ p_question_id: body.questionId.trim().slice(0, 120), p_liked: body.liked }) });
  const payload = await result.json().catch(() => ({}));
  if (!result.ok) { const message = typeof payload?.message === "string" ? payload.message : typeof payload?.hint === "string" ? payload.hint : "like_failed"; return reply({ error: message }, result.status >= 500 ? 503 : 409); }
  const row = Array.isArray(payload) ? payload[0] : payload;
  return reply({ liked: row?.liked === true, likeCount: Number(row?.like_count ?? 0), promoted: row?.promoted === true });
}

Deno.serve((request) => request.method === "OPTIONS" ? new Response("ok", { headers: cors }) : request.method !== "POST" ? reply({ error: "method_not_allowed" }, 405) : handle(request));
