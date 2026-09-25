import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { resetRateLimits } from "@/lib/security/rate-limiter";

vi.mock("@/db", () => ({
  getDb: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([]),
        })),
      })),
    })),
    transaction: vi.fn().mockResolvedValue({
      user: { id: "u-1", email: "new@example.com", name: "New User" },
      workspace: { id: "ws-1", name: "New Workspace" },
    }),
  })),
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed-pw-123"),
}));

describe("Security Integration: Endpoint Rate Limiting & Abuse Prevention", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("blocks rapid-fire registration attempts after hitting the rate limit threshold", async () => {
    const ip = "192.0.2.100";

    const makeRequest = () =>
      new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": ip,
        },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          password: "SecurePassword123!",
          confirmPassword: "SecurePassword123!",
          acceptedTerms: true,
        }),
      });

    // Send 10 requests (AUTH limit is 10)
    for (let i = 0; i < 10; i++) {
      const res = await registerHandler(makeRequest());
      expect(res.status).toBe(201);
    }

    // 11th request MUST be rejected with HTTP 429
    const blockedRes = await registerHandler(makeRequest());
    expect(blockedRes.status).toBe(429);

    const body = await blockedRes.json();
    expect(body.error).toBe("TOO_MANY_REQUESTS");
    expect(blockedRes.headers.get("Retry-After")).toBeDefined();
    expect(blockedRes.headers.get("X-RateLimit-Remaining")).toBe("0");
  });
});
