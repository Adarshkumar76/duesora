import { beforeEach, describe, expect, it, vi } from "vitest";
import { bulkPerformResourceAction } from "@/lib/resources/bulk";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { getDb } from "@/db";
import { recordAuditEvent } from "@/lib/audit/service";
import { findOrCreateTagsByName } from "@/lib/tags/repository";

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

vi.mock("@/lib/audit/service", () => ({
  recordAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/webhooks/dispatcher", () => ({
  emitWorkspaceWebhook: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/tags/repository", () => ({
  findOrCreateTagsByName: vi.fn(),
}));

describe("Bulk Resources Service: bulkPerformResourceAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws error if caller does not have member role in workspace", async () => {
    vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

    await expect(
      bulkPerformResourceAction("user-1", "ws-1", {
        action: "bulk_status",
        resourceIds: ["res-1"],
        status: "active",
      })
    ).rejects.toThrow("FORBIDDEN");

    expect(requireWorkspaceRole).toHaveBeenCalledWith("user-1", "ws-1", "member");
  });

  it("returns 0 affected count when empty resourceIds provided", async () => {
    vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

    const result = await bulkPerformResourceAction("user-1", "ws-1", {
      action: "bulk_status",
      resourceIds: [],
      status: "active",
    });

    expect(result.affectedCount).toBe(0);
    expect(result.success).toBe(true);
  });

  it("returns 0 affected count when no matching resources belong to workspace", async () => {
    vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    };
    vi.mocked(getDb).mockReturnValue(mockDb as never);

    const result = await bulkPerformResourceAction("user-1", "ws-1", {
      action: "bulk_status",
      resourceIds: ["res-other-ws"],
      status: "inactive",
    });

    expect(result.affectedCount).toBe(0);
  });

  it("successfully performs bulk_status on matching resources and logs audit event", async () => {
    vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

    const updateMock = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    });

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: "res-1", name: "Domain One" },
            { id: "res-2", name: "Domain Two" },
          ]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: updateMock,
      }),
    };
    vi.mocked(getDb).mockReturnValue(mockDb as never);

    const result = await bulkPerformResourceAction("user-1", "ws-1", {
      action: "bulk_status",
      resourceIds: ["res-1", "res-2"],
      status: "expired",
    });

    expect(result.success).toBe(true);
    expect(result.affectedCount).toBe(2);
    expect(result.affectedIds).toEqual(["res-1", "res-2"]);
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "ws-1",
        actorId: "user-1",
        action: "resource.bulk_status_changed",
      })
    );
  });

  it("successfully performs bulk_owner assignment", async () => {
    vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

    const updateMock = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    });

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: "res-1", name: "Resource 1" }]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: updateMock,
      }),
    };
    vi.mocked(getDb).mockReturnValue(mockDb as never);

    const result = await bulkPerformResourceAction("user-1", "ws-1", {
      action: "bulk_owner",
      resourceIds: ["res-1"],
      ownerId: "user-new-owner",
    });

    expect(result.success).toBe(true);
    expect(result.affectedCount).toBe(1);
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "resource.bulk_owner_assigned",
      })
    );
  });

  it("successfully performs bulk_tag with add mode", async () => {
    vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

    const insertMock = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue([]),
      }),
    });

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: "res-1", name: "Resource 1" }]),
        }),
      }),
      insert: insertMock,
    };
    vi.mocked(getDb).mockReturnValue(mockDb as never);
    vi.mocked(findOrCreateTagsByName).mockResolvedValue([
      { id: "tag-1", name: "production", colorToken: "emerald", workspaceId: "ws-1", createdAt: new Date(), updatedAt: new Date() },
    ]);

    const result = await bulkPerformResourceAction("user-1", "ws-1", {
      action: "bulk_tag",
      resourceIds: ["res-1"],
      tags: ["production"],
      mode: "add",
    });

    expect(result.success).toBe(true);
    expect(result.affectedCount).toBe(1);
    expect(findOrCreateTagsByName).toHaveBeenCalledWith("ws-1", ["production"]);
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "resource.bulk_tagged",
      })
    );
  });

  it("successfully performs bulk_delete", async () => {
    vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

    const deleteMock = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    });

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: "res-1", name: "Resource 1" },
            { id: "res-2", name: "Resource 2" },
          ]),
        }),
      }),
      delete: deleteMock,
    };
    vi.mocked(getDb).mockReturnValue(mockDb as never);

    const result = await bulkPerformResourceAction("user-1", "ws-1", {
      action: "bulk_delete",
      resourceIds: ["res-1", "res-2"],
    });

    expect(result.success).toBe(true);
    expect(result.affectedCount).toBe(2);
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "resource.bulk_deleted",
      })
    );
  });
});
