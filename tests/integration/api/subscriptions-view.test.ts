import { describe, it, expect, vi, beforeEach } from "vitest";
import SubscriptionsPage from "@/app/subscriptions/page";
import { auth } from "@/auth";
import { resolveActiveWorkspace } from "@/lib/auth/active-workspace";
import { listWorkspaceSubscriptions } from "@/lib/subscriptions/service";
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
  usePathname: vi.fn(() => "/subscriptions"),
}));

vi.mock("@/lib/auth/active-workspace", () => ({
  resolveActiveWorkspace: vi.fn(),
}));

vi.mock("@/lib/subscriptions/service", () => ({
  listWorkspaceSubscriptions: vi.fn(),
}));

describe("Subscriptions Page (App Router)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated user to /login", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await SubscriptionsPage({ searchParams: Promise.resolve({}) });

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("loads subscriptions for active workspace and renders successfully", async () => {
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

    vi.mocked(listWorkspaceSubscriptions).mockResolvedValue({
      items: [
        {
          id: "sub-1",
          workspaceId: "ws-1",
          name: "Vercel Pro",
          type: "cloud_service",
          status: "active",
          category: "hosting",
          provider: "Vercel",
          websiteUrl: "https://vercel.com",
          amountMinor: 2000,
          currency: "USD",
          billingCycle: "monthly",
          renewalDate: new Date(),
          autoRenew: true,
          monthlyNormalizedMinor: 1850,
          yearlyNormalizedMinor: 22200,
          ownerName: "Alice",
          ownerEmail: "alice@example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      metrics: {
        monthlyBurnRateMinor: 1850,
        annualProjectedMinor: 22200,
        totalActiveSubscriptions: 1,
        topVendor: {
          name: "Vercel",
          annualCostMinor: 22200,
        },
        currency: "EUR",
      },
      pagination: {
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
    });

    const jsx = await SubscriptionsPage({
      searchParams: Promise.resolve({
        search: "Vercel",
        cycle: "monthly",
        type: "cloud_service",
      }),
    });

    expect(listWorkspaceSubscriptions).toHaveBeenCalledWith(
      "user-123",
      "ws-1",
      "EUR",
      expect.objectContaining({
        search: "Vercel",
        billingCycle: "monthly",
        type: "cloud_service",
        page: 1,
        pageSize: 20,
      })
    );

    expect(jsx).toBeDefined();
  });
});
