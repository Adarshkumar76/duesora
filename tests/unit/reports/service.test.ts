import { beforeEach, describe, expect, it, vi } from "vitest";
import { getWorkspaceSpendReport } from "@/lib/reports/service";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { getDb } from "@/db";

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

describe("Reports Service: getWorkspaceSpendReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enforces viewer role on active workspace", async () => {
    vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

    await expect(
      getWorkspaceSpendReport("user-1", "ws-100", "USD")
    ).rejects.toThrow("FORBIDDEN");

    expect(requireWorkspaceRole).toHaveBeenCalledWith("user-1", "ws-100", "viewer");
  });

  it("calculates ARR, MRR, category breakdowns, and top cost drivers", async () => {
    vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

    const mockResources = [
      {
        id: "res-1",
        name: "Google Workspace",
        type: "subscription",
        status: "active",
        category: "software",
        provider: "Google",
        amountMinor: 600, // $6.00 / month -> $72/yr
        currency: "USD",
        billingCycle: "monthly",
      },
      {
        id: "res-2",
        name: "AWS Cloud Services",
        type: "cloud_service",
        status: "active",
        category: "cloud",
        provider: "Amazon Web Services",
        amountMinor: 120000, // $1200.00 / year ($100/mo)
        currency: "USD",
        billingCycle: "yearly",
      },
      {
        id: "res-3",
        name: "Free Developer Tier",
        type: "software_license",
        status: "active",
        category: "software",
        provider: "Acme",
        amountMinor: 0,
        currency: "USD",
        billingCycle: "yearly",
      },
    ];

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockResources),
        }),
      }),
    };

    vi.mocked(getDb).mockReturnValue(mockDb as never);

    const report = await getWorkspaceSpendReport("user-1", "ws-100", "USD");

    // ARR:
    // res-1: $6 * 12 = $72 (7200 cents)
    // res-2: $1200 (120000 cents)
    // Total ARR: 7200 + 120000 = 127200 ($1,272.00)
    expect(report.totalAnnualRunRateMinor).toBe(127200);

    // MRR:
    // res-1: $6 (600 cents)
    // res-2: $100 (10000 cents)
    // Total MRR: 10600 ($106.00)
    expect(report.totalMonthlyRunRateMinor).toBe(10600);

    expect(report.totalResources).toBe(3);
    expect(report.payingResources).toBe(2);

    // Average cost per paid asset: 127200 / 2 = 63600 ($636.00)
    expect(report.averageAssetCostMinor).toBe(63600);

    // Categories: "cloud" ($1200) and "software" ($72)
    expect(report.categories).toHaveLength(2);
    expect(report.categories[0].category).toBe("cloud");
    expect(report.categories[0].annualSpendMinor).toBe(120000);
    expect(report.categories[1].category).toBe("software");
    expect(report.categories[1].annualSpendMinor).toBe(7200);

    // Cadences: "yearly" ($1200) and "monthly" ($72)
    expect(report.cadences).toHaveLength(2);

    // Top cost drivers:
    expect(report.topCostDrivers).toHaveLength(2);
    expect(report.topCostDrivers[0].name).toBe("AWS Cloud Services");
    expect(report.topCostDrivers[0].annualNormalizedMinor).toBe(120000);
    expect(report.topCostDrivers[0].rank).toBe(1);

    expect(report.topCostDrivers[1].name).toBe("Google Workspace");
    expect(report.topCostDrivers[1].rank).toBe(2);
  });
});
