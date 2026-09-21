import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH as PATCH_ALL } from "@/app/api/workspaces/[workspaceId]/notifications/route";
import { PATCH as PATCH_ONE } from "@/app/api/workspaces/[workspaceId]/notifications/[notificationId]/route";
import { POST as POST_RUN } from "@/app/api/workspaces/[workspaceId]/reminders/run/route";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import {
  listUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/repository";
import { processWorkspaceReminders } from "@/lib/notifications/reminder-engine";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/lib/notifications/repository", () => ({
  listUserNotifications: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

vi.mock("@/lib/notifications/reminder-engine", () => ({
  processWorkspaceReminders: vi.fn(),
}));

describe("API: Workspace Notifications & Reminders", () => {
  const context = {
    params: Promise.resolve({ workspaceId: "ws-test-999" }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/workspaces/[workspaceId]/notifications", () => {
    it("returns 401 UNAUTHORIZED when no active session", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-999/notifications");
      const response = await GET(request, context);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 403 FORBIDDEN when user lacks viewer permissions", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-unauthorized" },
      } as never);

      vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-999/notifications");
      const response = await GET(request, context);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("returns 200 with notification items and unread count", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-authorized" },
      } as never);

      vi.mocked(requireWorkspaceRole).mockResolvedValue({
        role: "member",
        userId: "user-authorized",
        workspaceId: "ws-test-999",
      } as never);

      vi.mocked(listUserNotifications).mockResolvedValue({
        items: [
          {
            id: "notif-1",
            workspaceId: "ws-test-999",
            userId: "user-authorized",
            resourceId: "res-1",
            resourceName: "AWS",
            resourceType: "cloud_service",
            title: "AWS renewal alert",
            message: "Renews in 7 days",
            type: "renewal_upcoming",
            severity: "warning",
            status: "unread",
            metadata: null,
            readAt: null,
            createdAt: new Date(),
          },
        ],
        total: 1,
        unreadCount: 1,
      });

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-999/notifications");
      const response = await GET(request, context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.meta.unreadCount).toBe(1);
    });
  });

  describe("PATCH /api/workspaces/[workspaceId]/notifications (Mark all read)", () => {
    it("returns 200 with updated count", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-authorized" },
      } as never);

      vi.mocked(requireWorkspaceRole).mockResolvedValue({
        role: "member",
        userId: "user-authorized",
        workspaceId: "ws-test-999",
      } as never);

      vi.mocked(markAllNotificationsRead).mockResolvedValue(5);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-999/notifications", {
        method: "PATCH",
      });
      const response = await PATCH_ALL(request, context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.updatedCount).toBe(5);
    });
  });

  describe("PATCH /api/workspaces/[workspaceId]/notifications/[notificationId] (Mark one read)", () => {
    const singleContext = {
      params: Promise.resolve({
        workspaceId: "ws-test-999",
        notificationId: "notif-1",
      }),
    };

    it("returns 404 when notification does not exist or belongs to another user", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-authorized" },
      } as never);

      vi.mocked(markNotificationRead).mockResolvedValue(false);

      const request = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-test-999/notifications/notif-1",
        { method: "PATCH" }
      );
      const response = await PATCH_ONE(request, singleContext);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("returns 200 when notification is successfully marked read", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-authorized" },
      } as never);

      vi.mocked(markNotificationRead).mockResolvedValue(true);

      const request = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-test-999/notifications/notif-1",
        { method: "PATCH" }
      );
      const response = await PATCH_ONE(request, singleContext);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.status).toBe("read");
    });
  });

  describe("POST /api/workspaces/[workspaceId]/reminders/run", () => {
    it("returns 403 FORBIDDEN when user lacks admin privileges", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-member" },
      } as never);

      vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

      const request = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-test-999/reminders/run",
        { method: "POST" }
      );
      const response = await POST_RUN(request, context);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error.code).toBe("FORBIDDEN");
      expect(processWorkspaceReminders).not.toHaveBeenCalled();
    });

    it("returns 200 with summary when admin runs reminder engine", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-admin" },
      } as never);

      vi.mocked(requireWorkspaceRole).mockResolvedValue({
        role: "admin",
        userId: "user-admin",
        workspaceId: "ws-test-999",
      } as never);

      vi.mocked(processWorkspaceReminders).mockResolvedValue({
        workspaceId: "ws-test-999",
        scannedCount: 10,
        dispatchedInAppCount: 2,
        dispatchedEmailCount: 2,
        skippedCount: 8,
        errors: [],
      });

      const request = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-test-999/reminders/run",
        { method: "POST" }
      );
      const response = await POST_RUN(request, context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.scannedCount).toBe(10);
      expect(json.data.dispatchedInAppCount).toBe(2);
      expect(processWorkspaceReminders).toHaveBeenCalledWith("ws-test-999");
    });
  });
});
