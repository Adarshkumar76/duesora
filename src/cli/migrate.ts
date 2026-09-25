import path from "node:path";
import fs from "node:fs";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getDb } from "@/db";

export interface MigrationResult {
  success: boolean;
  migrationsFolder: string;
  error?: string;
}

export async function runDatabaseMigrations(customFolder?: string): Promise<MigrationResult> {
  const migrationsFolder = customFolder || path.resolve(process.cwd(), "drizzle");

  if (!fs.existsSync(migrationsFolder)) {
    return {
      success: false,
      migrationsFolder,
      error: `Migrations folder not found at: ${migrationsFolder}`,
    };
  }

  try {
    const db = getDb();
    await migrate(db, { migrationsFolder });
    return {
      success: true,
      migrationsFolder,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      migrationsFolder,
      error: message,
    };
  }
}
