import { describe, it, expect, vi, beforeEach } from "vitest";
import RenewalsPage from "@/app/renewals/page";
import { auth } from "@/auth";
import { resolveActiveWorkspace } from "@/lib/auth/active-workspace";
import { listWorkspaceRenewals } from "@/lib/renewals/service";
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
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => "/renewals"),
}));

vi.mock("@/lib/auth/active-workspace", () => ({
  resolveActiveWorkspace: vi.fn(),
}));

vi.mock("@/lib/renewals/service", () => ({
  listWorkspaceRenewals: vi.fn(),
}));

describe("Renewals Page (App Router)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated user to /login", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await RenewalsPage({ searchParams: Promise.resolve({}) });

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("loads renewals pipeline for active workspace and renders successfully", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123", name: "Alice", email: "alice@example.com", workspaceId: "ws-1" },
    } as never);

    vi.mocked(resolveActiveWorkspace).mockResolvedValue({
      activeWorkspace: {
        id: "ws-1",
        name: "Acme Corp",
        slug: "acme-corp",
        type: "organization",
        defaultCurrency: "USD",
        timezone: "UTC",
        role: "owner",
        joinedAt: new Date(),
      },
      userWorkspaces: [],
    });

    vi.mocked(listWorkspaceRenewals).mockResolvedValue({
      items: [
        {
          id: "res-1",
          workspaceId: "ws-1",
          name: "AWS Enterprise Support",
          type: "cloud_service",
          status: "active",
          category: "cloud",
          provider: "Amazon Web Services",
          websiteUrl: "https://aws.amazon.com",
          amountMinor: 150000,
          currency: "USD",
          billingCycle: "monthly",
          renewalDate: new Date(),
          autoRenew: true,
          diffDays: 4,
          urgencyBucket: "critical",
          normalizedCostMinor: 150000,
          ownerName: "Alice",
          ownerEmail: "alice@example.com",
          renewalDecision: "none",
          decisionNotes: null,
          cancellationNoticeDays: null,
          cancellationDeadline: null,
          decidedByUserId: null,
          decidedByName: null,
          decidedAt: null,
          noticeDaysRemaining: null,
        },
      ],
      metrics: {
        overdueCount: 0,
        overdueCostMinor: 0,
        next7DaysCount: 1,
        next7DaysCostMinor: 150000,
        next30DaysCount: 1,
        next30DaysCostMinor: 150000,
        next90DaysCount: 1,
        next90DaysCostMinor: 150000,
        currency: "USD",
        needsReviewCount: 0,
        approvedCount: 0,
        cancelCount: 0,
        projectedSavingsMinor: 0,
        negotiateCount: 0,
      },
    });

    const jsx = await RenewalsPage({
      searchParams: Promise.resolve({
        bucket: "critical",
        search: "AWS",
      }),
    });

    expect(listWorkspaceRenewals).toHaveBeenCalledWith(
      "user-123",
      "ws-1",
      "USD",
      expect.objectContaining({
        bucket: "critical",
        search: "AWS",
      })
    );

    expect(jsx).toBeDefined();
  });
});
