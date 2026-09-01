import assert from "node:assert/strict";
import test from "node:test";

import { createRateLimiter } from "./rate-limit.ts";

test("rate limiter bounds bursts and resets windows", () => {
  const limiter = createRateLimiter({ limit: 2, windowMs: 1000, maxKeys: 10 });
  assert.equal(limiter.allow("ip", 0), true);
  assert.equal(limiter.allow("ip", 1), true);
  assert.equal(limiter.allow("ip", 2), false);
  assert.equal(limiter.allow("ip", 1001), true);
});
