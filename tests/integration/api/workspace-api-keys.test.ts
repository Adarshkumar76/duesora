import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/workspaces/[workspaceId]/api-keys/route";
import { DELETE } from "@/app/api/workspaces/[workspaceId]/api-keys/[keyId]/route";
import { auth } from "@/auth";
import {
  listWorkspaceApiKeys,
  createWorkspaceApiKey,
  revokeWorkspaceApiKey,
  validateBearerApiKey,
  hashApiKey,
  generateRawApiKey,
} from "@/lib/auth/api-key";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth/api-key", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/api-key")>();
  return {
    ...actual,
    listWorkspaceApiKeys: vi.fn(),
    createWorkspaceApiKey: vi.fn(),
    revokeWorkspaceApiKey: vi.fn(),
  };
});

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

describe("API: Workspace Developer API Keys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/workspaces/[workspaceId]/api-keys", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const req = new NextRequest("http://localhost/api/workspaces/ws-1/api-keys");
      const res = await GET(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });

      expect(res.status).toBe(401);
    });

    it("returns 200 with list of keys when authorized", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "u-1" } } as never);
      vi.mocked(listWorkspaceApiKeys).mockResolvedValue([
        {
          id: "k-1",
          name: "Deploy Key",
          keyPrefix: "due_live_1234",
          permissions: "read",
          lastUsedAt: null,
          expiresAt: null,
          createdAt: new Date(),
        },
      ]);

      const req = new NextRequest("http://localhost/api/workspaces/ws-1/api-keys");
      const res = await GET(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].name).toBe("Deploy Key");
    });
  });

  describe("POST /api/workspaces/[workspaceId]/api-keys", () => {
    it("returns 400 when name is missing", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "u-1" } } as never);

      const req = new NextRequest("http://localhost/api/workspaces/ws-1/api-keys", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      });
      const res = await POST(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });

      expect(res.status).toBe(400);
    });

    it("returns 201 with generated raw key", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "u-1" } } as never);
      vi.mocked(createWorkspaceApiKey).mockResolvedValue({
        id: "k-new",
        name: "CI Key",
        keyPrefix: "due_live_abcd",
        permissions: "read_write",
        lastUsedAt: null,
        expiresAt: null,
        createdAt: new Date(),
        rawKey: "due_live_abcdef1234567890",
      });

      const req = new NextRequest("http://localhost/api/workspaces/ws-1/api-keys", {
        method: "POST",
        body: JSON.stringify({ name: "CI Key", permissions: "read_write" }),
      });
      const res = await POST(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data.rawKey).toContain("due_live_");
    });
  });

  describe("DELETE /api/workspaces/[workspaceId]/api-keys/[keyId]", () => {
    it("returns 200 and revokes key", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "u-1" } } as never);
      vi.mocked(revokeWorkspaceApiKey).mockResolvedValue(true);

      const req = new NextRequest("http://localhost/api/workspaces/ws-1/api-keys/k-1", {
        method: "DELETE",
      });
      const res = await DELETE(req, {
        params: Promise.resolve({ workspaceId: "ws-1", keyId: "k-1" }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(revokeWorkspaceApiKey).toHaveBeenCalledWith("u-1", "ws-1", "k-1");
    });
  });

  describe("validateBearerApiKey", () => {
    it("rejects token without proper prefix", async () => {
      const result = await validateBearerApiKey("invalid_prefix_token");
      expect(result).toBeNull();
    });

    it("generates deterministic SHA-256 hash and proper key prefix", () => {
      const { rawKey, prefix, hash } = generateRawApiKey();
      expect(rawKey.startsWith("due_live_")).toBe(true);
      expect(prefix.startsWith("due_live_")).toBe(true);
      expect(hashApiKey(rawKey)).toBe(hash);
    });
  });
});
