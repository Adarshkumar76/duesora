/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { compileWorkspaceDigest, dispatchWorkspaceDigest } from "@/lib/reports/digest";
import { getDb } from "@/db";
import { getWorkspaceSeatOptimizationReport } from "@/lib/resources/seats";
import { createNotification } from "@/lib/notifications/repository";
import { emitWorkspaceWebhook } from "@/lib/webhooks/dispatcher";

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

vi.mock("@/lib/resources/seats", () => ({
  getWorkspaceSeatOptimizationReport: vi.fn(),
}));

vi.mock("@/lib/notifications/repository", () => ({
  createNotification: vi.fn(),
}));

vi.mock("@/lib/webhooks/dispatcher", () => ({
  emitWorkspaceWebhook: vi.fn(),
}));

describe("Executive Renewal & Cost Digest Engine", () => {
  const mockNow = new Date("2026-06-01T00:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("compiles a 30-day forecast separating urgent (<=7 days) from upcoming renewals", async () => {
    vi.mocked(getDb).mockReturnValue({
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockResolvedValue([{ id: "ws-1", name: "Acme Corp", currency: "USD" }]),
          })),
        })),
      })),
    } as any);

    // Mock second select query for resources
    const mockDb = {
      select: vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: "ws-1", name: "Acme Corp", defaultCurrency: "USD" }]),
          }),
        }),
      }).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: "res-urgent",
              name: "Urgent Domain",
              type: "domain",
              provider: "GoDaddy",
              renewalDate: new Date("2026-06-04T00:00:00Z"), // 3 days away
              amountMinor: 1500,
              currency: "USD",
              status: "active",
            },
            {
              id: "res-later",
              name: "Later SaaS",
              type: "subscription",
              provider: "GitHub",
              renewalDate: new Date("2026-06-20T00:00:00Z"), // 19 days away
              amountMinor: 4000,
              currency: "USD",
              status: "active",
            },
          ]),
        }),
      }),
    };

    vi.mocked(getDb).mockReturnValue(mockDb as any);

    vi.mocked(getWorkspaceSeatOptimizationReport).mockResolvedValue({
      totalTrackedSubscriptions: 1,
      totalSeatsPurchased: 50,
      totalSeatsAssigned: 30,
      totalIdleSeats: 20,
      overallUtilizationRate: 60,
      totalAnnualWastedSpend: 240,
      currency: "USD",
      topWastefulSubscriptions: [],
      allTrackedResources: [
        {
          resourceId: "res-seats",
          resourceName: "Slack Enterprise",
          status: "warning",
          recommendation: "Downgrade seats",
          suggestedSeatDowngrade: 20,
          potentialAnnualSavings: 240,
        } as any,
      ],
    });

    const digest = await compileWorkspaceDigest("ws-1", mockNow);

    expect(digest.workspaceName).toBe("Acme Corp");
    expect(digest.itemsDue7Days).toHaveLength(1);
    expect(digest.itemsDue7Days[0].name).toBe("Urgent Domain");
    expect(digest.itemsDue7Days[0].daysRemaining).toBe(3);

    expect(digest.itemsDue30Days).toHaveLength(1);
    expect(digest.itemsDue30Days[0].name).toBe("Later SaaS");
    expect(digest.itemsDue30Days[0].daysRemaining).toBe(19);

    expect(digest.totalDue7DaysMinor).toBe(1500);
    expect(digest.totalDue30DaysMinor).toBe(5500);
    expect(digest.seatOptimization.overprovisionedServicesCount).toBe(1);

    expect(digest.markdown).toContain("Urgent Renewals");
    expect(digest.markdown).toContain("Urgent Domain");
    expect(digest.markdown).toContain("Slack Enterprise");
  });

  it("dispatches in-app notification and webhooks on digest delivery", async () => {
    vi.mocked(createNotification).mockResolvedValue({ id: "notif-1" } as any);
    vi.mocked(emitWorkspaceWebhook).mockResolvedValue(true as any);

    const mockDigest = {
      workspaceId: "ws-1",
      workspaceName: "Acme Corp",
      generatedAt: new Date().toISOString(),
      currency: "USD",
      summary: "2 renewals due",
      totalDue30DaysMinor: 5500,
      totalDue7DaysMinor: 1500,
      itemsDue7Days: [{ id: "res-1" }] as any,
      itemsDue30Days: [],
      seatOptimization: { totalWasteAnnualFormatted: "$0.00", overprovisionedServicesCount: 0 },
      markdown: "digest md",
      html: "<p>digest html</p>",
    };

    const result = await dispatchWorkspaceDigest(mockDigest);

    expect(createNotification).toHaveBeenCalled();
    expect(emitWorkspaceWebhook).toHaveBeenCalledWith("ws-1", "workspace.digest", expect.anything());
    expect(result.webhookDispatched).toBe(true);
    expect(result.inAppNotificationId).toBe("notif-1");
  });
});
