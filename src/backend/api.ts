export function nodeApiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_NODE_API_ENABLED === "true" && Boolean(process.env.NEXT_PUBLIC_API_URL);
}

export function nodeApiUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  return nodeApiEnabled() && value ? value : null;
}

export async function nodeRequest<T>({ path, token, fetchImpl = fetch, init }: { path: string; token?: string; fetchImpl?: typeof fetch; init?: RequestInit }): Promise<T> {
  const base = nodeApiUrl();
  if (!base) throw new Error("node_api_unavailable");
  const response = await fetchImpl(`${base}/v1${path}`, { ...init, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json", ...init?.headers } });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw Object.assign(new Error(typeof body.error === "string" ? body.error : "node_api_unavailable"), { status: response.status, code: typeof body.error === "string" ? body.error : "node_api_unavailable" });
  return body as T;
}
