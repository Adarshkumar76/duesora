import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createWorkspaceResource,
  getWorkspaceResource,
  listWorkspaceResources,
} from "@/lib/resources/service";
import { getResourceById, listResources, createResource } from "@/lib/resources/repository";
import { requireWorkspaceRole } from "@/lib/auth/workspace";

vi.mock("@/lib/resources/repository", () => ({
  createResource: vi.fn(),
  getResourceById: vi.fn(),
  listResources: vi.fn(),
}));

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

describe("Multi-Tenancy Workspace Isolation", () => {
  const WORKSPACE_ALPHA = "workspace-alpha-uuid";
  const WORKSPACE_BETA = "workspace-beta-uuid";

  const USER_ALPHA = "user-alpha-owner";
  const USER_BETA = "user-beta-owner";
  const USER_VIEWER_ALPHA = "user-alpha-viewer";

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock behavior simulating multi-tenant database ACL
    vi.mocked(requireWorkspaceRole).mockImplementation(
      async (userId: string, workspaceId: string, requiredRole: string) => {
        // User Alpha only has access to Workspace Alpha
        if (userId === USER_ALPHA && workspaceId === WORKSPACE_ALPHA) {
          return { id: "m-1", userId, workspaceId, role: "owner" as const, createdAt: new Date(), updatedAt: new Date() };
        }

        // User Beta only has access to Workspace Beta
        if (userId === USER_BETA && workspaceId === WORKSPACE_BETA) {
          return { id: "m-2", userId, workspaceId, role: "owner" as const, createdAt: new Date(), updatedAt: new Date() };
        }

        // User Viewer Alpha only has viewer access to Workspace Alpha
        if (userId === USER_VIEWER_ALPHA && workspaceId === WORKSPACE_ALPHA) {
          if (requiredRole !== "viewer") {
            throw new Error("FORBIDDEN");
          }
          return { id: "m-3", userId, workspaceId, role: "viewer" as const, createdAt: new Date(), updatedAt: new Date() };
        }

        // Any cross-tenant access is strictly denied
        throw new Error("FORBIDDEN");
      }
    );
  });

  describe("Cross-Tenant Read Isolation", () => {
    it("permits User Alpha to read resources in Workspace Alpha", async () => {
      const mockResources = [
        {
          id: "res-alpha-1",
          workspaceId: WORKSPACE_ALPHA,
          name: "alpha.internal",
          type: "domain" as const,
          status: "active" as const,
          description: null,
          provider: "Cloudflare",
          websiteUrl: "https://alpha.internal",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(listResources).mockResolvedValue(mockResources);

      const result = await listWorkspaceResources(USER_ALPHA, WORKSPACE_ALPHA);

      expect(result).toHaveLength(1);
      expect(result[0].workspaceId).toBe(WORKSPACE_ALPHA);
      expect(listResources).toHaveBeenCalledWith(WORKSPACE_ALPHA);
    });

    it("STRICTLY BLOCKS User Alpha from reading resources in Workspace Beta (Cross-Tenant Breach Attempt)", async () => {
      await expect(
        listWorkspaceResources(USER_ALPHA, WORKSPACE_BETA)
      ).rejects.toThrow("FORBIDDEN");

      expect(listResources).not.toHaveBeenCalled();
    });

    it("STRICTLY BLOCKS User Beta from reading resources in Workspace Alpha (Cross-Tenant Breach Attempt)", async () => {
      await expect(
        listWorkspaceResources(USER_BETA, WORKSPACE_ALPHA)
      ).rejects.toThrow("FORBIDDEN");

      expect(listResources).not.toHaveBeenCalled();
    });

    it("STRICTLY BLOCKS User Alpha from reading a specific resource in Workspace Beta by ID", async () => {
      await expect(
        getWorkspaceResource(USER_ALPHA, WORKSPACE_BETA, "res-beta-secret-key")
      ).rejects.toThrow("FORBIDDEN");

      expect(getResourceById).not.toHaveBeenCalled();
    });
  });

  describe("Cross-Tenant Mutation Isolation", () => {
    it("permits User Alpha to create resources in Workspace Alpha", async () => {
      const input = {
        workspaceId: WORKSPACE_ALPHA,
        name: "my-ssl-cert",
        type: "ssl_certificate" as const,
      };

      vi.mocked(createResource).mockResolvedValue({
        id: "res-new-1",
        status: "active" as const,
        description: null,
        provider: null,
        websiteUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...input,
      });

      const result = await createWorkspaceResource(USER_ALPHA, input);

      expect(result.workspaceId).toBe(WORKSPACE_ALPHA);
      expect(createResource).toHaveBeenCalledWith(input);
    });

    it("STRICTLY BLOCKS User Alpha from injecting resources into Workspace Beta", async () => {
      const hostileInput = {
        workspaceId: WORKSPACE_BETA,
        name: "malicious-resource",
        type: "domain" as const,
      };

      await expect(
        createWorkspaceResource(USER_ALPHA, hostileInput)
      ).rejects.toThrow("FORBIDDEN");

      expect(createResource).not.toHaveBeenCalled();
    });

    it("STRICTLY BLOCKS User Beta from injecting resources into Workspace Alpha", async () => {
      const hostileInput = {
        workspaceId: WORKSPACE_ALPHA,
        name: "malicious-resource",
        type: "domain" as const,
      };

      await expect(
        createWorkspaceResource(USER_BETA, hostileInput)
      ).rejects.toThrow("FORBIDDEN");

      expect(createResource).not.toHaveBeenCalled();
    });
  });

  describe("Intra-Tenant Privilege Escalation Prevention", () => {
    it("allows viewer in Workspace Alpha to read resources", async () => {
      vi.mocked(listResources).mockResolvedValue([]);

      const result = await listWorkspaceResources(USER_VIEWER_ALPHA, WORKSPACE_ALPHA);
      expect(result).toEqual([]);
      expect(listResources).toHaveBeenCalledWith(WORKSPACE_ALPHA);
    });

    it("blocks viewer in Workspace Alpha from creating resources (requires member or higher)", async () => {
      const input = {
        workspaceId: WORKSPACE_ALPHA,
        name: "unauthorized-resource",
        type: "subscription" as const,
      };

      await expect(
        createWorkspaceResource(USER_VIEWER_ALPHA, input)
      ).rejects.toThrow("FORBIDDEN");

      expect(createResource).not.toHaveBeenCalled();
    });
  });
});
