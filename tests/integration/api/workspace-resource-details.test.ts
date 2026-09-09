import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  GET,
  PATCH,
  DELETE,
} from "@/app/api/workspaces/[workspaceId]/resources/[resourceId]/route";
import { auth } from "@/auth";
import {
  getWorkspaceResource,
  updateWorkspaceResource,
  deleteWorkspaceResource,
} from "@/lib/resources/service";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/resources/service", () => ({
  getWorkspaceResource: vi.fn(),
  updateWorkspaceResource: vi.fn(),
  deleteWorkspaceResource: vi.fn(),
}));

describe("API: /api/workspaces/[workspaceId]/resources/[resourceId] Handlers", () => {
  const context = {
    params: Promise.resolve({
      workspaceId: "ws-test-123",
      resourceId: "res-test-456",
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET Handler", () => {
    it("returns 401 UNAUTHORIZED when there is no active session", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const request = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-test-123/resources/res-test-456"
      );
      const response = await GET(request, context);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(getWorkspaceResource).not.toHaveBeenCalled();
    });

    it("returns 404 NOT_FOUND when resource does not exist", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-123" },
      } as never);

      vi.mocked(getWorkspaceResource).mockResolvedValue(null as never);

      const request = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-test-123/resources/res-test-456"
      );
      const response = await GET(request, context);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("returns 200 OK with resource data when authorized", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-123" },
      } as never);

      const mockResource = {
        id: "res-test-456",
        workspaceId: "ws-test-123",
        name: "duesora.com",
        type: "domain" as const,
        status: "active" as const,
        description: "Primary domain",
        provider: "GoDaddy",
        websiteUrl: "https://duesora.com",
        amountMinor: 1299,
        currency: "USD",
        billingCycle: "yearly" as const,
        renewalDate: new Date(),
        autoRenew: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getWorkspaceResource).mockResolvedValue(mockResource);

      const request = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-test-123/resources/res-test-456"
      );
      const response = await GET(request, context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.name).toBe("duesora.com");
    });
  });

  describe("PATCH Handler", () => {
    it("returns 401 UNAUTHORIZED when there is no active session", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const request = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-test-123/resources/res-test-456",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Updated Name" }),
        }
      );
      const response = await PATCH(request, context);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 200 OK with updated resource when authorized", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-123" },
      } as never);

      const updatedResource = {
        id: "res-test-456",
        workspaceId: "ws-test-123",
        name: "duesora-updated.com",
        type: "domain" as const,
        status: "active" as const,
        description: null,
        provider: "Cloudflare",
        websiteUrl: null,
        amountMinor: 1599,
        currency: "USD",
        billingCycle: "yearly" as const,
        renewalDate: null,
        autoRenew: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(updateWorkspaceResource).mockResolvedValue(updatedResource);

      const request = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-test-123/resources/res-test-456",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "duesora-updated.com",
            provider: "Cloudflare",
            amountMinor: 1599,
          }),
        }
      );
      const response = await PATCH(request, context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.name).toBe("duesora-updated.com");
      expect(updateWorkspaceResource).toHaveBeenCalledWith(
        "user-123",
        "ws-test-123",
        "res-test-456",
        expect.objectContaining({
          name: "duesora-updated.com",
          provider: "Cloudflare",
          amountMinor: 1599,
        })
      );
    });
  });

  describe("DELETE Handler", () => {
    it("returns 401 UNAUTHORIZED when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const request = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-test-123/resources/res-test-456",
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(request, context);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 200 OK when resource is deleted successfully", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-123" },
      } as never);

      vi.mocked(deleteWorkspaceResource).mockResolvedValue({
        id: "res-test-456",
        workspaceId: "ws-test-123",
        name: "deleted-resource",
        type: "domain",
        status: "active",
        description: null,
        provider: null,
        websiteUrl: null,
        amountMinor: null,
        currency: "USD",
        billingCycle: "yearly",
        renewalDate: null,
        autoRenew: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-test-123/resources/res-test-456",
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(request, context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.success).toBe(true);
      expect(json.data.id).toBe("res-test-456");
    });
  });
});
