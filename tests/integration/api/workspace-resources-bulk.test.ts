import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/workspaces/[workspaceId]/resources/bulk/route";
import { auth } from "@/auth";
import { bulkPerformResourceAction } from "@/lib/resources/bulk";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/resources/bulk", () => ({
  bulkPerformResourceAction: vi.fn(),
}));

describe("API: /api/workspaces/[workspaceId]/resources/bulk Route", () => {
  const context = {
    params: Promise.resolve({ workspaceId: "4adbf433-d1f8-410a-8bf8-d653df372fbf" }),
  };

  const validUuid1 = "4adbf433-d1f8-410a-8bf8-d653df372fb1";
  const validUuid2 = "4adbf433-d1f8-410a-8bf8-d653df372fb2";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 UNAUTHORIZED when there is no active session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const request = new NextRequest(
      "http://localhost:3000/api/workspaces/4adbf433-d1f8-410a-8bf8-d653df372fbf/resources/bulk",
      {
        method: "POST",
        body: JSON.stringify({
          action: "bulk_status",
          resourceIds: [validUuid1],
          status: "active",
        }),
      }
    );

    const response = await POST(request, context);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(bulkPerformResourceAction).not.toHaveBeenCalled();
  });

  it("returns 400 VALIDATION_ERROR when request body schema is invalid", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never);

    const request = new NextRequest(
      "http://localhost:3000/api/workspaces/4adbf433-d1f8-410a-8bf8-d653df372fbf/resources/bulk",
      {
        method: "POST",
        body: JSON.stringify({
          action: "invalid_action",
          resourceIds: [],
        }),
      }
    );

    const response = await POST(request, context);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 403 FORBIDDEN when user does not have permission in target workspace", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-viewer" },
    } as never);

    vi.mocked(bulkPerformResourceAction).mockRejectedValue(new Error("FORBIDDEN"));

    const request = new NextRequest(
      "http://localhost:3000/api/workspaces/4adbf433-d1f8-410a-8bf8-d653df372fbf/resources/bulk",
      {
        method: "POST",
        body: JSON.stringify({
          action: "bulk_status",
          resourceIds: [validUuid1],
          status: "expired",
        }),
      }
    );

    const response = await POST(request, context);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("returns 200 OK with action summary when bulk action succeeds", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-admin" },
    } as never);

    vi.mocked(bulkPerformResourceAction).mockResolvedValue({
      success: true,
      action: "bulk_status",
      affectedCount: 2,
      affectedIds: [validUuid1, validUuid2],
      message: "Updated status to active for 2 resources.",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/workspaces/4adbf433-d1f8-410a-8bf8-d653df372fbf/resources/bulk",
      {
        method: "POST",
        body: JSON.stringify({
          action: "bulk_status",
          resourceIds: [validUuid1, validUuid2],
          status: "active",
        }),
      }
    );

    const response = await POST(request, context);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.success).toBe(true);
    expect(json.data.affectedCount).toBe(2);
    expect(bulkPerformResourceAction).toHaveBeenCalledWith(
      "user-admin",
      "4adbf433-d1f8-410a-8bf8-d653df372fbf",
      {
        action: "bulk_status",
        resourceIds: [validUuid1, validUuid2],
        status: "active",
      }
    );
  });
});
