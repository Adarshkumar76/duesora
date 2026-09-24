import { beforeEach, describe, expect, it, vi } from "vitest";
import { listWorkspaceSubscriptions } from "@/lib/subscriptions/service";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { getDb } from "@/db";

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

describe("Subscriptions Service: listWorkspaceSubscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enforces viewer role on active workspace", async () => {
    vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

    await expect(
      listWorkspaceSubscriptions("user-1", "ws-100", "USD")
    ).rejects.toThrow("FORBIDDEN");

    expect(requireWorkspaceRole).toHaveBeenCalledWith("user-1", "ws-100", "viewer");
  });

  it("calculates monthly run-rate and annual projection with normalized costs", async () => {
    vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

    const now = new Date();

    const mockRows = [
      {
        id: "sub-1",
        workspaceId: "ws-100",
        name: "GitHub Copilot",
        type: "subscription",
        status: "active",
        category: "developer_tools",
        provider: "GitHub",
        websiteUrl: "https://github.com",
        amountMinor: 2000, // $20.00 / month
        currency: "USD",
        billingCycle: "monthly",
        renewalDate: now,
        autoRenew: true,
        createdAt: now,
        updatedAt: now,
        ownerName: "Alice",
        ownerEmail: "alice@example.com",
      },
      {
        id: "sub-2",
        workspaceId: "ws-100",
        name: "JetBrains All Products Pack",
        type: "software_license",
        status: "active",
        category: "developer_tools",
        provider: "JetBrains",
        websiteUrl: "https://jetbrains.com",
        amountMinor: 30000, // $300.00 / year ($25/mo)
        currency: "USD",
        billingCycle: "yearly",
        renewalDate: now,
        autoRenew: true,
        createdAt: now,
        updatedAt: now,
        ownerName: "Bob",
        ownerEmail: "bob@example.com",
      },
    ];

    const mockCountResult = [{ count: 2 }];
    const mockAllSubscriptions = [
      {
        name: "GitHub Copilot",
        provider: "GitHub",
        amountMinor: 2000, // $20/mo
        currency: "USD",
        billingCycle: "monthly",
        status: "active",
      },
      {
        name: "JetBrains All Products Pack",
        provider: "JetBrains",
        amountMinor: 30000, // $300/yr
        currency: "USD",
        billingCycle: "yearly",
        status: "active",
      },
    ];

    const mockDb = {
      select: vi.fn(),
    };

    // Chain 1: rawRows query
    const select1Chain = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockResolvedValue(mockRows),
    };

    // Chain 2: total count query
    const select2Chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockCountResult),
    };

    // Chain 3: allWorkspaceSubscriptions query
    const select3Chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockAllSubscriptions),
    };

    mockDb.select
      .mockReturnValueOnce(select1Chain)
      .mockReturnValueOnce(select2Chain)
      .mockReturnValueOnce(select3Chain);

    vi.mocked(getDb).mockReturnValue(mockDb as never);

    const result = await listWorkspaceSubscriptions("user-1", "ws-100", "USD", {
      page: 1,
      pageSize: 10,
    });

    expect(result.items).toHaveLength(2);

    // sub-1: $20/mo
    expect(result.items[0].name).toBe("GitHub Copilot");
    expect(result.items[0].monthlyNormalizedMinor).toBe(2000);
    expect(result.items[0].yearlyNormalizedMinor).toBe(24000);

    // sub-2: $300/yr -> $25/mo
    expect(result.items[1].name).toBe("JetBrains All Products Pack");
    expect(result.items[1].monthlyNormalizedMinor).toBe(2500);
    expect(result.items[1].yearlyNormalizedMinor).toBe(30000);

    // Metrics:
    // monthly: 2000 + 2500 = 4500 ($45.00)
    // yearly: 24000 + 30000 = 54000 ($540.00)
    expect(result.metrics.monthlyBurnRateMinor).toBe(4500);
    expect(result.metrics.annualProjectedMinor).toBe(54000);
    expect(result.metrics.totalActiveSubscriptions).toBe(2);
    expect(result.metrics.topVendor).toEqual({
      name: "JetBrains",
      annualCostMinor: 30000,
    });
  });
});
