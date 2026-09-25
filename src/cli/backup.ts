import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { packTarGz, computeSha256, ArchiveFileEntry } from "./archive";

export const DUESORA_BACKUP_TABLES = [
  "workspaces",
  "users",
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

export interface BackupManifest {
  version: "1.0";
  duesoraVersion: string;
  createdAt: string;
  tableCounts: Record<string, number>;
  totalRecords: number;
  attachmentCount: number;
  checksums: Record<string, string>;
}

export interface BackupResult {
  outputPath: string;
  fileSizeBytes: number;
  manifest: BackupManifest;
}

/**
 * Collects attachments from uploads directory recursively.
 */
function collectAttachments(uploadsDir: string): { relativePath: string; fullPath: string }[] {
  const results: { relativePath: string; fullPath: string }[] = [];
  if (!fs.existsSync(uploadsDir)) return results;

  function traverse(dir: string, baseDir: string) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        traverse(fullPath, baseDir);
      } else if (item.isFile() && !item.name.startsWith(".")) {
        const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
        results.push({ relativePath, fullPath });
      }
    }
  }

  traverse(uploadsDir, uploadsDir);
  return results;
}

/**
 * Creates a complete snapshot backup of Duesora database and attachments.
 */
export async function createDuesoraBackup(options?: {
  dbUrl?: string;
  uploadsDir?: string;
  outputFilePath?: string;
}): Promise<BackupResult> {
  const dbUrl =
    options?.dbUrl ||
    process.env.DATABASE_URL ||
    "postgresql://duesora:duesora@localhost:5432/duesora";

  const uploadsDir = path.resolve(process.cwd(), options?.uploadsDir || "./uploads");
  const entries: ArchiveFileEntry[] = [];
  const checksums: Record<string, string> = {};
  const tableCounts: Record<string, number> = {};
  let totalRecords = 0;

  const sql = postgres(dbUrl, {
    max: 2,
    connect_timeout: 10,
    idle_timeout: 2,
  });

  try {
    const databaseDump: Record<string, unknown[]> = {};

    for (const tableName of DUESORA_BACKUP_TABLES) {
      try {
        // Query all rows from table
        const rows = await sql`SELECT * FROM ${sql(tableName)}`;
        databaseDump[tableName] = rows;
        tableCounts[tableName] = rows.length;
        totalRecords += rows.length;
      } catch (_err: unknown) {
        // If table doesn't exist yet, record empty array
        databaseDump[tableName] = [];
        tableCounts[tableName] = 0;
      }
    }

    // Add database.json to archive entries
    const dbJsonBuffer = Buffer.from(JSON.stringify(databaseDump, null, 2), "utf8");
    checksums["database.json"] = computeSha256(dbJsonBuffer);
    entries.push({
      path: "database.json",
      data: dbJsonBuffer,
    });

    // Add attachments to archive entries
    const attachments = collectAttachments(uploadsDir);
    for (const att of attachments) {
      const data = fs.readFileSync(att.fullPath);
      const archivePath = `attachments/${att.relativePath}`;
      checksums[archivePath] = computeSha256(data);
      entries.push({
        path: archivePath,
        data,
      });
    }

    // Create manifest
    const manifest: BackupManifest = {
      version: "1.0",
      duesoraVersion: "0.1.0",
      createdAt: new Date().toISOString(),
      tableCounts,
      totalRecords,
      attachmentCount: attachments.length,
      checksums,
    };

    const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), "utf8");
    entries.unshift({
      path: "manifest.json",
      data: manifestBuffer,
    });

    // Compress to .tar.gz
    const compressedArchive = packTarGz(entries);

    // Determine output file path
    let targetPath = options?.outputFilePath;
    if (!targetPath) {
      const backupsDir = path.resolve(process.cwd(), "./backups");
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      targetPath = path.join(backupsDir, `duesora-backup-${timestamp}.tar.gz`);
    }

    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.writeFileSync(targetPath, compressedArchive);

    return {
      outputPath: targetPath,
      fileSizeBytes: compressedArchive.length,
      manifest,
    };
  } finally {
    await sql.end({ timeout: 2 }).catch(() => {});
  }
}
