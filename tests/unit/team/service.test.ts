import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createWorkspaceInvitation,
  listWorkspaceTeam,
  revokeInvitation,
  updateMemberRole,
  removeMemberFromWorkspace,
  getInvitationByToken,
  acceptWorkspaceInvitation,
} from "@/lib/team/service";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { sendTeamInvitationEmail } from "@/lib/notifications/email";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/lib/notifications/email", () => ({
  sendTeamInvitationEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock DB
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockDelete = vi.fn();
const mockInnerJoin = vi.fn();
const mockLeftJoin = vi.fn();
const mockOrderBy = vi.fn();

vi.mock("@/db", () => ({
  getDb: () => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  }),
}));

describe("Team Service (Unit Tests)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({
      where: mockWhere,
      innerJoin: mockInnerJoin,
      leftJoin: mockLeftJoin,
    });
    mockInnerJoin.mockReturnValue({
      where: mockWhere,
      leftJoin: mockLeftJoin,
    });
    mockLeftJoin.mockReturnValue({
      where: mockWhere,
      leftJoin: mockLeftJoin,
    });
    mockWhere.mockReturnValue({
      limit: mockLimit,
      orderBy: mockOrderBy,
    });
    mockOrderBy.mockReturnValue(Promise.resolve([]));
    mockLimit.mockReturnValue(Promise.resolve([]));

    mockInsert.mockReturnValue({ values: mockValues });
    mockValues.mockReturnValue({ returning: mockReturning });
    mockReturning.mockReturnValue(Promise.resolve([{ id: "new-id" }]));

    mockUpdate.mockReturnValue({ set: mockSet });
    mockSet.mockReturnValue({ where: mockWhere });

    mockDelete.mockReturnValue({ where: mockWhere });
  });

  describe("createWorkspaceInvitation", () => {
    it("throws FORBIDDEN if caller lacks admin permission", async () => {
      vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

      await expect(
        createWorkspaceInvitation({
          workspaceId: "ws-1",
          callerUserId: "user-non-admin",
          email: "test@example.com",
          role: "member",
        })
      ).rejects.toThrow("FORBIDDEN");
    });

    it("throws ALREADY_MEMBER if user with email is already a member", async () => {
      vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

      // 1. users lookup returns user
      mockLimit.mockResolvedValueOnce([{ id: "existing-user-id" }]);
      // 2. memberships lookup returns existing membership
      mockLimit.mockResolvedValueOnce([{ id: "membership-1" }]);

      await expect(
        createWorkspaceInvitation({
          workspaceId: "ws-1",
          callerUserId: "user-admin",
          email: "colleague@example.com",
          role: "member",
        })
      ).rejects.toThrow("ALREADY_MEMBER");
    });

    it("creates an invitation, generates token, and triggers email dispatch", async () => {
      vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

      // 1. users lookup returns empty (no existing user with this email)
      mockLimit.mockResolvedValueOnce([]);
      // 2. workspace lookup returns workspace
      mockLimit.mockResolvedValueOnce([{ name: "Acme Corp" }]);
      // 3. inviter user lookup returns name
      mockLimit.mockResolvedValueOnce([{ name: "Alice Admin", email: "alice@acme.com" }]);
      // 4. existing invitation check returns empty
      mockLimit.mockResolvedValueOnce([]);

      mockReturning.mockResolvedValueOnce([{ id: "inv-uuid" }]);

      const res = await createWorkspaceInvitation({
        workspaceId: "ws-1",
        callerUserId: "user-admin",
        email: "NewGuy@Company.com ",
        role: "admin",
      });

      expect(res.invitationId).toBe("inv-uuid");
      expect(res.token).toHaveLength(64);
      expect(res.inviteUrl).toContain(`/invite/${res.token}`);
      expect(sendTeamInvitationEmail).toHaveBeenCalled();
    });
  });

  describe("listWorkspaceTeam", () => {
    it("returns members and pending invitations for a workspace", async () => {
      vi.mocked(requireWorkspaceRole).mockResolvedValue({ role: "owner" } as never);

      mockOrderBy
        .mockResolvedValueOnce([
          { id: "u-1", name: "Alice", email: "alice@acme.com", role: "owner", joinedAt: new Date() },
        ])
        .mockResolvedValueOnce([
          {
            id: "inv-1",
            email: "bob@acme.com",
            role: "member",
            token: "tok-1",
            invitedBy: "u-1",
            inviterName: "Alice",
            expiresAt: new Date(),
            createdAt: new Date(),
          },
        ]);

      const result = await listWorkspaceTeam("ws-1", "u-1");
      expect(result.currentUserRole).toBe("owner");
      expect(result.members).toHaveLength(1);
      expect(result.invitations).toHaveLength(1);
    });
  });

  describe("revokeInvitation", () => {
    it("deletes the pending invitation", async () => {
      vi.mocked(requireWorkspaceRole).mockResolvedValue({ role: "admin" } as never);

      await expect(revokeInvitation("ws-1", "inv-1", "u-1")).resolves.toBeUndefined();
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe("updateMemberRole", () => {
    it("prevents demoting the workspace owner", async () => {
      vi.mocked(requireWorkspaceRole).mockResolvedValue({ role: "admin" } as never);

      // Target member is an owner
      mockLimit.mockResolvedValueOnce([{ id: "mem-1", role: "owner" }]);

      await expect(
        updateMemberRole("ws-1", "owner-user", "member", "caller-admin")
      ).rejects.toThrow("CANNOT_MODIFY_OWNER");
    });

    it("updates non-owner member role successfully", async () => {
      vi.mocked(requireWorkspaceRole).mockResolvedValue({ role: "owner" } as never);

      mockLimit.mockResolvedValueOnce([{ id: "mem-1", role: "member" }]);

      await expect(
        updateMemberRole("ws-1", "target-user", "admin", "caller-owner")
      ).resolves.toBeUndefined();

      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe("removeMemberFromWorkspace", () => {
    it("prevents removing the workspace owner", async () => {
      // Target is owner
      mockLimit.mockResolvedValueOnce([{ id: "mem-owner", role: "owner" }]);

      await expect(
        removeMemberFromWorkspace("ws-1", "owner-user", "caller-admin")
      ).rejects.toThrow("CANNOT_REMOVE_OWNER");
    });

    it("allows removing a regular member", async () => {
      vi.mocked(requireWorkspaceRole).mockResolvedValue({ role: "owner" } as never);

      // Target is member
      mockLimit.mockResolvedValueOnce([{ id: "mem-regular", role: "member" }]);

      await expect(
        removeMemberFromWorkspace("ws-1", "member-user", "caller-owner")
      ).resolves.toBeUndefined();

      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe("getInvitationByToken", () => {
    it("returns valid: false when invitation does not exist", async () => {
      mockLimit.mockResolvedValueOnce([]);

      const res = await getInvitationByToken("invalid-token");
      expect(res.valid).toBe(false);
      expect(res.reason).toBe("Invitation not found");
    });

    it("returns valid: false when invitation is expired", async () => {
      mockLimit.mockResolvedValueOnce([
        {
          id: "inv-1",
          email: "test@example.com",
          role: "member",
          expiresAt: new Date(Date.now() - 10000), // in the past
          acceptedAt: null,
          workspaceId: "ws-1",
          workspaceName: "Test WS",
          workspaceSlug: "test-ws",
          inviterName: "Alice",
        },
      ]);

      const res = await getInvitationByToken("expired-token");
      expect(res.valid).toBe(false);
      expect(res.reason).toBe("Invitation has expired");
    });

    it("returns valid: true with invitation details when active", async () => {
      mockLimit.mockResolvedValueOnce([
        {
          id: "inv-1",
          email: "test@example.com",
          role: "member",
          expiresAt: new Date(Date.now() + 500000), // in the future
          acceptedAt: null,
          workspaceId: "ws-1",
          workspaceName: "Acme",
          workspaceSlug: "acme",
          inviterName: "Alice",
        },
      ]);

      const res = await getInvitationByToken("valid-token");
      expect(res.valid).toBe(true);
      expect(res.invitation?.workspace.name).toBe("Acme");
      expect(res.invitation?.email).toBe("test@example.com");
    });
  });

  describe("acceptWorkspaceInvitation", () => {
    it("adds member and marks invitation accepted", async () => {
      mockLimit.mockResolvedValueOnce([
        {
          id: "inv-1",
          workspaceId: "ws-1",
          email: "colleague@example.com",
          role: "admin",
          expiresAt: new Date(Date.now() + 500000),
          acceptedAt: null,
          workspaceSlug: "my-ws",
        },
      ]);

      // Check existing membership returns empty
      mockLimit.mockResolvedValueOnce([]);

      const result = await acceptWorkspaceInvitation("valid-token", "user-accepting");
      expect(result.success).toBe(true);
      expect(result.workspaceId).toBe("ws-1");
      expect(result.workspaceSlug).toBe("my-ws");

      expect(mockInsert).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
    });
  });
});
