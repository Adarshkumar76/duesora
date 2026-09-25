/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as discoverHandler } from "@/app/api/workspaces/[workspaceId]/integrations/discover/route";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import {
  verifyCloudflareToken,
  discoverCloudflareResources,
} from "@/lib/providers/cloudflare";
import { createWorkspaceResource } from "@/lib/resources/service";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/lib/providers/cloudflare", () => ({
  verifyCloudflareToken: vi.fn(),
  discoverCloudflareResources: vi.fn(),
}));

vi.mock("@/lib/resources/service", () => ({
  createWorkspaceResource: vi.fn(),
}));

describe("API: POST /api/workspaces/[workspaceId]/integrations/discover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/integrations/discover", {
      method: "POST",
      body: JSON.stringify({ apiToken: "token" }),
    });

    const res = await discoverHandler(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 400 if token verification fails", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(requireWorkspaceRole).mockResolvedValue(undefined as any);
    vi.mocked(verifyCloudflareToken).mockResolvedValue({
      valid: false,
      error: "Invalid API Token",
    });

    const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/integrations/discover", {
      method: "POST",
      body: JSON.stringify({
        provider: "cloudflare",
        apiToken: "bad-token",
        action: "discover",
      }),
    });

    const res = await discoverHandler(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error.code).toBe("PROVIDER_AUTH_FAILED");
  });

  it("returns discovered zones when valid", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(requireWorkspaceRole).mockResolvedValue(undefined as any);
    vi.mocked(verifyCloudflareToken).mockResolvedValue({ valid: true, status: "active" });
    vi.mocked(discoverCloudflareResources).mockResolvedValue({
      provider: "cloudflare",
      totalFound: 1,
      newCount: 1,
      alreadyTrackedCount: 0,
      items: [
        {
          externalId: "zone-1",
          name: "example.com",
          type: "domain",
          provider: "Cloudflare",
          status: "active",
          alreadyTracked: false,
          existingResourceId: null,
        },
      ],
    });

    const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/integrations/discover", {
      method: "POST",
      body: JSON.stringify({
        provider: "cloudflare",
        apiToken: "valid-token",
        action: "discover",
      }),
    });

    const res = await discoverHandler(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.totalFound).toBe(1);
    expect(json.data.items[0].name).toBe("example.com");
  });

  it("imports selected items when action is import", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(requireWorkspaceRole).mockResolvedValue(undefined as any);
    vi.mocked(verifyCloudflareToken).mockResolvedValue({ valid: true });
    vi.mocked(createWorkspaceResource).mockResolvedValue({
      id: "res-new-1",
      name: "discovered.dev",
      type: "domain",
    } as any);

    const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/integrations/discover", {
      method: "POST",
      body: JSON.stringify({
        provider: "cloudflare",
        apiToken: "valid-token",
        action: "import",
        itemsToImport: [
          {
            name: "discovered.dev",
            type: "domain",
            status: "active",
            provider: "Cloudflare",
          },
        ],
      }),
    });

    const res = await discoverHandler(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.success).toBe(true);
    expect(json.data.importedCount).toBe(1);
    expect(createWorkspaceResource).toHaveBeenCalledWith("user-1", expect.objectContaining({
      name: "discovered.dev",
      type: "domain",
    }));
  });
});
