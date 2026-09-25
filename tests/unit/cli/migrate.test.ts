import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "node:path";
import { runDatabaseMigrations } from "@/cli/migrate";
import * as migrator from "drizzle-orm/postgres-js/migrator";
import * as dbModule from "@/db";

vi.mock("drizzle-orm/postgres-js/migrator", () => ({
  migrate: vi.fn(),
}));

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

describe("CLI Database Migrations (duesora migrate)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails gracefully if migrations folder does not exist", async () => {
    const invalidPath = path.resolve(process.cwd(), "nonexistent-folder-xyz");
    const result = await runDatabaseMigrations(invalidPath);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Migrations folder not found");
  });

  it("invokes drizzle migrate on existing migrations folder", async () => {
    const fakeDb = { dummy: true };
    vi.mocked(dbModule.getDb).mockReturnValue(fakeDb as unknown as ReturnType<typeof dbModule.getDb>);
    vi.mocked(migrator.migrate).mockResolvedValue(undefined as unknown as void);

    const validFolder = path.resolve(process.cwd(), "drizzle");
    const result = await runDatabaseMigrations(validFolder);

    expect(result.success).toBe(true);
    expect(migrator.migrate).toHaveBeenCalledWith(fakeDb, {
      migrationsFolder: validFolder,
    });
  });

  it("captures migration failure errors and returns failure result", async () => {
    const fakeDb = { dummy: true };
    vi.mocked(dbModule.getDb).mockReturnValue(fakeDb as unknown as ReturnType<typeof dbModule.getDb>);
    vi.mocked(migrator.migrate).mockRejectedValue(new Error("Connection refused: 5432"));

    const validFolder = path.resolve(process.cwd(), "drizzle");
    const result = await runDatabaseMigrations(validFolder);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Connection refused: 5432");
  });
});
