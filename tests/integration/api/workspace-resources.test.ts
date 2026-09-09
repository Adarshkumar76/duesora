import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/workspaces/[workspaceId]/resources/route";
import { auth } from "@/auth";
import {
  listWorkspaceResources,
  createWorkspaceResource,
} from "@/lib/resources/service";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/resources/service", () => ({
  listWorkspaceResources: vi.fn(),
  createWorkspaceResource: vi.fn(),
}));

describe("API: /api/workspaces/[workspaceId]/resources Route Authorization", () => {
  const context = {
    params: Promise.resolve({ workspaceId: "ws-test-123" }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET Handler", () => {
    it("returns 401 UNAUTHORIZED when there is no active session", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-123/resources");
      const response = await GET(request, context);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(listWorkspaceResources).not.toHaveBeenCalled();
    });

    it("returns 403 FORBIDDEN when user does not have permission in target workspace", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-unauthorized" },
      } as never);

      vi.mocked(listWorkspaceResources).mockRejectedValue(new Error("FORBIDDEN"));

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-123/resources");
      const response = await GET(request, context);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("returns 200 OK with resource list when user is authorized", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-authorized" },
      } as never);

      const mockData = {
        items: [
          {
            id: "res-1",
            workspaceId: "ws-test-123",
            name: "example.org",
            type: "domain" as const,
            status: "active" as const,
            description: null,
            provider: null,
            websiteUrl: null,
            amountMinor: null,
            currency: "USD",
            billingCycle: "yearly" as const,
            renewalDate: null,
            autoRenew: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      };

      vi.mocked(listWorkspaceResources).mockResolvedValue(mockData as never);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-123/resources");
      const response = await GET(request, context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.items).toHaveLength(1);
      expect(listWorkspaceResources).toHaveBeenCalledWith(
        "user-authorized",
        "ws-test-123",
        expect.objectContaining({
          page: 1,
          pageSize: 20,
        }),
      );
    });
  });

  describe("POST Handler", () => {
    it("returns 401 UNAUTHORIZED when no session exists on POST", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-123/resources", {
        method: "POST",
        body: JSON.stringify({ name: "test", type: "domain" }),
      });

      const response = await POST(request, context);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(createWorkspaceResource).not.toHaveBeenCalled();
    });

    it("returns 403 FORBIDDEN when user has insufficient role to create resources", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-viewer" },
      } as never);

      vi.mocked(createWorkspaceResource).mockRejectedValue(new Error("FORBIDDEN"));

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-123/resources", {
        method: "POST",
        body: JSON.stringify({ name: "test.com", type: "domain" }),
      });

      const response = await POST(request, context);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("returns 201 CREATED when resource creation is authorized", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-member" },
      } as never);

      const created = {
        id: "res-new-1",
        workspaceId: "ws-test-123",
        name: "test.com",
        type: "domain" as const,
        status: "active" as const,
        description: null,
        provider: null,
        websiteUrl: null,
        amountMinor: null,
        currency: "USD",
        billingCycle: "yearly" as const,
        renewalDate: null,
        autoRenew: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(createWorkspaceResource).mockResolvedValue(created);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-123/resources", {
        method: "POST",
        body: JSON.stringify({ name: "test.com", type: "domain" }),
      });

      const response = await POST(request, context);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.data.name).toBe("test.com");
    });
  });
});
