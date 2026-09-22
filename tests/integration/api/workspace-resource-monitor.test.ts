import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/workspaces/[workspaceId]/resources/[resourceId]/monitor/route";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { getResourceById } from "@/lib/resources/service";
import {
  getMonitorForResource,
  getMonitorLogsForResource,
  probeAndSaveResource,
} from "@/lib/monitors/service";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/lib/resources/service", () => ({
  getResourceById: vi.fn(),
}));

vi.mock("@/lib/monitors/service", () => ({
  getMonitorForResource: vi.fn(),
  getMonitorLogsForResource: vi.fn(),
  probeAndSaveResource: vi.fn(),
}));

describe("API: /api/workspaces/[workspaceId]/resources/[resourceId]/monitor", () => {
  const context = {
    params: Promise.resolve({
      workspaceId: "ws-123",
      resourceId: "res-456",
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET Handler", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-123/resources/res-456/monitor");
      const res = await GET(req, context);
      expect(res.status).toBe(401);
    });

    it("returns 403 when user lacks viewer permission", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-123/resources/res-456/monitor");
      const res = await GET(req, context);
      expect(res.status).toBe(403);
    });

    it("returns 200 with monitor and logs", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);
      vi.mocked(getMonitorForResource).mockResolvedValue({
        id: "mon-1",
        workspaceId: "ws-123",
        resourceId: "res-456",
        hostname: "example.com",
        status: "healthy",
        tlsIssuer: "Let's Encrypt",
        tlsSubject: "example.com",
        tlsValidFrom: new Date(),
        tlsValidTo: new Date(),
        tlsDaysRemaining: 45,
        tlsProtocol: "TLSv1.3",
        dnsNameservers: ["ns1.example.com"],
        dnsIpv4: ["93.184.216.34"],
        latencyMs: 32,
        lastCheckedAt: new Date(),
        errorMessage: null,
        lastAlertStatus: null,
        lastAlertedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(getMonitorLogsForResource).mockResolvedValue([]);

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-123/resources/res-456/monitor");
      const res = await GET(req, context);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.monitor.hostname).toBe("example.com");
      expect(json.data.monitor.status).toBe("healthy");
    });
  });

  describe("POST Handler", () => {
    it("returns 404 when resource does not exist", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);
      vi.mocked(getResourceById).mockResolvedValue(null as never);

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-123/resources/res-456/monitor", {
        method: "POST",
      });
      const res = await POST(req, context);
      expect(res.status).toBe(404);
    });

    it("probes resource and returns 200 with updated monitor", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);
      vi.mocked(getResourceById).mockResolvedValue({
        id: "res-456",
        workspaceId: "ws-123",
        name: "My App",
        websiteUrl: "https://myapp.com",
        type: "domain",
      } as never);

      vi.mocked(probeAndSaveResource).mockResolvedValue({
        id: "mon-1",
        workspaceId: "ws-123",
        resourceId: "res-456",
        hostname: "myapp.com",
        status: "healthy",
        tlsIssuer: "Cloudflare",
        tlsSubject: "myapp.com",
        tlsValidFrom: new Date(),
        tlsValidTo: new Date(),
        tlsDaysRemaining: 80,
        tlsProtocol: "TLSv1.3",
        dnsNameservers: ["ns1.cloudflare.com"],
        dnsIpv4: ["104.21.5.1"],
        latencyMs: 25,
        lastCheckedAt: new Date(),
        errorMessage: null,
        lastAlertStatus: null,
        lastAlertedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(getMonitorLogsForResource).mockResolvedValue([
        {
          id: "log-1",
          monitorId: "mon-1",
          resourceId: "res-456",
          workspaceId: "ws-123",
          status: "healthy",
          latencyMs: 25,
          tlsDaysRemaining: 80,
          message: "Checked myapp.com (healthy)",
          checkedAt: new Date(),
        },
      ]);

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-123/resources/res-456/monitor", {
        method: "POST",
      });
      const res = await POST(req, context);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.monitor.hostname).toBe("myapp.com");
      expect(json.data.logs).toHaveLength(1);
    });
  });
});
