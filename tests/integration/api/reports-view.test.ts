import { describe, it, expect, vi, beforeEach } from "vitest";
import ReportsPage from "@/app/reports/page";
import { auth } from "@/auth";
import { resolveActiveWorkspace } from "@/lib/auth/active-workspace";
import { getWorkspaceSpendReport } from "@/lib/reports/service";
import { redirect } from "next/navigation";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  usePathname: vi.fn(() => "/reports"),
}));

vi.mock("@/lib/auth/active-workspace", () => ({
  resolveActiveWorkspace: vi.fn(),
}));

vi.mock("@/lib/reports/service", () => ({
  getWorkspaceSpendReport: vi.fn(),
}));

describe("Reports Page (App Router)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated user to /login", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await ReportsPage();

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("loads spend reports for active workspace and renders successfully", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123", name: "Alice", email: "alice@example.com", workspaceId: "ws-1" },
    } as never);

    vi.mocked(resolveActiveWorkspace).mockResolvedValue({
      activeWorkspace: {
        id: "ws-1",
        name: "Acme Corp",
        slug: "acme-corp",
        type: "organization",
        defaultCurrency: "EUR",
        timezone: "UTC",
        role: "owner",
        joinedAt: new Date(),
      },
      userWorkspaces: [],
    });

    vi.mocked(getWorkspaceSpendReport).mockResolvedValue({
      totalAnnualRunRateMinor: 500000,
      totalMonthlyRunRateMinor: 41666,
      averageAssetCostMinor: 250000,
      totalResources: 4,
      payingResources: 2,
      currency: "EUR",
      categories: [
        { category: "hosting", count: 2, annualSpendMinor: 500000, percentage: 100 },
      ],
      cadences: [
        { billingCycle: "monthly", count: 2, annualSpendMinor: 500000, percentage: 100 },
      ],
      currencies: [
        { currency: "EUR", count: 2, rawTotalMinor: 500000, normalizedAnnualMinor: 500000, percentage: 100 },
      ],
      topCostDrivers: [
        {
          rank: 1,
          id: "res-1",
          name: "Dedicated Server",
          category: "hosting",
          type: "hosting",
          provider: "Hetzner",
          amountMinor: 25000,
          currency: "EUR",
          billingCycle: "monthly",
          annualNormalizedMinor: 300000,
          monthlyNormalizedMinor: 25000,
          shareOfTotalPct: 60.0,
        },
      ],
      monthlyForecast: [],
    });

    const jsx = await ReportsPage();

    expect(getWorkspaceSpendReport).toHaveBeenCalledWith(
      "user-123",
      "ws-1",
      "EUR"
    );

    expect(jsx).toBeDefined();
  });
});
