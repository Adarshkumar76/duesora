import { describe, it, expect, vi, beforeEach } from "vitest";
import DomainsPage from "@/app/domains/page";
import { auth } from "@/auth";
import { resolveActiveWorkspace } from "@/lib/auth/active-workspace";
import { listWorkspaceDomains } from "@/lib/domains/service";
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
  usePathname: vi.fn(() => "/domains"),
}));

vi.mock("@/lib/auth/active-workspace", () => ({
  resolveActiveWorkspace: vi.fn(),
}));

vi.mock("@/lib/domains/service", () => ({
  listWorkspaceDomains: vi.fn(),
}));

describe("Domains Page (App Router)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated user to /login", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await DomainsPage({ searchParams: Promise.resolve({}) });

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("loads domain resources for active workspace and renders successfully", async () => {
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

    vi.mocked(listWorkspaceDomains).mockResolvedValue({
      items: [
        {
          id: "res-1",
          workspaceId: "ws-1",
          name: "example.org",
          type: "domain",
          status: "active",
          category: "web",
          provider: "Namecheap",
          websiteUrl: "https://example.org",
          amountMinor: 1400,
          currency: "USD",
          billingCycle: "yearly",
          renewalDate: new Date(),
          autoRenew: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerName: "Alice",
          ownerEmail: "alice@example.com",
          monitor: {
            id: "mon-1",
            hostname: "example.org",
            status: "healthy",
            tlsIssuer: "Let's Encrypt",
            tlsSubject: "example.org",
            tlsValidFrom: new Date(),
            tlsValidTo: new Date(),
            tlsDaysRemaining: 75,
            tlsProtocol: "TLSv1.3",
            dnsNameservers: "ns1.example.org",
            dnsIpv4: "93.184.216.34",
            latencyMs: 25,
            lastCheckedAt: new Date(),
            errorMessage: null,
          },
        },
      ],
      metrics: {
        totalDomains: 1,
        totalCertificates: 0,
        healthyMonitors: 1,
        expiringSoon: 0,
        failingMonitors: 0,
      },
      pagination: {
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
    });

    const jsx = await DomainsPage({
      searchParams: Promise.resolve({
        search: "example",
        health: "healthy",
        type: "domain",
      }),
    });

    expect(listWorkspaceDomains).toHaveBeenCalledWith(
      "user-123",
      "ws-1",
      expect.objectContaining({
        search: "example",
        health: "healthy",
        type: "domain",
        page: 1,
        pageSize: 20,
      })
    );

    expect(jsx).toBeDefined();
  });
});
