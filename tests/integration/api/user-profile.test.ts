import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PATCH } from "@/app/api/user/profile/route";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { verifyPassword, hashPassword } from "@/lib/auth/password";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

vi.mock("@/lib/auth/password", () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
}));

describe("API: /api/user/profile (PATCH)", () => {
  const mockUser = {
    id: "user-123",
    name: "Original Name",
    email: "test@example.com",
    passwordHash: "existing-hash",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const req = new NextRequest("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name" }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when input validation fails", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as never);

    const req = new NextRequest("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "" }), // empty string fails min(1)
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it("updates user display name successfully", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as never);

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockUser]),
        }),
      }),
    });

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: "user-123", name: "Updated Name", email: "test@example.com" },
          ]),
        }),
      }),
    });

    vi.mocked(getDb).mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    } as never);

    const req = new NextRequest("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "Updated Name" }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.name).toBe("Updated Name");
  });

  it("fails password change if current password is wrong", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as never);

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockUser]),
        }),
      }),
    });

    vi.mocked(getDb).mockReturnValue({
      select: mockSelect,
    } as never);

    vi.mocked(verifyPassword).mockResolvedValue(false);

    const req = new NextRequest("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({
        currentPassword: "wrong-password",
        newPassword: "super-secure-password-123",
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toContain("current password");
  });

  it("changes password successfully when current password matches", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as never);

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockUser]),
        }),
      }),
    });

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: "user-123", name: "Original Name", email: "test@example.com" },
          ]),
        }),
      }),
    });

    vi.mocked(getDb).mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    } as never);

    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(hashPassword).mockResolvedValue("newly-hashed-password");

    const req = new NextRequest("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({
        currentPassword: "correct-password",
        newPassword: "super-secure-password-123",
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain("password updated");
  });
});
