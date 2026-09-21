import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/workspaces/[workspaceId]/tags/route";
import { auth } from "@/auth";
import {
  listWorkspaceTags,
  createWorkspaceTag,
} from "@/lib/tags/service";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/tags/service", () => ({
  listWorkspaceTags: vi.fn(),
  createWorkspaceTag: vi.fn(),
}));

describe("API: /api/workspaces/[workspaceId]/tags Route Authorization", () => {
  const context = {
    params: Promise.resolve({ workspaceId: "ws-test-123" }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET Handler", () => {
    it("returns 401 UNAUTHORIZED when no active session", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-123/tags");
      const response = await GET(request, context);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(listWorkspaceTags).not.toHaveBeenCalled();
    });

    it("returns 403 FORBIDDEN when user lacks access to workspace", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-unauthorized" },
      } as never);

      vi.mocked(listWorkspaceTags).mockRejectedValue(new Error("FORBIDDEN"));

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-123/tags");
      const response = await GET(request, context);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("returns 200 OK with tags list when authorized", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-authorized" },
      } as never);

      const mockTags = [
        {
          id: "tag-1",
          workspaceId: "ws-test-123",
          name: "prod",
          colorToken: "emerald",
          resourceCount: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(listWorkspaceTags).mockResolvedValue(mockTags);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-123/tags");
      const response = await GET(request, context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].name).toBe("prod");
      expect(listWorkspaceTags).toHaveBeenCalledWith("user-authorized", "ws-test-123");
    });
  });

  describe("POST Handler", () => {
    it("returns 401 UNAUTHORIZED when no active session", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-123/tags", {
        method: "POST",
        body: JSON.stringify({ name: "dev" }),
      });
      const response = await POST(request, context);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(createWorkspaceTag).not.toHaveBeenCalled();
    });

    it("returns 400 VALIDATION_ERROR on invalid payload", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-member" },
      } as never);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-123/tags", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      });
      const response = await POST(request, context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 201 CREATED when tag is successfully created", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-member" },
      } as never);

      const createdTag = {
        id: "tag-2",
        workspaceId: "ws-test-123",
        name: "security",
        colorToken: "rose",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(createWorkspaceTag).mockResolvedValue(createdTag);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-123/tags", {
        method: "POST",
        body: JSON.stringify({ name: "security", colorToken: "rose" }),
      });
      const response = await POST(request, context);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.data.name).toBe("security");
      expect(createWorkspaceTag).toHaveBeenCalledWith(
        "user-member",
        "ws-test-123",
        "security",
        "rose"
      );
    });
  });
});
