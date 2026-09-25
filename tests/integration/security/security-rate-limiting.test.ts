import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as nextAuthPostHandler } from "@/app/api/auth/[...nextauth]/route";
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

vi.mock("@/auth", () => ({
  handlers: {
    POST: vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })),
    GET: vi.fn(),
  },
}));

describe("Security Integration: Endpoint Rate Limiting & Abuse Prevention", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("blocks rapid-fire registration attempts after hitting the 5-request rate limit threshold", async () => {
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

    // Send 5 requests (AUTH limit is 5)
    for (let i = 0; i < 5; i++) {
      const res = await registerHandler(makeRequest());
      expect(res.status).toBe(201);
    }

    // 6th request MUST be rejected with HTTP 429
    const blockedRes = await registerHandler(makeRequest());
    expect(blockedRes.status).toBe(429);

    const body = await blockedRes.json();
    expect(body.error).toBe("TOO_MANY_REQUESTS");
    expect(blockedRes.headers.get("Retry-After")).toBeDefined();
    expect(blockedRes.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("blocks rapid-fire login attempts to prevent credential brute-force attacks", async () => {
    const ip = "198.51.100.42";

    const makeLoginRequest = () =>
      new NextRequest("http://localhost:3000/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": ip,
        },
        body: JSON.stringify({
          email: "victim@example.com",
          password: "WrongPassword!",
        }),
      });

    // 5 attempts allowed within the sliding window
    for (let i = 0; i < 5; i++) {
      const res = await nextAuthPostHandler(makeLoginRequest());
      expect(res.status).toBe(200);
    }

    // 6th login attempt MUST return HTTP 429
    const blockedLogin = await nextAuthPostHandler(makeLoginRequest());
    expect(blockedLogin.status).toBe(429);

    const body = await blockedLogin.json();
    expect(body.error).toBe("TOO_MANY_REQUESTS");
    expect(blockedLogin.headers.get("Retry-After")).toBeDefined();
  });
});
