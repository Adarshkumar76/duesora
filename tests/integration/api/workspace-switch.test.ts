import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as postSwitchWorkspace } from "@/app/api/workspaces/switch/route";
import { auth } from "@/auth";
import { getWorkspaceMembership } from "@/lib/auth/workspace";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth/workspace", () => ({
  getWorkspaceMembership: vi.fn(),
}));

describe("POST /api/workspaces/switch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const req = new NextRequest("http://localhost:3000/api/workspaces/switch", {
      method: "POST",
      body: JSON.stringify({ workspaceId: "ws-target" }),
    });

    const res = await postSwitchWorkspace(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when workspaceId is missing", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);

    const req = new NextRequest("http://localhost:3000/api/workspaces/switch", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await postSwitchWorkspace(req);
    expect(res.status).toBe(400);
  });

  it("returns 403 when user is not a member of the target workspace", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    vi.mocked(getWorkspaceMembership).mockResolvedValue(null as never);

    const req = new NextRequest("http://localhost:3000/api/workspaces/switch", {
      method: "POST",
      body: JSON.stringify({ workspaceId: "ws-unauthorized" }),
    });

    const res = await postSwitchWorkspace(req);
    expect(res.status).toBe(403);
  });

  it("returns 200 and sets duesora_active_workspace cookie when valid member", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    vi.mocked(getWorkspaceMembership).mockResolvedValue({
      id: "mem-1",
      workspaceId: "ws-target",
      userId: "user-1",
      role: "member",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = new NextRequest("http://localhost:3000/api/workspaces/switch", {
      method: "POST",
      body: JSON.stringify({ workspaceId: "ws-target" }),
    });

    const res = await postSwitchWorkspace(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.success).toBe(true);
    expect(json.data.workspaceId).toBe("ws-target");

    const cookie = res.cookies.get("duesora_active_workspace");
    expect(cookie?.value).toBe("ws-target");
  });
});
