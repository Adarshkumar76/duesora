import { beforeEach, describe, expect, it, vi } from "vitest";
import { recordAuditEvent, listWorkspaceAuditLogs } from "@/lib/audit/service";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { getDb } from "@/db";

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

describe("Audit Service: recordAuditEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("safely records an audit event to the database", async () => {
    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });

    vi.mocked(getDb).mockReturnValue({
      insert: mockInsert,
    } as never);

    await recordAuditEvent({
      workspaceId: "ws-1",
      actorId: "user-1",
      action: "resource.created",
      entityType: "resource",
      entityId: "res-1",
      entityName: "Production Database",
      details: { amount: 5000 },
    });

    expect(mockInsert).toHaveBeenCalled();
  });

  it("catches and does not throw errors when database write fails", async () => {
    vi.mocked(getDb).mockImplementation(() => {
      throw new Error("DB_CONNECTION_FAILED");
    });

    // Should not throw
    await expect(
      recordAuditEvent({
        workspaceId: "ws-1",
        action: "resource.deleted",
        entityType: "resource",
      })
    ).resolves.not.toThrow();
  });
});

describe("Audit Service: listWorkspaceAuditLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enforces member role on active workspace", async () => {
    vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

    await expect(
      listWorkspaceAuditLogs("user-viewer", "ws-1")
    ).rejects.toThrow("FORBIDDEN");

    expect(requireWorkspaceRole).toHaveBeenCalledWith("user-viewer", "ws-1", "member");
  });

  it("retrieves paginated audit logs with actor attribution", async () => {
    vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

    const now = new Date();
    const mockRows = [
      {
        id: "log-1",
        workspaceId: "ws-1",
        actorId: "user-1",
        action: "resource.created",
        entityType: "resource",
        entityId: "res-100",
        entityName: "Stripe Subscription",
        details: '{"billingCycle":"monthly"}',
        ipAddress: "192.168.1.1",
        createdAt: now,
        actorName: "Alice Admin",
        actorEmail: "alice@example.com",
      },
    ];

    const mockCount = [{ count: 1 }];

    const mockDb = {
      select: vi.fn(),
    };

    const select1Chain = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockResolvedValue(mockRows),
    };

    const select2Chain = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockCount),
    };

    mockDb.select
      .mockReturnValueOnce(select1Chain)
      .mockReturnValueOnce(select2Chain);

    vi.mocked(getDb).mockReturnValue(mockDb as never);

    const result = await listWorkspaceAuditLogs("user-1", "ws-1", {
      page: 1,
      pageSize: 20,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].action).toBe("resource.created");
    expect(result.items[0].actorName).toBe("Alice Admin");
    expect(result.items[0].details).toEqual({ billingCycle: "monthly" });
    expect(result.pagination.total).toBe(1);
  });
});
