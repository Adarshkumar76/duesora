import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/workspaces/[workspaceId]/audit/route";
import { auth } from "@/auth";
import { listWorkspaceAuditLogs } from "@/lib/audit/service";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/audit/service", () => ({
  listWorkspaceAuditLogs: vi.fn(),
}));

describe("API: /api/workspaces/[workspaceId]/audit", () => {
  const context = {
    params: Promise.resolve({
      workspaceId: "ws-123",
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const req = new NextRequest("http://localhost:3000/api/workspaces/ws-123/audit");
    const res = await GET(req, context);
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not workspace admin or owner", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-member" } } as never);
    vi.mocked(listWorkspaceAuditLogs).mockRejectedValue(new Error("FORBIDDEN"));

    const req = new NextRequest("http://localhost:3000/api/workspaces/ws-123/audit");
    const res = await GET(req, context);
    expect(res.status).toBe(403);
  });

  it("returns 200 with paginated audit logs for admin", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-admin" } } as never);

    vi.mocked(listWorkspaceAuditLogs).mockResolvedValue({
      items: [
        {
          id: "log-1",
          workspaceId: "ws-123",
          actorId: "user-admin",
          actorName: "Admin User",
          actorEmail: "admin@example.com",
          action: "member.invited",
          entityType: "invitation",
          entityId: "inv-1",
          entityName: "newdev@example.com",
          details: { role: "member" },
          ipAddress: null,
          createdAt: new Date(),
        },
      ],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
    });

    const req = new NextRequest("http://localhost:3000/api/workspaces/ws-123/audit?entityType=invitation");
    const res = await GET(req, context);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.items).toHaveLength(1);
    expect(json.data.items[0].action).toBe("member.invited");
  });

  it("passes page and pageSize pagination parameters to service", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-admin" } } as never);
    vi.mocked(listWorkspaceAuditLogs).mockResolvedValue({
      items: [],
      pagination: {
        page: 2,
        pageSize: 10,
        total: 25,
        totalPages: 3,
      },
    });

    const req = new NextRequest("http://localhost:3000/api/workspaces/ws-123/audit?page=2&pageSize=10&search=test");
    const res = await GET(req, context);
    expect(res.status).toBe(200);

    expect(listWorkspaceAuditLogs).toHaveBeenCalledWith("user-admin", "ws-123", {
      action: undefined,
      entityType: undefined,
      search: "test",
      page: 2,
      pageSize: 10,
    });
    const json = await res.json();
    expect(json.data.pagination.page).toBe(2);
    expect(json.data.pagination.totalPages).toBe(3);
  });
});
