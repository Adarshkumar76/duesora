import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/workspaces/[workspaceId]/resources/[resourceId]/renew/route";
import { auth } from "@/auth";
import { renewWorkspaceResource } from "@/lib/renewals/service";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/renewals/service", () => ({
  renewWorkspaceResource: vi.fn(),
}));

describe("API: /api/workspaces/[workspaceId]/resources/[resourceId]/renew", () => {
  const context = {
    params: Promise.resolve({
      workspaceId: "ws-123",
      resourceId: "res-456",
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const req = new NextRequest("http://localhost:3000/api/workspaces/ws-123/resources/res-456/renew", {
      method: "POST",
    });

    const res = await POST(req, context);
    expect(res.status).toBe(401);
  });

  it("returns 403 when user lacks member permission", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    vi.mocked(renewWorkspaceResource).mockRejectedValue(new Error("FORBIDDEN"));

    const req = new NextRequest("http://localhost:3000/api/workspaces/ws-123/resources/res-456/renew", {
      method: "POST",
    });

    const res = await POST(req, context);
    expect(res.status).toBe(403);
  });

  it("returns 200 with renewed resource data when successful", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);

    const nextDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    vi.mocked(renewWorkspaceResource).mockResolvedValue({
      id: "res-456",
      workspaceId: "ws-123",
      name: "Domain Name",
      renewalDate: nextDate,
      status: "active",
    } as never);

    const req = new NextRequest("http://localhost:3000/api/workspaces/ws-123/resources/res-456/renew", {
      method: "POST",
    });

    const res = await POST(req, context);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.resource.id).toBe("res-456");
    expect(json.data.resource.name).toBe("Domain Name");
  });
});
