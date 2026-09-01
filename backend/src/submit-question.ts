import { normalizeQuestion, validateSubmission, type ValidatedSubmission } from "../../src/submissions/validation.ts";
import { buildReviewIssue } from "../../src/submissions/review-issue.ts";
import { fetchUpstream } from "./upstream.ts";

const cors = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};
const maxDailySubmissions = 5;
const cooldownMs = 60_000;
const stalePendingMs = 120_000;

type SubmissionRow = {
  id: string;
  status: string;
  github_issue_number: number | null;
  github_issue_url: string | null;
  last_error: string | null;
  revision_number: number;
  duplicate_advisory: boolean;
  updated_at: string;
};
type FetchLike = typeof fetch;

class DatabaseError extends Error {
  readonly status: number;
  constructor(status: number) {
    super("database_error");
    this.status = status;
  }
}

function response(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: cors });
}

async function pseudonymousUserId(userId: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(userId));
  return `user:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function dbConfig(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("server_configuration_error");
  return { url, key };
}

async function dbRequest(path: string, key: string, init: RequestInit = {}, fetchImpl: FetchLike = fetch): Promise<Response> {
  const response = await fetchUpstream(fetchImpl, `${process.env.SUPABASE_URL?.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) throw new DatabaseError(response.status);
  return response;
}

function jsonValue(value: unknown): unknown {
  return value && typeof value === "object" ? value : {};
}

function intersects(a: string[], b: string[]): boolean {
  const set = new Set(a);
  return b.some((value) => set.has(value));
}

async function isDuplicate(draft: ValidatedSubmission, key: string, fetchImpl: FetchLike = fetch): Promise<string | null> {
  const query = `/rest/v1/submissions?select=id,payload,topic_ids&track_id=eq.${encodeURIComponent(draft.trackId)}&status=in.(pending,issue_created,changes_requested,approved,published)&order=created_at.desc&limit=100`;
  const rows = await (await dbRequest(query, key, {}, fetchImpl)).json() as Array<{ id: string; payload?: unknown; topic_ids?: unknown }>;
  const normalized = normalizeQuestion(draft.question);
  const match = rows.find((row) => {
    const payload = jsonValue(row.payload) as { question?: unknown };
    const topics = Array.isArray(row.topic_ids) ? row.topic_ids.filter((topic): topic is string => typeof topic === "string") : [];
    return typeof payload.question === "string" && normalizeQuestion(payload.question) === normalized && (!draft.topicIds.length || intersects(topics, draft.topicIds));
  });
  return match?.id ?? null;
}

function base64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function pemBytes(pem: string): Uint8Array {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binary = atob(body);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function githubAppJwt(): Promise<string> {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replaceAll("\\n", "\n");
  if (!appId || !privateKey) throw new Error("github_configuration_error");
  const header = base64Url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64Url(new TextEncoder().encode(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId })));
  const key = await crypto.subtle.importKey("pkcs8", pemBytes(privateKey).buffer as ArrayBuffer, { hash: "SHA-256", name: "RSASSA-PKCS1-v1_5" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${payload}`));
  return `${header}.${payload}.${base64Url(new Uint8Array(signature))}`;
}

async function githubInstallationToken(fetchImpl: FetchLike = fetch): Promise<string> {
  const installationId = process.env.GITHUB_INSTALLATION_ID;
  if (!installationId) throw new Error("github_configuration_error");
  const appToken = await githubAppJwt();
  const installation = await fetchUpstream(fetchImpl, `https://api.github.com/app/installations/${encodeURIComponent(installationId)}/access_tokens`, {
    method: "POST",
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${appToken}`, "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "tech-interview-prep" },
  });
  if (!installation.ok) throw new Error("github_token_error");
  const { token } = await installation.json() as { token?: string };
  if (!token) throw new Error("github_token_error");
  return token;
}

async function findGithubIssue(token: string, owner: string, repository: string, submissionId: string, fetchImpl: FetchLike = fetch): Promise<{ number: number; url: string } | null> {
  const query = encodeURIComponent(`repo:${owner}/${repository} "submission-id: ${submissionId}"`);
  const result = await fetchUpstream(fetchImpl, `https://api.github.com/search/issues?q=${query}&per_page=1`, {
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "tech-interview-prep" },
  });
  if (!result.ok) throw new Error("github_search_error");
  const data = await result.json() as { items?: Array<{ number?: number; html_url?: string }> };
  const issue = data.items?.[0];
  return issue?.number && issue.html_url ? { number: issue.number, url: issue.html_url } : null;
}

async function createGithubIssue(draft: ValidatedSubmission, submissionId: string, fetchImpl: FetchLike = fetch): Promise<{ number: number; url: string }> {
  const owner = process.env.GITHUB_REPOSITORY_OWNER;
  const repository = process.env.GITHUB_REPOSITORY_NAME;
  if (!owner || !repository) throw new Error("github_configuration_error");
  const token = await githubInstallationToken(fetchImpl);
  const existing = await findGithubIssue(token, owner, repository, submissionId, fetchImpl);
  if (existing) return existing;
  const issueContent = buildReviewIssue({ draft, submissionId });
  const issue = await fetchUpstream(fetchImpl, `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues`, {
    method: "POST",
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "tech-interview-prep" },
    body: JSON.stringify(issueContent),
  });
  if (!issue.ok) throw new Error("github_issue_error");
  const created = await issue.json() as { number?: number; html_url?: string };
  if (!created.number || !created.html_url) throw new Error("github_issue_error");
  return { number: created.number, url: created.html_url };
}

export async function handleSubmit(request: Request, fetchImpl: FetchLike = fetch): Promise<Response> {
  const userId = request.headers.get("x-account-id");
  if (!userId) return response({ error: "unauthenticated" }, 401);
  const db = (path: string, key: string, init: RequestInit = {}) => dbRequest(path, key, init, fetchImpl);

  let draft: ValidatedSubmission;
  try {
    draft = validateSubmission(await request.json());
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : "payload_invalid" }, 400);
  }

  try {
    const { key } = dbConfig();
    const roles = await (await db(`/rest/v1/account_roles?select=suspended&user_id=eq.${encodeURIComponent(userId)}&limit=1`, key)).json() as Array<{ suspended?: boolean }>;
    if (roles[0]?.suspended) return response({ error: "submission_suspended" }, 403);
    const existing = await (await db(`/rest/v1/submissions?select=id,status,github_issue_number,github_issue_url,last_error,revision_number,duplicate_advisory,updated_at&submitted_by=eq.${encodeURIComponent(userId)}&idempotency_key=eq.${encodeURIComponent(draft.idempotencyKey)}&limit=1`, key)).json() as SubmissionRow[];
    const previous = existing[0];
    const pendingStatus = previous?.status === "pending" || previous?.status === "issue_creating";
    const pendingIsFresh = pendingStatus && Date.now() - Date.parse(previous.updated_at) < stalePendingMs;
    if (previous && ((previous.status !== "failed" && !pendingStatus) || pendingIsFresh)) {
      return response({ submissionId: previous.id, status: previous.status === "issue_creating" ? "pending" : previous.status, githubIssueNumber: previous.github_issue_number, githubIssueUrl: previous.github_issue_url, duplicateAdvisory: previous.duplicate_advisory });
    }
    const preferences = await (await db(`/rest/v1/account_track_preferences?select=track_id,tracks!inner(is_active)&user_id=eq.${encodeURIComponent(userId)}&track_id=eq.${encodeURIComponent(draft.trackId)}&tracks.is_active=eq.true&limit=1`, key)).json() as Array<{ track_id: string }>;
    if (preferences.length !== 1) return response({ error: "track_preference_required" }, 403);
    const topics = draft.topicIds.length
      ? await (await db(`/rest/v1/topics?select=id,track_id&id=in.(${draft.topicIds.map(encodeURIComponent).join(",")})`, key)).json() as Array<{ id: string; track_id: string }>
      : [];
    if (topics.length !== draft.topicIds.length || topics.some((topic) => topic.track_id !== draft.trackId)) return response({ error: "taxonomy_invalid" }, 400);

    const duplicateOf = await isDuplicate(draft, key, fetchImpl);
    if (!previous) {
      const limit = await (await db("/rest/v1/rpc/claim_submission_slot_reason", key, { method: "POST", body: JSON.stringify({ p_user_id: userId, p_daily_limit: maxDailySubmissions, p_cooldown_seconds: cooldownMs / 1000 }) })).json() as "allowed" | "daily_limit_reached" | "cooldown_active";
      if (limit !== "allowed") return response({ error: limit }, 429);
    }
    const payload = {
      question: draft.question,
      ...(draft.shortAnswer ? { shortAnswer: draft.shortAnswer } : {}),
      ...(draft.explanation ? { explanation: draft.explanation } : {}),
      ...(draft.sources.length ? { sources: draft.sources } : {}),
      ...(draft.codeExample ? { codeExample: draft.codeExample } : {}),
      ...(draft.commonMistakes.length ? { commonMistakes: draft.commonMistakes } : {}),
      ...(draft.followUpQuestions.length ? { followUpQuestions: draft.followUpQuestions } : {}),
    };
    let submissionId = previous?.id;
    let insertedNew = false;
    if (!submissionId) {
      try {
        const inserted = await (await db("/rest/v1/submissions", key, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify([{ submitted_by: userId, status: "pending", track_id: draft.trackId, topic_ids: draft.topicIds, difficulty: draft.difficulty, payload, idempotency_key: draft.idempotencyKey, duplicate_advisory: Boolean(duplicateOf), duplicate_of: duplicateOf, display_name: draft.displayName, license_consent: true }]) })).json() as Array<{ id: string }>;
        submissionId = inserted[0]?.id;
        insertedNew = Boolean(submissionId);
      } catch (error) {
        if (!(error instanceof DatabaseError) || error.status !== 409) throw error;
        const concurrent = await (await db(`/rest/v1/submissions?select=id&submitted_by=eq.${encodeURIComponent(userId)}&idempotency_key=eq.${encodeURIComponent(draft.idempotencyKey)}&limit=1`, key)).json() as Array<{ id: string }>;
        submissionId = concurrent[0]?.id;
      }
      if (!submissionId) throw new Error("database_error");
      if (insertedNew) {
        await db("/rest/v1/submission_revisions", key, { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify([{ submission_id: submissionId, revision_number: 1, submitted_by: userId, track_id: draft.trackId, topic_ids: draft.topicIds, difficulty: draft.difficulty, payload }]) });
        await db("/rest/v1/moderation_audit_events", key, { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify([{ actor_user_id: await pseudonymousUserId(userId), action: "submission_created", target_type: "submission", target_id: submissionId, metadata: { duplicate_advisory: Boolean(duplicateOf) } }]) });
      }
    } else {
      const revisions = await (await db(`/rest/v1/submission_revisions?select=id&submission_id=eq.${encodeURIComponent(submissionId)}&revision_number=eq.1&limit=1`, key)).json() as Array<{ id: string }>;
      if (!revisions.length) await db("/rest/v1/submission_revisions", key, { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify([{ submission_id: submissionId, revision_number: 1, submitted_by: userId, track_id: draft.trackId, topic_ids: draft.topicIds, difficulty: draft.difficulty, payload }]) });
      await db(`/rest/v1/submissions?id=eq.${encodeURIComponent(submissionId)}`, key, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "pending", last_error: null }) });
    }

    const claimed = await (await db(`/rest/v1/submissions?id=eq.${encodeURIComponent(submissionId)}&status=eq.pending`, key, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status: "issue_creating" }) })).json() as Array<{ id: string }>;
    if (!claimed.length) return response({ submissionId, status: "pending", retryable: true });

    try {
      const issue = await createGithubIssue(draft, submissionId, fetchImpl);
      await db(`/rest/v1/submissions?id=eq.${encodeURIComponent(submissionId)}`, key, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "issue_created", github_issue_number: issue.number, github_issue_url: issue.url, last_error: null }) });
      return response({ submissionId, status: "issue_created", githubIssueNumber: issue.number, githubIssueUrl: issue.url, duplicateAdvisory: Boolean(duplicateOf) });
    } catch {
      await db(`/rest/v1/submissions?id=eq.${encodeURIComponent(submissionId)}`, key, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "failed", last_error: "github_integration_failed" }) });
      return response({ submissionId, status: "failed", retryable: true, duplicateAdvisory: Boolean(duplicateOf) });
    }
  } catch (error) {
    console.error(error);
    return response({ error: "submission_unavailable" }, 503);
  }
}
