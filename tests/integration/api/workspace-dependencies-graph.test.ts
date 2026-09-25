import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/workspaces/[workspaceId]/dependencies/route";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { getWorkspaceDependencyGraph } from "@/lib/resources/dependencies";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/lib/resources/dependencies", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/resources/dependencies")>();
  return {
    ...original,
    getWorkspaceDependencyGraph: vi.fn(),
  };
});

describe("API: /api/workspaces/[workspaceId]/dependencies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const request = new NextRequest("http://localhost/api/workspaces/ws-1/dependencies");
    const response = await GET(request, { params: Promise.resolve({ workspaceId: "ws-1" }) });

    expect(response.status).toBe(401);
  });

  it("returns 403 when user is not a member of the workspace", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never);

    vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

    const request = new NextRequest("http://localhost/api/workspaces/ws-1/dependencies");
    const response = await GET(request, { params: Promise.resolve({ workspaceId: "ws-1" }) });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("returns 200 with graph nodes, edges, and blast radius stats", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never);

    vi.mocked(requireWorkspaceRole).mockResolvedValue(undefined as never);

    const mockGraph = {
      nodes: [
        {
          id: "r1",
          name: "Primary Domain",
          type: "domain",
          status: "active",
          category: "dns",
          cost: 15,
          currency: "USD",
          billingCycle: "yearly",
          renewalDate: new Date(),
          provider: "Namecheap",
          directPrerequisitesCount: 0,
          directDependentsCount: 1,
          totalBlastRadiusCount: 1,
          downstreamNodeIds: ["r2"],
          upstreamNodeIds: [],
          isCriticalSPOF: false,
        },
      ],
      edges: [
        {
          id: "e1",
          source: "r2",
          target: "r1",
          notes: "DNS host",
        },
      ],
      stats: {
        totalNodes: 1,
        totalEdges: 1,
        spofCount: 0,
        maxBlastRadius: 1,
        totalAnnualCostAtRisk: 15,
      },
    };

    vi.mocked(getWorkspaceDependencyGraph).mockResolvedValue(mockGraph as never);

    const request = new NextRequest("http://localhost/api/workspaces/ws-1/dependencies");
    const response = await GET(request, { params: Promise.resolve({ workspaceId: "ws-1" }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.nodes.length).toBe(1);
    expect(json.data.edges.length).toBe(1);
    expect(json.data.stats.totalNodes).toBe(1);
    expect(json.data.stats.maxBlastRadius).toBe(1);
  });
});
