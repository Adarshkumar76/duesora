import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveActiveWorkspace, ACTIVE_WORKSPACE_COOKIE } from "@/lib/auth/active-workspace";
import { listUserWorkspaces } from "@/lib/auth/workspace";
import { cookies } from "next/headers";

vi.mock("@/lib/auth/workspace", () => ({
  listUserWorkspaces: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("resolveActiveWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns fallback personal workspace when user has no workspaces", async () => {
    vi.mocked(listUserWorkspaces).mockResolvedValue([]);
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as never);

    const result = await resolveActiveWorkspace("user-1", "session-ws");
    expect(result.activeWorkspace.id).toBe("session-ws");
    expect(result.activeWorkspace.role).toBe("owner");
    expect(result.userWorkspaces).toHaveLength(1);
  });

  it("resolves active workspace from cookie when matching membership exists", async () => {
    vi.mocked(listUserWorkspaces).mockResolvedValue([
      {
        id: "ws-personal",
        name: "Personal",
        slug: "personal",
        type: "personal",
        defaultCurrency: "USD",
        timezone: "UTC",
        role: "owner",
        joinedAt: new Date(),
      },
      {
        id: "ws-invited",
        name: "Acme Corp",
        slug: "acme-corp",
        type: "organization",
        defaultCurrency: "USD",
        timezone: "UTC",
        role: "admin",
        joinedAt: new Date(),
      },
    ]);

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn((name) => (name === ACTIVE_WORKSPACE_COOKIE ? { value: "ws-invited" } : undefined)),
    } as never);

    const result = await resolveActiveWorkspace("user-1", "ws-personal");
    expect(result.activeWorkspace.id).toBe("ws-invited");
    expect(result.activeWorkspace.name).toBe("Acme Corp");
    expect(result.activeWorkspace.role).toBe("admin");
  });

  it("falls back to session workspace if cookie is missing or invalid", async () => {
    vi.mocked(listUserWorkspaces).mockResolvedValue([
      {
        id: "ws-personal",
        name: "Personal",
        slug: "personal",
        type: "personal",
        defaultCurrency: "USD",
        timezone: "UTC",
        role: "owner",
        joinedAt: new Date(),
      },
      {
        id: "ws-team",
        name: "Team",
        slug: "team",
        type: "organization",
        defaultCurrency: "USD",
        timezone: "UTC",
        role: "member",
        joinedAt: new Date(),
      },
    ]);

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as never);

    const result = await resolveActiveWorkspace("user-1", "ws-team");
    expect(result.activeWorkspace.id).toBe("ws-team");
    expect(result.activeWorkspace.name).toBe("Team");
  });

  it("falls back to first membership if neither cookie nor session workspace matches", async () => {
    vi.mocked(listUserWorkspaces).mockResolvedValue([
      {
        id: "ws-first",
        name: "First Workspace",
        slug: "first",
        type: "personal",
        defaultCurrency: "USD",
        timezone: "UTC",
        role: "member",
        joinedAt: new Date(),
      },
    ]);

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as never);

    const result = await resolveActiveWorkspace("user-1", "ws-nonexistent");
    expect(result.activeWorkspace.id).toBe("ws-first");
    expect(result.activeWorkspace.name).toBe("First Workspace");
  });
});
