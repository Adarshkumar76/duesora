/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as cronDigestHandler } from "@/app/api/cron/digest/route";
import { verifyCronAuthorization } from "@/lib/cron/auth";
import { compileWorkspaceDigest, dispatchWorkspaceDigest } from "@/lib/reports/digest";
import { getDb } from "@/db";

vi.mock("@/lib/cron/auth", () => ({
  verifyCronAuthorization: vi.fn(),
}));

vi.mock("@/lib/reports/digest", () => ({
  compileWorkspaceDigest: vi.fn(),
  dispatchWorkspaceDigest: vi.fn(),
}));

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

describe("Cron API: /api/cron/digest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when cron authorization fails", async () => {
    vi.mocked(verifyCronAuthorization).mockResolvedValue({
      authorized: false,
      reason: "Missing Bearer token",
      source: "dev_mode",
    });

    const req = new NextRequest("http://localhost:3000/api/cron/digest");
    const res = await cronDigestHandler(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("processes workspace digests when authorized", async () => {
    vi.mocked(verifyCronAuthorization).mockResolvedValue({
      authorized: true,
      source: "cron_secret",
    });
    vi.mocked(getDb).mockReturnValue({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockResolvedValue([
          { id: "ws-1", name: "Workspace One" },
          { id: "ws-2", name: "Workspace Two" },
        ]),
      }),
    } as any);

    vi.mocked(compileWorkspaceDigest).mockResolvedValue({
      workspaceId: "ws-1",
      workspaceName: "Workspace One",
      itemsDue7Days: [{ id: "res-1" }] as any,
      itemsDue30Days: [],
      totalDue30DaysMinor: 1200,
    } as any);

    vi.mocked(dispatchWorkspaceDigest).mockResolvedValue({
      inAppNotificationId: "notif-1",
      webhookDispatched: true,
    });

    const req = new NextRequest("http://localhost:3000/api/cron/digest");
    const res = await cronDigestHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.processedCount).toBe(2);
    expect(compileWorkspaceDigest).toHaveBeenCalledTimes(2);
    expect(dispatchWorkspaceDigest).toHaveBeenCalledTimes(2);
  });
});
