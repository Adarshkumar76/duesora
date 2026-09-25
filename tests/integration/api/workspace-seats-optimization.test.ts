import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/workspaces/[workspaceId]/seats/optimization/route";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { getWorkspaceSeatOptimizationReport } from "@/lib/resources/seats";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/lib/resources/seats", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/resources/seats")>();
  return {
    ...original,
    getWorkspaceSeatOptimizationReport: vi.fn(),
  };
});

describe("API: /api/workspaces/[workspaceId]/seats/optimization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const request = new NextRequest("http://localhost/api/workspaces/ws-1/seats/optimization");
    const response = await GET(request, { params: Promise.resolve({ workspaceId: "ws-1" }) });

    expect(response.status).toBe(401);
  });

  it("returns 403 when user is not a member of the workspace", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never);

    vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

    const request = new NextRequest("http://localhost/api/workspaces/ws-1/seats/optimization");
    const response = await GET(request, { params: Promise.resolve({ workspaceId: "ws-1" }) });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("returns 200 with workspace seat report and waste opportunities", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never);

    vi.mocked(requireWorkspaceRole).mockResolvedValue(undefined as never);

    const mockReport = {
      totalTrackedSubscriptions: 1,
      totalSeatsPurchased: 50,
      totalSeatsAssigned: 30,
      totalIdleSeats: 20,
      overallUtilizationRate: 60,
      totalAnnualWastedSpend: 3600,
      currency: "USD",
      topWastefulSubscriptions: [],
      allTrackedResources: [],
    };

    vi.mocked(getWorkspaceSeatOptimizationReport).mockResolvedValue(mockReport as never);

    const request = new NextRequest("http://localhost/api/workspaces/ws-1/seats/optimization");
    const response = await GET(request, { params: Promise.resolve({ workspaceId: "ws-1" }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.totalSeatsPurchased).toBe(50);
    expect(json.data.totalIdleSeats).toBe(20);
    expect(json.data.overallUtilizationRate).toBe(60);
    expect(json.data.totalAnnualWastedSpend).toBe(3600);
  });
});
