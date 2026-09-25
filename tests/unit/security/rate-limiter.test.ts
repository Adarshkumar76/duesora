import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkRateLimit,
  createRateLimitResponse,
  resetRateLimits,
  getClientIp,
} from "@/lib/security/rate-limiter";

describe("Sliding Window Rate Limiter", () => {
  beforeEach(() => {
    resetRateLimits();
    vi.useRealTimers();
  });

  it("permits requests within the defined threshold", () => {
    const key = "test-client-1";
    const config = { maxRequests: 3, windowMs: 1000 };

    const first = checkRateLimit(key, config);
    expect(first.success).toBe(true);
    expect(first.remaining).toBe(2);

    const second = checkRateLimit(key, config);
    expect(second.success).toBe(true);
    expect(second.remaining).toBe(1);

    const third = checkRateLimit(key, config);
    expect(third.success).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it("blocks requests once the threshold is exceeded and returns retry time", () => {
    const key = "test-client-blocked";
    const config = { maxRequests: 2, windowMs: 10000 };

    checkRateLimit(key, config);
    checkRateLimit(key, config);

    const blocked = checkRateLimit(key, config);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets capacity after the sliding window expires", () => {
    vi.useFakeTimers();
    const key = "test-client-expiry";
    const config = { maxRequests: 1, windowMs: 5000 };

    const first = checkRateLimit(key, config);
    expect(first.success).toBe(true);

    const blocked = checkRateLimit(key, config);
    expect(blocked.success).toBe(false);

    // Advance time past the 5-second window
    vi.advanceTimersByTime(5100);

    const afterExpiry = checkRateLimit(key, config);
    expect(afterExpiry.success).toBe(true);
    expect(afterExpiry.remaining).toBe(0);
  });

  it("extracts client IP correctly from reverse proxy headers", () => {
    const reqWithForwarded = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
    });
    expect(getClientIp(reqWithForwarded)).toBe("203.0.113.195");

    const reqWithRealIp = new Request("http://localhost", {
      headers: { "x-real-ip": "198.51.100.14" },
    });
    expect(getClientIp(reqWithRealIp)).toBe("198.51.100.14");

    const reqFallback = new Request("http://localhost");
    expect(getClientIp(reqFallback)).toBe("127.0.0.1");
  });

  it("builds a standardized 429 response with RFC-compliant headers", async () => {
    const result = {
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 15000,
      retryAfterSeconds: 15,
    };

    const res = createRateLimitResponse(result);
    expect(res.status).toBe(429);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(res.headers.get("Retry-After")).toBe("15");

    const body = await res.json();
    expect(body.error).toBe("TOO_MANY_REQUESTS");
    expect(body.retryAfter).toBe(15);
  });

  it("handles distinct keys independently", () => {
    const config = { maxRequests: 1, windowMs: 1000 };

    expect(checkRateLimit("client-A", config).success).toBe(true);
    expect(checkRateLimit("client-A", config).success).toBe(false);

    // Client B should not be blocked by Client A
    expect(checkRateLimit("client-B", config).success).toBe(true);
  });
});
