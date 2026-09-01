type FetchLike = typeof fetch;

function timeoutMs(): number {
  const value = Number(process.env.UPSTREAM_TIMEOUT_MS ?? 5000);
  return Number.isFinite(value) ? Math.min(30_000, Math.max(1_000, value)) : 5000;
}

export async function fetchUpstream(fetchImpl: FetchLike, input: string | URL | Request, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  try { return await fetchImpl(input, { ...init, signal: init.signal ?? controller.signal }); }
  finally { clearTimeout(timer); }
}
