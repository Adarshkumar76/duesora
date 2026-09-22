import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getMembers } from "@/app/api/workspaces/[workspaceId]/members/route";
import { POST as postInvitation } from "@/app/api/workspaces/[workspaceId]/invitations/route";
import { DELETE as deleteInvitation } from "@/app/api/workspaces/[workspaceId]/invitations/[invitationId]/route";
import { PATCH as patchMember, DELETE as deleteMember } from "@/app/api/workspaces/[workspaceId]/members/[memberId]/route";
import { GET as getInviteToken, POST as postAcceptInvite } from "@/app/api/invitations/[token]/route";
import { auth } from "@/auth";
import {
  listWorkspaceTeam,
  createWorkspaceInvitation,
  revokeInvitation,
  updateMemberRole,
  removeMemberFromWorkspace,
  getInvitationByToken,
  acceptWorkspaceInvitation,
} from "@/lib/team/service";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/team/service", () => ({
  listWorkspaceTeam: vi.fn(),
  createWorkspaceInvitation: vi.fn(),
  revokeInvitation: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMemberFromWorkspace: vi.fn(),
  getInvitationByToken: vi.fn(),
  acceptWorkspaceInvitation: vi.fn(),
}));

describe("API: Workspace Team & Invitations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/workspaces/[workspaceId]/members", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);
      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/members");
      const res = await getMembers(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(401);
    });

    it("returns 200 with members and invitations", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(listWorkspaceTeam).mockResolvedValue({
        members: [{ id: "u-1", name: "Alice", email: "alice@test.com", role: "owner", joinedAt: new Date() }],
        invitations: [],
        currentUserRole: "owner",
      });

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/members");
      const res = await getMembers(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.members).toHaveLength(1);
    });
  });

  describe("POST /api/workspaces/[workspaceId]/invitations", () => {
    it("returns 400 on invalid email", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/invitations", {
        method: "POST",
        body: JSON.stringify({ email: "not-an-email", role: "member" }),
      });

      const res = await postInvitation(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(400);
    });

    it("returns 201 when invitation created successfully", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(createWorkspaceInvitation).mockResolvedValue({
        invitationId: "inv-123",
        token: "tok-abc",
        inviteUrl: "http://localhost:3000/invite/tok-abc",
      });

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/invitations", {
        method: "POST",
        body: JSON.stringify({ email: "colleague@test.com", role: "admin" }),
      });

      const res = await postInvitation(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.data.invitationId).toBe("inv-123");
    });
  });

  describe("DELETE /api/workspaces/[workspaceId]/invitations/[invitationId]", () => {
    it("returns 200 when invitation revoked", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(revokeInvitation).mockResolvedValue();

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/invitations/inv-1");
      const res = await deleteInvitation(req, {
        params: Promise.resolve({ workspaceId: "ws-1", invitationId: "inv-1" }),
      });
      expect(res.status).toBe(200);
      expect(revokeInvitation).toHaveBeenCalledWith("ws-1", "inv-1", "user-1");
    });
  });

  describe("PATCH /api/workspaces/[workspaceId]/members/[memberId]", () => {
    it("returns 200 when role updated", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(updateMemberRole).mockResolvedValue();

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/members/mem-2", {
        method: "PATCH",
        body: JSON.stringify({ role: "admin" }),
      });

      const res = await patchMember(req, {
        params: Promise.resolve({ workspaceId: "ws-1", memberId: "mem-2" }),
      });
      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /api/workspaces/[workspaceId]/members/[memberId]", () => {
    it("returns 200 when member removed", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(removeMemberFromWorkspace).mockResolvedValue();

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/members/mem-2", {
        method: "DELETE",
      });

      const res = await deleteMember(req, {
        params: Promise.resolve({ workspaceId: "ws-1", memberId: "mem-2" }),
      });
      expect(res.status).toBe(200);
    });
  });

  describe("GET and POST /api/invitations/[token]", () => {
    it("returns 404 for invalid token", async () => {
      vi.mocked(getInvitationByToken).mockResolvedValue({ valid: false, reason: "Invitation not found" });

      const req = new NextRequest("http://localhost:3000/api/invitations/invalid-tok");
      const res = await getInviteToken(req, { params: Promise.resolve({ token: "invalid-tok" }) });
      expect(res.status).toBe(404);
    });

    it("returns 200 with metadata for valid token", async () => {
      vi.mocked(getInvitationByToken).mockResolvedValue({
        valid: true,
        invitation: {
          id: "inv-1",
          email: "colleague@test.com",
          role: "member",
          expiresAt: new Date(),
          workspace: { id: "ws-1", name: "Acme", slug: "acme" },
          inviterName: "Alice",
        },
      });

      const req = new NextRequest("http://localhost:3000/api/invitations/valid-tok");
      const res = await getInviteToken(req, { params: Promise.resolve({ token: "valid-tok" }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.workspace.name).toBe("Acme");
    });

    it("accepts invitation when authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-joiner", email: "colleague@test.com" } } as never);
      vi.mocked(acceptWorkspaceInvitation).mockResolvedValue({
        success: true,
        workspaceId: "ws-1",
        workspaceSlug: "acme",
      });

      const req = new NextRequest("http://localhost:3000/api/invitations/valid-tok", { method: "POST" });
      const res = await postAcceptInvite(req, { params: Promise.resolve({ token: "valid-tok" }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.workspaceId).toBe("ws-1");
    });
  });
});
