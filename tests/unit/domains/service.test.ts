import { beforeEach, describe, expect, it, vi } from "vitest";
import { listWorkspaceDomains } from "@/lib/domains/service";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { getDb } from "@/db";

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

describe("Domains Service: listWorkspaceDomains", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enforces viewer role on active workspace", async () => {
    vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

    await expect(
      listWorkspaceDomains("user-1", "ws-100")
    ).rejects.toThrow("FORBIDDEN");

    expect(requireWorkspaceRole).toHaveBeenCalledWith("user-1", "ws-100", "viewer");
  });

  it("returns paginated domain items and correctly aggregates metrics", async () => {
    vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

    const now = new Date();
    const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const fortyDaysFromNow = new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000);

    const mockRows = [
      {
        id: "res-1",
        workspaceId: "ws-100",
        name: "duesora.com",
        type: "domain",
        status: "active",
        category: "infrastructure",
        provider: "Cloudflare",
        websiteUrl: "https://duesora.com",
        amountMinor: 1200,
        currency: "USD",
        billingCycle: "yearly",
        renewalDate: tenDaysFromNow,
        autoRenew: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerName: "Alice",
        ownerEmail: "alice@example.com",
        monitorId: "mon-1",
        monitorHostname: "duesora.com",
        monitorStatus: "healthy",
        tlsIssuer: "Let's Encrypt",
        tlsSubject: "duesora.com",
        tlsValidFrom: now,
        tlsValidTo: fortyDaysFromNow,
        tlsDaysRemaining: 40,
        tlsProtocol: "TLSv1.3",
        dnsNameservers: '["ns1.cloudflare.com"]',
        dnsIpv4: '["104.21.5.1"]',
        latencyMs: 32,
        lastCheckedAt: now,
        errorMessage: null,
      },
      {
        id: "res-2",
        workspaceId: "ws-100",
        name: "api.duesora.com wildcard",
        type: "ssl_certificate",
        status: "active",
        category: "security",
        provider: "DigiCert",
        websiteUrl: null,
        amountMinor: 25000,
        currency: "USD",
        billingCycle: "yearly",
        renewalDate: fortyDaysFromNow,
        autoRenew: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerName: null,
        ownerEmail: null,
        monitorId: "mon-2",
        monitorHostname: "api.duesora.com",
        monitorStatus: "critical",
        tlsIssuer: "DigiCert",
        tlsSubject: "api.duesora.com",
        tlsValidFrom: now,
        tlsValidTo: tenDaysFromNow,
        tlsDaysRemaining: 5,
        tlsProtocol: "TLSv1.2",
        dnsNameservers: null,
        dnsIpv4: null,
        latencyMs: 120,
        lastCheckedAt: now,
        errorMessage: "Certificate expiring in 5 days",
      },
    ];

    const mockCountResult = [{ count: 2 }];
    const mockAllWorkspaceDomains = [
      {
        type: "domain",
        renewalDate: tenDaysFromNow,
        monitorStatus: "healthy",
        tlsDaysRemaining: 40,
      },
      {
        type: "ssl_certificate",
        renewalDate: fortyDaysFromNow,
        monitorStatus: "critical",
        tlsDaysRemaining: 5,
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
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockCountResult),
    };

    // Chain 3: allWorkspaceDomains for metrics calculation
    const select3Chain = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockAllWorkspaceDomains),
    };

    mockDb.select
      .mockReturnValueOnce(select1Chain)
      .mockReturnValueOnce(select2Chain)
      .mockReturnValueOnce(select3Chain);

    vi.mocked(getDb).mockReturnValue(mockDb as never);

    const result = await listWorkspaceDomains("user-1", "ws-100", {
      page: 1,
      pageSize: 10,
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe("duesora.com");
    expect(result.items[0].type).toBe("domain");
    expect(result.items[0].monitor?.status).toBe("healthy");
    expect(result.items[0].monitor?.latencyMs).toBe(32);

    expect(result.items[1].name).toBe("api.duesora.com wildcard");
    expect(result.items[1].type).toBe("ssl_certificate");
    expect(result.items[1].monitor?.status).toBe("critical");
    expect(result.items[1].monitor?.tlsDaysRemaining).toBe(5);

    // Verify metrics aggregation
    expect(result.metrics.totalDomains).toBe(1);
    expect(result.metrics.totalCertificates).toBe(1);
    expect(result.metrics.healthyMonitors).toBe(1);
    expect(result.metrics.failingMonitors).toBe(1);
    expect(result.metrics.expiringSoon).toBe(2); // duesora.com has renewalDate in 10d; api cert has tlsDaysRemaining=5

    expect(result.pagination).toEqual({
      page: 1,
      pageSize: 10,
      total: 2,
      totalPages: 1,
    });
  });
});
