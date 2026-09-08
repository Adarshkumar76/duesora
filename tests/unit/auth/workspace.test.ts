import { beforeEach, describe, expect, it, vi } from "vitest";
import { getWorkspaceMembership, requireWorkspaceRole, listUserWorkspaces } from "@/lib/auth/workspace";
import { getDb } from "@/db";

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

describe("Workspace Authorization & Membership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getWorkspaceMembership", () => {
    it("returns the membership record when user belongs to the workspace", async () => {
      const mockMembership = {
        id: "membership-1",
        userId: "user-alpha",
        workspaceId: "workspace-alpha",
        role: "owner" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockMembership]),
      };

      vi.mocked(getDb).mockReturnValue(mockDb as never);

      const result = await getWorkspaceMembership("user-alpha", "workspace-alpha");

      expect(result).toEqual(mockMembership);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it("returns null when user has no membership in the workspace", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockReturnValue(mockDb as never);

      const result = await getWorkspaceMembership("user-unauthorized", "workspace-alpha");

      expect(result).toBeNull();
    });
  });

  describe("requireWorkspaceRole", () => {
    it("permits access when user role equals the required role", async () => {
      const mockMembership = {
        id: "membership-1",
        userId: "user-1",
        workspaceId: "workspace-1",
        role: "member" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockMembership]),
      };

      vi.mocked(getDb).mockReturnValue(mockDb as never);

      const result = await requireWorkspaceRole("user-1", "workspace-1", "member");
      expect(result.role).toBe("member");
    });

    it("permits access when user role exceeds the required role (e.g. owner for viewer action)", async () => {
      const mockMembership = {
        id: "membership-1",
        userId: "user-owner",
        workspaceId: "workspace-1",
        role: "owner" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockMembership]),
      };

      vi.mocked(getDb).mockReturnValue(mockDb as never);

      const result = await requireWorkspaceRole("user-owner", "workspace-1", "viewer");
      expect(result.role).toBe("owner");
    });

    it("throws FORBIDDEN when user role is below the required role (e.g. viewer attempting member action)", async () => {
      const mockMembership = {
        id: "membership-1",
        userId: "user-viewer",
        workspaceId: "workspace-1",
        role: "viewer" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockMembership]),
      };

      vi.mocked(getDb).mockReturnValue(mockDb as never);

      await expect(
        requireWorkspaceRole("user-viewer", "workspace-1", "member"),
      ).rejects.toThrow("FORBIDDEN");
    });

    it("throws FORBIDDEN when user has no membership in the target workspace", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockReturnValue(mockDb as never);

      await expect(
        requireWorkspaceRole("user-external", "workspace-1", "viewer"),
      ).rejects.toThrow("FORBIDDEN");
    });
  });

  describe("listUserWorkspaces", () => {
    it("returns workspaces where the user has active membership", async () => {
      const mockUserWorkspaces = [
        {
          id: "ws-1",
          name: "Alpha Corp",
          slug: "alpha-corp",
          type: "organization" as const,
          defaultCurrency: "USD",
          timezone: "UTC",
          role: "owner" as const,
          joinedAt: new Date(),
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockUserWorkspaces),
      };

      vi.mocked(getDb).mockReturnValue(mockDb as never);

      const result = await listUserWorkspaces("user-1");

      expect(result).toEqual(mockUserWorkspaces);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.innerJoin).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });
  });
});
