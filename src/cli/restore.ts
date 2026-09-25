import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { unpackTarGz, computeSha256 } from "./archive";
import type { BackupManifest } from "./backup";

// Order of insertion respecting foreign key relationships
export const RESTORE_TABLE_ORDER = [
  "users",
  "workspaces",
  "accounts",
  "memberships",
  "invitations",
  "tags",
  "resources",
  "resource_tags",
  "resource_monitors",
  "monitor_logs",
  "resource_cost_history",
  "resource_documents",
  "resource_dependencies",
  "api_keys",
  "workspace_budgets",
  "notifications",
  "reminder_logs",
  "webhook_endpoints",
  "webhook_deliveries",
  "workspace_notification_channels",
  "audit_logs",
  "exchange_rates",
];

export interface RestoreResult {
  archivePath: string;
  manifest: BackupManifest;
  restoredTables: Record<string, number>;
  restoredAttachments: number;
}

/**
 * Validates and restores a Duesora backup archive.
 */
export async function restoreDuesoraBackup(
  archivePath: string,
  options?: {
    dbUrl?: string;
    uploadsDir?: string;
  }
): Promise<RestoreResult> {
  const resolvedArchivePath = path.resolve(process.cwd(), archivePath);
  if (!fs.existsSync(resolvedArchivePath)) {
    throw new Error(`Backup archive not found at: ${resolvedArchivePath}`);
  }

  const archiveBuffer = fs.readFileSync(resolvedArchivePath);
  const entries = unpackTarGz(archiveBuffer);

  // 1. Locate and parse manifest.json
  const manifestEntry = entries.find((e) => e.path === "manifest.json");
  if (!manifestEntry) {
    throw new Error("Invalid archive: missing manifest.json");
  }

  const manifest: BackupManifest = JSON.parse(manifestEntry.data.toString("utf8"));

  // 2. Validate SHA-256 checksums
  for (const entry of entries) {
    if (entry.path === "manifest.json") continue;
    const expectedHash = manifest.checksums[entry.path];
    if (expectedHash) {
      const actualHash = computeSha256(entry.data);
      if (actualHash !== expectedHash) {
        throw new Error(
          `Integrity verification failed for ${entry.path}: checksum mismatch (expected ${expectedHash}, got ${actualHash})`
        );
      }
    }
  }

  // 3. Locate database.json
  const dbEntry = entries.find((e) => e.path === "database.json");
  if (!dbEntry) {
    throw new Error("Invalid archive: missing database.json");
  }

  const databaseDump: Record<string, Record<string, unknown>[]> = JSON.parse(
    dbEntry.data.toString("utf8")
  );

  const dbUrl =
    options?.dbUrl ||
    process.env.DATABASE_URL ||
    "postgresql://duesora:duesora@localhost:5432/duesora";

  const sql = postgres(dbUrl, {
    max: 2,
    connect_timeout: 10,
    idle_timeout: 2,
  });

  const restoredTables: Record<string, number> = {};

  try {
    // 4. Restore tables in transactional sequence
    await sql.begin(async (trx) => {
      // Disable triggers/constraints during bulk restore if possible, or truncate in reverse order
      const reverseOrder = [...RESTORE_TABLE_ORDER].reverse();
      for (const table of reverseOrder) {
        try {
          await trx`TRUNCATE TABLE ${trx(table)} CASCADE;`;
        } catch {
          // Table might not exist yet; ignore
        }
      }

      // Insert table records in forward dependency order
      for (const tableName of RESTORE_TABLE_ORDER) {
        const rows = databaseDump[tableName];
        if (Array.isArray(rows) && rows.length > 0) {
          try {
            await trx`INSERT INTO ${trx(tableName)} ${trx(rows)};`;
            restoredTables[tableName] = rows.length;
          } catch (err: unknown) {
            // If table has missing columns or error, surface detailed message
            throw new Error(
              `Failed restoring table ${tableName}: ${err instanceof Error ? err.message : String(err)}`
            );
          }
        } else {
          restoredTables[tableName] = 0;
        }
      }
    });

    // 5. Restore attachment files safely
    const uploadsDir = path.resolve(process.cwd(), options?.uploadsDir || "./uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let restoredAttachments = 0;
    const attachmentEntries = entries.filter((e) => e.path.startsWith("attachments/"));

    for (const att of attachmentEntries) {
      const relativePath = att.path.replace(/^attachments\//, "");
      const targetPath = path.resolve(uploadsDir, relativePath);

      // Path traversal security check
      if (!targetPath.startsWith(uploadsDir)) {
        throw new Error(`Suspicious attachment path detected in archive: ${relativePath}`);
      }

      const parentDir = path.dirname(targetPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      fs.writeFileSync(targetPath, att.data);
      restoredAttachments++;
    }

    return {
      archivePath: resolvedArchivePath,
      manifest,
      restoredTables,
      restoredAttachments,
    };
  } finally {
    await sql.end({ timeout: 2 }).catch(() => {});
  }
}
