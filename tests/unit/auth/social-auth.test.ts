import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleSocialSignIn, generateSlug } from "@/lib/auth/social";
import { getDb } from "@/db";

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

describe("Social Auth: Auto-Provisioning & Linking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateSlug", () => {
    it("generates a clean URL slug from user name with random suffix", () => {
      const slug = generateSlug("Jane Doe");
      expect(slug).toMatch(/^jane-doe-[a-z0-9]{6}$/);
    });

    it("handles fallback if name is special characters or empty", () => {
      const slug = generateSlug("!@#$%^");
      expect(slug).toMatch(/^workspace-[a-z0-9]{6}$/);
    });
  });

  describe("handleSocialSignIn", () => {
    it("creates a new user, personal workspace, and owner membership when user is new", async () => {
      const mockTx = {
        insert: vi.fn()
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: "user-new-1" }]),
            }),
          })
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: "ws-new-1" }]),
            }),
          })
          .mockReturnValueOnce({
            values: vi.fn().mockResolvedValue(undefined),
          }),
      };

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
        transaction: vi.fn().mockImplementation(async (callback) => {
          return await callback(mockTx);
        }),
      };

      vi.mocked(getDb).mockReturnValue(mockDb as never);

      const result = await handleSocialSignIn({
        provider: "github",
        email: "alex@example.com",
        name: "Alex Dev",
      });

      expect(result).toEqual({
        userId: "user-new-1",
        workspaceId: "ws-new-1",
      });
      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalledTimes(3);
    });

    it("links existing user to their existing workspace without creating duplicate records", async () => {
      const existingUser = {
        id: "user-existing-1",
        email: "existing@example.com",
        name: "Existing User",
      };

      const existingMembership = {
        workspaceId: "ws-existing-1",
      };

      const mockDb = {
        select: vi.fn()
          .mockReturnValueOnce({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([existingUser]),
              }),
            }),
          })
          .mockReturnValueOnce({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([existingMembership]),
              }),
            }),
          }),
      };

      vi.mocked(getDb).mockReturnValue(mockDb as never);

      const result = await handleSocialSignIn({
        provider: "google",
        email: "existing@example.com",
        name: "Existing User",
      });

      expect(result).toEqual({
        userId: "user-existing-1",
        workspaceId: "ws-existing-1",
      });
    });

    it("provisions a workspace if existing user somehow had no workspace", async () => {
      const existingUser = {
        id: "user-existing-no-ws",
        email: "noworkspace@example.com",
        name: "No Workspace User",
      };

      const mockDb = {
        select: vi.fn()
          .mockReturnValueOnce({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([existingUser]),
              }),
            }),
          })
          .mockReturnValueOnce({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        insert: vi.fn()
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: "ws-created-1" }]),
            }),
          })
          .mockReturnValueOnce({
            values: vi.fn().mockResolvedValue(undefined),
          }),
      };

      vi.mocked(getDb).mockReturnValue(mockDb as never);

      const result = await handleSocialSignIn({
        provider: "github",
        email: "noworkspace@example.com",
        name: "No Workspace User",
      });

      expect(result).toEqual({
        userId: "user-existing-no-ws",
        workspaceId: "ws-created-1",
      });
      expect(mockDb.insert).toHaveBeenCalledTimes(2);
    });
  });
});
