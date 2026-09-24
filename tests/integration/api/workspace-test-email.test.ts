import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/workspaces/[workspaceId]/notifications/test-email/route";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/lib/notifications/email", () => ({
  isEmailConfigured: vi.fn(),
  sendRenewalReminderEmail: vi.fn(),
}));

describe("API: /api/workspaces/[workspaceId]/notifications/test-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/workspaces/[workspaceId]/notifications/test-email", () => {
    it("returns 401 if unauthenticated", async () => {
      const { auth } = await import("@/auth");
      vi.mocked(auth).mockResolvedValueOnce(null as any);

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/notifications/test-email");
      const res = await GET(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(401);
    });

    it("returns configuration status for workspace viewer", async () => {
      const { auth } = await import("@/auth");
      const { requireWorkspaceRole } = await import("@/lib/auth/workspace");
      const { isEmailConfigured } = await import("@/lib/notifications/email");

      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-1", email: "admin@duesora.com" },
      } as any);

      vi.mocked(requireWorkspaceRole).mockResolvedValueOnce({
        workspace: { id: "ws-1", name: "Duesora HQ" },
        role: "viewer",
      } as any);

      vi.mocked(isEmailConfigured).mockReturnValueOnce(true);

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/notifications/test-email");
      const res = await GET(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.isConfigured).toBe(true);
      expect(json.data.mode).toBe("smtp");
      expect(json.data.recipientEmail).toBe("admin@duesora.com");
    });
  });

  describe("POST /api/workspaces/[workspaceId]/notifications/test-email", () => {
    it("returns 401 if unauthenticated", async () => {
      const { auth } = await import("@/auth");
      vi.mocked(auth).mockResolvedValueOnce(null as any);

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/notifications/test-email", {
        method: "POST",
      });
      const res = await POST(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(401);
    });

    it("successfully dispatches test reminder email", async () => {
      const { auth } = await import("@/auth");
      const { requireWorkspaceRole } = await import("@/lib/auth/workspace");
      const { isEmailConfigured, sendRenewalReminderEmail } = await import("@/lib/notifications/email");

      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-1", name: "Adarsh", email: "admin@duesora.com" },
      } as any);

      vi.mocked(requireWorkspaceRole).mockResolvedValueOnce({
        workspace: { id: "ws-1", name: "Duesora HQ" },
        role: "member",
      } as any);

      vi.mocked(isEmailConfigured).mockReturnValueOnce(false);
      vi.mocked(sendRenewalReminderEmail).mockResolvedValueOnce({
        success: true,
        simulated: true,
        messageId: "simulated-msg-123",
      });

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/notifications/test-email", {
        method: "POST",
      });
      const res = await POST(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.recipient).toBe("admin@duesora.com");
      expect(json.data.simulated).toBe(true);
      expect(json.data.messageId).toBe("simulated-msg-123");
      expect(sendRenewalReminderEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "admin@duesora.com",
          resourceName: "Example Service (Test Alert)",
        })
      );
    });
  });
});
