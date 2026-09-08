import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createWorkspaceResource,
  getWorkspaceResource,
  listWorkspaceResources,
} from "@/lib/resources/service";
import { createResource, getResourceById, listResources } from "@/lib/resources/repository";
import { requireWorkspaceRole } from "@/lib/auth/workspace";

vi.mock("@/lib/resources/repository", () => ({
  createResource: vi.fn(),
  getResourceById: vi.fn(),
  listResources: vi.fn(),
}));

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

describe("resource service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows a viewer to list workspace resources", async () => {
    vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);
    vi.mocked(listResources).mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });

    await listWorkspaceResources("user-1", "workspace-1");

    expect(requireWorkspaceRole).toHaveBeenCalledWith(
      "user-1",
      "workspace-1",
      "viewer",
    );

    expect(listResources).toHaveBeenCalledWith("workspace-1");
  });

  it("requires member role when creating a resource", async () => {
    vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

    const input = {
      workspaceId: "workspace-1",
      name: "example.com",
      type: "domain" as const,
    };

    await createWorkspaceResource("user-1", input);

    expect(requireWorkspaceRole).toHaveBeenCalledWith(
      "user-1",
      "workspace-1",
      "member",
    );

    expect(createResource).toHaveBeenCalledWith(input);
  });

  it("does not create a resource when workspace access is denied", async () => {
    vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

    const input = {
      workspaceId: "workspace-2",
      name: "example.com",
      type: "domain" as const,
    };

    await expect(createWorkspaceResource("user-1", input)).rejects.toThrow(
      "FORBIDDEN",
    );

    expect(createResource).not.toHaveBeenCalled();
  });

  it("checks workspace membership before returning a resource", async () => {
    vi.mocked(requireWorkspaceRole).mockResolvedValue({
      id: "membership-1",
      workspaceId: "workspace-1",
      userId: "user-1",
      role: "viewer",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(getResourceById).mockResolvedValue({
      id: "resource-1",
      workspaceId: "workspace-1",
      name: "example.com",
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

    const result = await getWorkspaceResource(
      "user-1",
      "workspace-1",
      "resource-1",
    );

    expect(requireWorkspaceRole).toHaveBeenCalledWith(
      "user-1",
      "workspace-1",
      "viewer",
    );

    expect(getResourceById).toHaveBeenCalledWith("workspace-1", "resource-1");

    expect(result?.id).toBe("resource-1");
  });

  it("does not query the resource when workspace access is denied", async () => {
    vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

    await expect(
      getWorkspaceResource("user-1", "workspace-2", "resource-1"),
    ).rejects.toThrow("FORBIDDEN");

    expect(getResourceById).not.toHaveBeenCalled();
  });

  it("does not list resources when workspace access is denied", async () => {
    vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

    await expect(
      listWorkspaceResources("user-1", "workspace-2"),
    ).rejects.toThrow("FORBIDDEN");

    expect(listResources).not.toHaveBeenCalled();
  });
});
