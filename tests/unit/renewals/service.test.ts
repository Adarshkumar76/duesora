import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateNextRenewalDate,
  determineUrgencyBucket,
  renewWorkspaceResource,
  listWorkspaceRenewals,
} from "@/lib/renewals/service";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { getDb } from "@/db";

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

vi.mock("@/lib/webhooks/dispatcher", () => ({
  emitWorkspaceWebhook: vi.fn().mockResolvedValue(undefined),
}));

describe("Renewals Service: Helper Functions", () => {
  it("determines correct urgency buckets based on day differences", () => {
    expect(determineUrgencyBucket(-5)).toBe("overdue");
    expect(determineUrgencyBucket(0)).toBe("critical");
    expect(determineUrgencyBucket(4)).toBe("critical");
    expect(determineUrgencyBucket(7)).toBe("critical");
    expect(determineUrgencyBucket(8)).toBe("upcoming");
    expect(determineUrgencyBucket(30)).toBe("upcoming");
    expect(determineUrgencyBucket(45)).toBe("medium");
    expect(determineUrgencyBucket(90)).toBe("medium");
    expect(determineUrgencyBucket(120)).toBe("later");
  });

  it("calculates next renewal date for monthly cycle", () => {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const next = calculateNextRenewalDate(futureDate, "monthly");

    expect(next.getTime()).toBeGreaterThan(futureDate.getTime());
    // Should be approximately ~30 days later
    const diffDays = Math.round((next.getTime() - futureDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(28);
    expect(diffDays).toBeLessThanOrEqual(31);
  });

  it("calculates next renewal date for yearly cycle and rolls forward past now", () => {
    // Old past date (e.g. 2 years ago)
    const pastDate = new Date(Date.now() - 700 * 24 * 60 * 60 * 1000);
    const next = calculateNextRenewalDate(pastDate, "yearly");

    expect(next.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("Renewals Service: renewWorkspaceResource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enforces member role on active workspace", async () => {
    vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

    await expect(
      renewWorkspaceResource("user-1", "ws-1", "res-1")
    ).rejects.toThrow("FORBIDDEN");

    expect(requireWorkspaceRole).toHaveBeenCalledWith("user-1", "ws-1", "member");
  });

  it("updates resource renewalDate to next cycle and sets status active", async () => {
    vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

    const now = new Date();
    const existingResource = {
      id: "res-1",
      workspaceId: "ws-1",
      name: "Acme SaaS",
      billingCycle: "monthly",
      renewalDate: now,
      status: "active",
    };

    const nextDate = calculateNextRenewalDate(now, "monthly");
    const updatedResource = {
      ...existingResource,
      renewalDate: nextDate,
      status: "active",
    };

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existingResource]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedResource]),
          }),
        }),
      }),
    };

    vi.mocked(getDb).mockReturnValue(mockDb as never);

    const result = await renewWorkspaceResource("user-1", "ws-1", "res-1");

    expect(result.id).toBe("res-1");
    expect(result.renewalDate!.getTime()).toBe(nextDate.getTime());
  });
});
