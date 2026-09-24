import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/workspaces/[workspaceId]/resources/monitor/route";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/lib/monitors/service", () => ({
  runAutomatedMonitoringJob: vi.fn(),
}));

describe("POST /api/workspaces/[workspaceId]/resources/monitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if unauthenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as any);

    const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/resources/monitor", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 403 if user lacks required role", async () => {
    const { auth } = await import("@/auth");
    const { requireWorkspaceRole } = await import("@/lib/auth/workspace");

    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "user-1", email: "user@example.com" },
    } as any);

    vi.mocked(requireWorkspaceRole).mockRejectedValueOnce(new Error("FORBIDDEN"));

    const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/resources/monitor", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
    expect(res.status).toBe(403);
  });

  it("successfully triggers workspace monitoring sweep", async () => {
    const { auth } = await import("@/auth");
    const { requireWorkspaceRole } = await import("@/lib/auth/workspace");
    const { runAutomatedMonitoringJob } = await import("@/lib/monitors/service");

    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "user-1", email: "user@example.com" },
    } as any);

    vi.mocked(requireWorkspaceRole).mockResolvedValueOnce({
      workspace: { id: "ws-1", name: "Acme Corp" },
      role: "admin",
    } as any);

    vi.mocked(runAutomatedMonitoringJob).mockResolvedValueOnce({
      scannedCount: 5,
      healthyCount: 4,
      warningCount: 1,
      criticalCount: 0,
      errorCount: 0,
      alertsDispatched: 1,
      errors: [],
      durationMs: 420,
    });

    const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/resources/monitor", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.scannedCount).toBe(5);
    expect(json.data.healthyCount).toBe(4);
    expect(json.data.warningCount).toBe(1);
    expect(runAutomatedMonitoringJob).toHaveBeenCalledWith({ workspaceId: "ws-1" });
  });
});
