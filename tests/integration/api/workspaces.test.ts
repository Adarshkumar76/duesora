import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/workspaces/route";
import { auth } from "@/auth";
import { listUserWorkspaces } from "@/lib/auth/workspace";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth/workspace", () => ({
  listUserWorkspaces: vi.fn(),
}));

describe("API: /api/workspaces Route Authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 UNAUTHORIZED when no session exists", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(listUserWorkspaces).not.toHaveBeenCalled();
  });

  it("returns 200 OK with user workspaces when authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as never);

    const mockWorkspaces = [
      {
        id: "ws-1",
        name: "Personal Workspace",
        slug: "personal-ws",
        type: "personal",
        defaultCurrency: "INR",
        timezone: "Asia/Kolkata",
        role: "owner",
        joinedAt: new Date(),
      },
    ];

    vi.mocked(listUserWorkspaces).mockResolvedValue(mockWorkspaces as never);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data[0].id).toBe("ws-1");
    expect(json.data[0].name).toBe("Personal Workspace");
    expect(json.data[0].role).toBe("owner");
    expect(listUserWorkspaces).toHaveBeenCalledWith("user-123");
  });
});
