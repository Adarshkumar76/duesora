import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/workspaces/[workspaceId]/dashboard/route";
import { auth } from "@/auth";
import { getWorkspaceDashboardData } from "@/lib/dashboard/service";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/dashboard/service", () => ({
  getWorkspaceDashboardData: vi.fn(),
}));

describe("API: /api/workspaces/[workspaceId]/dashboard Route Authorization", () => {
  const context = {
    params: Promise.resolve({ workspaceId: "ws-test-456" }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 UNAUTHORIZED when no session exists", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-456/dashboard");
    const response = await GET(request, context);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(getWorkspaceDashboardData).not.toHaveBeenCalled();
  });

  it("returns 403 FORBIDDEN when user does not have permission in target workspace", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-unauthorized" },
    } as never);

    vi.mocked(getWorkspaceDashboardData).mockRejectedValue(new Error("FORBIDDEN"));

    const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-456/dashboard");
    const response = await GET(request, context);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("returns 200 OK with dashboard metrics when authorized", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-authorized" },
    } as never);

    const mockDashboardData = {
      workspace: { id: "ws-test-456", name: "Duesora Workspace", currency: "USD" },
      kpis: {
        totalResources: 32,
        renewalsDue: 12,
        totalSpend: 1248.75,
        expiringSoon: 5,
      },
      renewalsOverview: [
        { month: "Jan", actual: 35, projected: 22 },
        { month: "Feb", actual: 50, projected: 38 },
      ],
      topCategories: [
        { name: "Domains", count: 14, percentage: 45, color: "#10B981" },
      ],
      recentActivity: [
        {
          id: "act-1",
          name: "duesora.com",
          category: "Domains",
          renewalDate: "Aug 11, 2022",
          amount: 1248.75,
          status: "active" as const,
        },
      ],
    };

    vi.mocked(getWorkspaceDashboardData).mockResolvedValue(mockDashboardData as never);

    const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-456/dashboard");
    const response = await GET(request, context);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual(mockDashboardData);
    expect(getWorkspaceDashboardData).toHaveBeenCalledWith("user-authorized", "ws-test-456");
  });
});
