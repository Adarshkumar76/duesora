import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/workspaces/[workspaceId]/webhooks/route";
import {
  GET as GET_ONE,
  PATCH as PATCH_ONE,
  DELETE as DELETE_ONE,
} from "@/app/api/workspaces/[workspaceId]/webhooks/[endpointId]/route";
import { POST as POST_TEST } from "@/app/api/workspaces/[workspaceId]/webhooks/[endpointId]/test/route";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import {
  createWebhookEndpoint,
  listWebhookEndpoints,
  getWebhookEndpointById,
  updateWebhookEndpoint,
  deleteWebhookEndpoint,
  listWebhookDeliveries,
} from "@/lib/webhooks/repository";
import { sendWebhookPing } from "@/lib/webhooks/dispatcher";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/lib/webhooks/repository", () => ({
  createWebhookEndpoint: vi.fn(),
  listWebhookEndpoints: vi.fn(),
  getWebhookEndpointById: vi.fn(),
  updateWebhookEndpoint: vi.fn(),
  deleteWebhookEndpoint: vi.fn(),
  listWebhookDeliveries: vi.fn(),
}));

vi.mock("@/lib/webhooks/dispatcher", () => ({
  sendWebhookPing: vi.fn(),
}));

describe("API: Workspace Webhooks", () => {
  const context = {
    params: Promise.resolve({ workspaceId: "ws-test-wh" }),
  };

  const endpointContext = {
    params: Promise.resolve({ workspaceId: "ws-test-wh", endpointId: "ep-123" }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/workspaces/[workspaceId]/webhooks", () => {
    it("returns 401 UNAUTHORIZED when no active session", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-wh/webhooks");
      const response = await GET(request, context);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 200 with masked secrets for workspace endpoints", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-authorized" },
      } as never);

      vi.mocked(requireWorkspaceRole).mockResolvedValue({
        role: "viewer",
        userId: "user-authorized",
        workspaceId: "ws-test-wh",
      } as never);

      vi.mocked(listWebhookEndpoints).mockResolvedValue([
        {
          id: "ep-1",
          workspaceId: "ws-test-wh",
          url: "https://example.com/webhook",
          description: "Notifier",
          secret: "whsec_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          events: ["*"],
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-wh/webhooks");
      const response = await GET(request, context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].maskedSecret).toBe("whsec_1234...cdef");
    });
  });

  describe("POST /api/workspaces/[workspaceId]/webhooks", () => {
    it("returns 403 FORBIDDEN when user lacks admin privileges", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-member" },
      } as never);

      vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-wh/webhooks", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com/webhook" }),
      });
      const response = await POST(request, context);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("returns 201 when admin creates valid webhook endpoint", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-admin" },
      } as never);

      vi.mocked(requireWorkspaceRole).mockResolvedValue({
        role: "admin",
        userId: "user-admin",
        workspaceId: "ws-test-wh",
      } as never);

      vi.mocked(createWebhookEndpoint).mockResolvedValue({
        id: "ep-new",
        workspaceId: "ws-test-wh",
        url: "https://example.com/webhook",
        description: null,
        secret: "whsec_auto_generated",
        events: ["*"],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-wh/webhooks", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com/webhook" }),
      });
      const response = await POST(request, context);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.data.id).toBe("ep-new");
      expect(createWebhookEndpoint).toHaveBeenCalled();
    });
  });

  describe("GET /api/workspaces/[workspaceId]/webhooks/[endpointId]", () => {
    it("returns 404 when endpoint does not exist", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-authorized" },
      } as never);

      vi.mocked(getWebhookEndpointById).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-wh/webhooks/ep-123");
      const response = await GET_ONE(request, endpointContext);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("returns 200 with endpoint details and deliveries", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-authorized" },
      } as never);

      vi.mocked(getWebhookEndpointById).mockResolvedValue({
        id: "ep-123",
        workspaceId: "ws-test-wh",
        url: "https://example.com/webhook",
        description: null,
        secret: "whsec_123",
        events: ["*"],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(listWebhookDeliveries).mockResolvedValue([
        {
          id: "del-1",
          webhookEndpointId: "ep-123",
          workspaceId: "ws-test-wh",
          event: "resource.created",
          payload: "{}",
          statusCode: 200,
          responseBody: "OK",
          durationMs: 45,
          error: null,
          status: "success",
          deliveredAt: new Date(),
        },
      ]);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-wh/webhooks/ep-123");
      const response = await GET_ONE(request, endpointContext);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.deliveries).toHaveLength(1);
    });
  });

  describe("PATCH /api/workspaces/[workspaceId]/webhooks/[endpointId]", () => {
    it("returns 200 when admin updates endpoint", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-admin" },
      } as never);

      vi.mocked(requireWorkspaceRole).mockResolvedValue({
        role: "admin",
        userId: "user-admin",
        workspaceId: "ws-test-wh",
      } as never);

      vi.mocked(updateWebhookEndpoint).mockResolvedValue({
        id: "ep-123",
        workspaceId: "ws-test-wh",
        url: "https://example.com/webhook-updated",
        description: "Updated description",
        secret: "whsec_123",
        events: ["resource.created"],
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-wh/webhooks/ep-123", {
        method: "PATCH",
        body: JSON.stringify({ active: false, url: "https://example.com/webhook-updated" }),
      });
      const response = await PATCH_ONE(request, endpointContext);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.active).toBe(false);
      expect(updateWebhookEndpoint).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/workspaces/[workspaceId]/webhooks/[endpointId]", () => {
    it("returns 200 when admin deletes endpoint", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-admin" },
      } as never);

      vi.mocked(deleteWebhookEndpoint).mockResolvedValue(true);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-wh/webhooks/ep-123", {
        method: "DELETE",
      });
      const response = await DELETE_ONE(request, endpointContext);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.deleted).toBe(true);
    });
  });

  describe("POST /api/workspaces/[workspaceId]/webhooks/[endpointId]/test", () => {
    it("returns 200 when test ping is dispatched", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-admin" },
      } as never);

      vi.mocked(sendWebhookPing).mockResolvedValue({
        endpointId: "ep-123",
        url: "https://example.com/webhook",
        status: "success",
        statusCode: 200,
        durationMs: 78,
      });

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-wh/webhooks/ep-123/test", {
        method: "POST",
      });
      const response = await POST_TEST(request, endpointContext);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.status).toBe("success");
      expect(sendWebhookPing).toHaveBeenCalledWith("ws-test-wh", "ep-123");
    });
  });
});
