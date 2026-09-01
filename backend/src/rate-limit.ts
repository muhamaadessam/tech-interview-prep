type RateLimitOptions = { limit: number; windowMs: number; maxKeys: number };

// ponytail: per-process limiter; use a shared edge/WAF limiter when replicas need one global quota.
export function createRateLimiter({ limit, windowMs, maxKeys }: RateLimitOptions) {
  const buckets = new Map<string, { startedAt: number; count: number }>();
  return {
    allow(key: string, now = Date.now()): boolean {
      const current = buckets.get(key);
      if (!current || now - current.startedAt >= windowMs) {
        if (buckets.size >= maxKeys) buckets.delete(buckets.keys().next().value as string);
        buckets.set(key, { startedAt: now, count: 1 });
        return true;
      }
      current.count += 1;
      return current.count <= limit;
    },
  };
}
