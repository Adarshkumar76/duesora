import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  GET,
  POST,
  DELETE,
} from "@/app/api/workspaces/[workspaceId]/resources/[resourceId]/dependencies/route";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import {
  listResourceDependencies,
  addResourceDependency,
  removeResourceDependency,
} from "@/lib/resources/dependencies";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/lib/resources/dependencies", () => ({
  listResourceDependencies: vi.fn(),
  addResourceDependency: vi.fn(),
  removeResourceDependency: vi.fn(),
}));

describe("API: /api/workspaces/[workspaceId]/resources/[resourceId]/dependencies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const req = new NextRequest("http://localhost/api/workspaces/ws-1/resources/res-1/dependencies");
      const res = await GET(req, {
        params: Promise.resolve({ workspaceId: "ws-1", resourceId: "res-1" }),
      });

      expect(res.status).toBe(401);
    });

    it("returns 200 with upstream and downstream dependencies", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "u-1" } } as never);
      vi.mocked(requireWorkspaceRole).mockResolvedValue(undefined as never);
      vi.mocked(listResourceDependencies).mockResolvedValue({
        dependsOn: [
          {
            id: "dep-1",
            resourceId: "res-1",
            dependsOnResourceId: "res-2",
            notes: "Registrar for domain",
            createdAt: new Date(),
          },
        ],
        dependents: [],
      });

      const req = new NextRequest("http://localhost/api/workspaces/ws-1/resources/res-1/dependencies");
      const res = await GET(req, {
        params: Promise.resolve({ workspaceId: "ws-1", resourceId: "res-1" }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.dependsOn).toHaveLength(1);
      expect(listResourceDependencies).toHaveBeenCalledWith("ws-1", "res-1");
    });
  });

  describe("POST", () => {
    it("returns 400 when payload is invalid (invalid uuid)", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "u-1" } } as never);

      const req = new NextRequest("http://localhost/api/workspaces/ws-1/resources/res-1/dependencies", {
        method: "POST",
        body: JSON.stringify({ dependsOnResourceId: "not-a-uuid" }),
      });
      const res = await POST(req, {
        params: Promise.resolve({ workspaceId: "ws-1", resourceId: "res-1" }),
      });

      expect(res.status).toBe(400);
    });

    it("returns 201 when dependency is successfully created", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "u-1" } } as never);
      vi.mocked(addResourceDependency).mockResolvedValue({
        id: "dep-new",
        resourceId: "550e8400-e29b-41d4-a716-446655440000",
        dependsOnResourceId: "550e8400-e29b-41d4-a716-446655440001",
        notes: "Primary Ingress",
        createdAt: new Date(),
      });

      const req = new NextRequest("http://localhost/api/workspaces/ws-1/resources/550e8400-e29b-41d4-a716-446655440000/dependencies", {
        method: "POST",
        body: JSON.stringify({
          dependsOnResourceId: "550e8400-e29b-41d4-a716-446655440001",
          notes: "Primary Ingress",
        }),
      });
      const res = await POST(req, {
        params: Promise.resolve({
          workspaceId: "ws-1",
          resourceId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data.id).toBe("dep-new");
    });
  });

  describe("DELETE", () => {
    it("returns 400 when dependencyId query parameter is missing", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "u-1" } } as never);

      const req = new NextRequest("http://localhost/api/workspaces/ws-1/resources/res-1/dependencies", {
        method: "DELETE",
      });
      const res = await DELETE(req, {
        params: Promise.resolve({ workspaceId: "ws-1", resourceId: "res-1" }),
      });

      expect(res.status).toBe(400);
    });

    it("returns 200 when dependency is deleted", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "u-1" } } as never);
      vi.mocked(removeResourceDependency).mockResolvedValue(true);

      const req = new NextRequest("http://localhost/api/workspaces/ws-1/resources/res-1/dependencies?dependencyId=dep-123", {
        method: "DELETE",
      });
      const res = await DELETE(req, {
        params: Promise.resolve({ workspaceId: "ws-1", resourceId: "res-1" }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(removeResourceDependency).toHaveBeenCalledWith("u-1", "ws-1", "dep-123");
    });
  });
});
