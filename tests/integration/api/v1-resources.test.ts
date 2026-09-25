import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getResources, POST as postResource } from "@/app/api/v1/resources/route";
import { GET as getSingle, PATCH as patchSingle, DELETE as deleteSingle } from "@/app/api/v1/resources/[id]/route";
import * as authApiKey from "@/lib/auth/api-key";
import * as repo from "@/lib/resources/repository";

vi.mock("@/lib/auth/api-key", () => ({
  validateBearerApiKey: vi.fn(),
  hashApiKey: vi.fn(),
}));

vi.mock("@/lib/resources/repository", () => ({
  listResources: vi.fn(),
  createResource: vi.fn(),
  getResourceById: vi.fn(),
  updateResource: vi.fn(),
  deleteResource: vi.fn(),
}));

vi.mock("@/lib/audit/service", () => ({
  recordAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/webhooks/dispatcher", () => ({
  emitWorkspaceWebhook: vi.fn().mockResolvedValue(undefined),
}));

describe("API v1: /api/v1/resources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if missing Authorization header", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/resources");
    const res = await getResources(req);
    expect(res.status).toBe(401);
  });

  it("lists resources with Bearer token authentication", async () => {
    vi.mocked(authApiKey.validateBearerApiKey).mockResolvedValue({
      workspaceId: "ws_123",
      userId: "u_1",
      permissions: "read",
    });

    vi.mocked(repo.listResources).mockResolvedValue({
      items: [
        {
          id: "r1",
          name: "GitHub",
          type: "subscription",
          status: "active",
        } as unknown as Awaited<ReturnType<typeof repo.listResources>>["items"][0],
      ],
      pagination: {
        total: 1,
        page: 1,
        pageSize: 50,
        totalPages: 1,
      },
    });

    const req = new NextRequest("http://localhost:3000/api/v1/resources", {
      headers: { Authorization: "Bearer due_live_validtoken123" },
    });

    const res = await getResources(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.length).toBe(1);
    expect(json.data[0].name).toBe("GitHub");
    expect(json.meta.totalCount).toBe(1);
  });

  it("creates a resource when API key has write permissions", async () => {
    vi.mocked(authApiKey.validateBearerApiKey).mockResolvedValue({
      workspaceId: "ws_123",
      userId: "u_1",
      permissions: "write",
    });

    vi.mocked(repo.createResource).mockResolvedValue({
      id: "r_created_99",
      name: "Slack Enterprise",
      type: "subscription",
      amountMinor: 12500,
    } as unknown as Awaited<ReturnType<typeof repo.createResource>>);

    const req = new NextRequest("http://localhost:3000/api/v1/resources", {
      method: "POST",
      headers: {
        Authorization: "Bearer due_live_validtoken123",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Slack Enterprise",
        type: "subscription",
        amountMinor: 12500,
      }),
    });

    const res = await postResource(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.id).toBe("r_created_99");
  });

  it("rejects POST if API key only has read permissions", async () => {
    vi.mocked(authApiKey.validateBearerApiKey).mockResolvedValue({
      workspaceId: "ws_123",
      userId: "u_1",
      permissions: "read",
    });

    const req = new NextRequest("http://localhost:3000/api/v1/resources", {
      method: "POST",
      headers: {
        Authorization: "Bearer due_live_readonlytoken",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "AWS", type: "subscription" }),
    });

    const res = await postResource(req);
    expect(res.status).toBe(403);
  });

  it("retrieves, updates, and deletes resource via /api/v1/resources/[id]", async () => {
    vi.mocked(authApiKey.validateBearerApiKey).mockResolvedValue({
      workspaceId: "ws_123",
      userId: "u_1",
      permissions: "admin",
    });

    vi.mocked(repo.getResourceById).mockResolvedValue({
      id: "res_abc",
      name: "AWS",
    } as unknown as Awaited<ReturnType<typeof repo.getResourceById>>);
    vi.mocked(repo.updateResource).mockResolvedValue({
      id: "res_abc",
      name: "AWS Updated",
    } as unknown as Awaited<ReturnType<typeof repo.updateResource>>);
    vi.mocked(repo.deleteResource).mockResolvedValue({
      id: "res_abc",
    } as unknown as Awaited<ReturnType<typeof repo.deleteResource>>);

    const reqGet = new NextRequest("http://localhost:3000/api/v1/resources/res_abc", {
      headers: { Authorization: "Bearer due_live_admintoken" },
    });
    const resGet = await getSingle(reqGet, { params: Promise.resolve({ id: "res_abc" }) });
    expect(resGet.status).toBe(200);

    const reqPatch = new NextRequest("http://localhost:3000/api/v1/resources/res_abc", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer due_live_admintoken",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "AWS Updated" }),
    });
    const resPatch = await patchSingle(reqPatch, { params: Promise.resolve({ id: "res_abc" }) });
    expect(resPatch.status).toBe(200);
    const jsonPatch = await resPatch.json();
    expect(jsonPatch.data.name).toBe("AWS Updated");

    const reqDelete = new NextRequest("http://localhost:3000/api/v1/resources/res_abc", {
      method: "DELETE",
      headers: { Authorization: "Bearer due_live_admintoken" },
    });
    const resDelete = await deleteSingle(reqDelete, { params: Promise.resolve({ id: "res_abc" }) });
    expect(resDelete.status).toBe(200);
    const jsonDelete = await resDelete.json();
    expect(jsonDelete.success).toBe(true);
  });
});
