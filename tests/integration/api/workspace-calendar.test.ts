import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/workspaces/[workspaceId]/calendar.ics/route";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { generateCalendarToken } from "@/lib/calendar/token";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

describe("API: /api/workspaces/[workspaceId]/calendar.ics", () => {
  const workspaceId = "ws-test-cal-123";
  const context = {
    params: Promise.resolve({ workspaceId }),
  };

  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnValue([
      { id: workspaceId, name: "Production Workspace" },
    ]),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDb).mockReturnValue(mockDb as never);
  });

  it("returns 401 when neither session nor token is provided", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const req = new NextRequest(`http://localhost:3000/api/workspaces/${workspaceId}/calendar.ics`);
    const res = await GET(req, context);

    expect(res.status).toBe(401);
  });

  it("returns 401 when an invalid token is provided", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const req = new NextRequest(
      `http://localhost:3000/api/workspaces/${workspaceId}/calendar.ics?token=wrong-token`
    );
    const res = await GET(req, context);

    expect(res.status).toBe(401);
  });

  it("returns 200 with text/calendar content when a valid token is provided", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const validToken = generateCalendarToken(workspaceId);

    // Mock resource selection
    mockDb.orderBy.mockResolvedValueOnce([
      {
        id: "res-1",
        name: "vercel.com",
        type: "subscription",
        provider: "Vercel",
        category: "Hosting",
        websiteUrl: "https://vercel.com",
        amountMinor: 2000,
        currency: "USD",
        billingCycle: "monthly",
        renewalDate: new Date("2026-10-01T00:00:00Z"),
        autoRenew: true,
        description: null,
      },
    ]);

    const req = new NextRequest(
      `http://localhost:3000/api/workspaces/${workspaceId}/calendar.ics?token=${validToken}`
    );
    const res = await GET(req, context);
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/calendar");
    expect(text).toContain("BEGIN:VCALENDAR");
    expect(text).toContain("SUMMARY:vercel.com Renewal (20.00 USD)");
    expect(text).toContain("END:VCALENDAR");
  });
});
