import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { DELETE } from "@/app/api/workspaces/[workspaceId]/route";
import { POST as leavePOST } from "@/app/api/workspaces/[workspaceId]/leave/route";
import { auth } from "@/auth";
import { requireWorkspaceRole, listUserWorkspaces } from "@/lib/auth/workspace";
import { getDb } from "@/db";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
  listUserWorkspaces: vi.fn(),
}));

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

describe("API: Workspace Danger Zone & Lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DELETE /api/workspaces/[workspaceId]", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const request = new NextRequest("http://localhost/api/workspaces/ws-1", { method: "DELETE" });
      const response = await DELETE(request, { params: Promise.resolve({ workspaceId: "ws-1" }) });

      expect(response.status).toBe(401);
    });

    it("returns 403 when user is not an owner", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-1" },
      } as never);

      vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

      const request = new NextRequest("http://localhost/api/workspaces/ws-1", { method: "DELETE" });
      const response = await DELETE(request, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error.message).toBe("FORBIDDEN");
    });

    it("returns 200 and deletes workspace when user is owner", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-1" },
      } as never);

      vi.mocked(requireWorkspaceRole).mockResolvedValue(undefined as never);

      const mockDb = {
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: "ws-1", name: "Acme Corp" }]),
          }),
        }),
      };
      vi.mocked(getDb).mockReturnValue(mockDb as never);
      vi.mocked(listUserWorkspaces).mockResolvedValue([
        { id: "ws-2", name: "Personal", role: "owner" },
      ] as never);

      const request = new NextRequest("http://localhost/api/workspaces/ws-1", { method: "DELETE" });
      const response = await DELETE(request, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toContain("Acme Corp");
      expect(response.cookies.get("duesora_active_workspace")?.value).toBe("ws-2");
    });
  });

  describe("POST /api/workspaces/[workspaceId]/leave", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const request = new NextRequest("http://localhost/api/workspaces/ws-1/leave", { method: "POST" });
      const response = await leavePOST(request, { params: Promise.resolve({ workspaceId: "ws-1" }) });

      expect(response.status).toBe(401);
    });

    it("returns 404 when user is not a member", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-1" },
      } as never);

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };
      vi.mocked(getDb).mockReturnValue(mockDb as never);

      const request = new NextRequest("http://localhost/api/workspaces/ws-1/leave", { method: "POST" });
      const response = await leavePOST(request, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error.message).toContain("not a member");
    });

    it("returns 400 when user is the sole owner", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-1" },
      } as never);

      const mockDb = {
        select: vi.fn()
          .mockReturnValueOnce({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([{ id: "mem-1", role: "owner" }]),
              }),
            }),
          })
          .mockReturnValueOnce({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ id: "mem-1" }]),
            }),
          }),
      };
      vi.mocked(getDb).mockReturnValue(mockDb as never);

      const request = new NextRequest("http://localhost/api/workspaces/ws-1/leave", { method: "POST" });
      const response = await leavePOST(request, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.message).toContain("sole owner");
    });

    it("returns 200 and removes membership when regular member leaves", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-1" },
      } as never);

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: "mem-1", role: "member" }]),
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      };
      vi.mocked(getDb).mockReturnValue(mockDb as never);
      vi.mocked(listUserWorkspaces).mockResolvedValue([]);

      const request = new NextRequest("http://localhost/api/workspaces/ws-1/leave", { method: "POST" });
      const response = await leavePOST(request, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toBe("You have left the workspace.");
    });
  });
});
