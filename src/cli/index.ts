import fs from "node:fs";
import dotenv from "dotenv";
import { runDoctorDiagnostics, formatDoctorCliOutput } from "./doctor";
import { createDuesoraBackup } from "./backup";
import { restoreDuesoraBackup } from "./restore";

// Load environment variables if not already set
if (fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
} else if (fs.existsSync(".env")) {
  dotenv.config({ path: ".env" });
}

function printUsage() {
  console.log(`
Duesora Operator CLI

Usage:
  duesora <command> [options]

Commands:
  doctor                Check runtime, database, redis, smtp, and storage health
  backup [options]      Create a full snapshot backup (.tar.gz) of database & files
  restore <archive>     Restore database and attachments from a backup archive

Options:
  --output, -o <file>   Specify destination file for backup
  --force, -f           Bypass safety confirmations during restore
  --help, -h            Show this help message
  --version, -v         Display Duesora version

Examples:
  duesora doctor
  duesora backup --output ./my-backup.tar.gz
  duesora restore ./backups/duesora-backup-2026-09-25.tar.gz
`);
}

export async function runCli(argv = process.argv.slice(2)): Promise<number> {
  const command = argv[0];

  if (
    !command ||
    command === "--help" ||
    command === "-h" ||
    command === "help" ||
    command === "h"
  ) {
    printUsage();
    return 0;
  }

  if (
    command === "--version" ||
    command === "-v" ||
    command === "version" ||
    command === "v"
  ) {
    console.log("Duesora CLI v0.1.0");
    return 0;
  }

  switch (command) {
    case "doctor": {
      console.log("Running Duesora diagnostics probe...\n");
      const report = await runDoctorDiagnostics();
      console.log(formatDoctorCliOutput(report));
      return report.success ? 0 : 1;
    }

    case "backup": {
      console.log("Starting Duesora full-stack snapshot backup...");
      const outputIndex = argv.findIndex((a) => a === "--output" || a === "-o");
      const outputFilePath = outputIndex !== -1 ? argv[outputIndex + 1] : undefined;

      try {
        const result = await createDuesoraBackup({ outputFilePath });
        const sizeMb = (result.fileSizeBytes / (1024 * 1024)).toFixed(2);
        console.log("\nBackup created successfully!");
        console.log(`Archive:     ${result.outputPath}`);
        console.log(`Size:        ${sizeMb} MB (${result.fileSizeBytes} bytes)`);
        console.log(`Records:     ${result.manifest.totalRecords} records across ${Object.keys(result.manifest.tableCounts).length} tables`);
        console.log(`Attachments: ${result.manifest.attachmentCount} files`);
        return 0;
      } catch (err: unknown) {
        console.error("\nBackup failed:", err instanceof Error ? err.message : String(err));
        return 1;
      }
    }

    case "restore": {
      const archivePath = argv[1];
      if (!archivePath || archivePath.startsWith("-")) {
        console.error("Error: Please provide path to backup archive file.");
        console.log("Usage: duesora restore <archive.tar.gz>");
        return 1;
      }

      const isForced = argv.includes("--force") || argv.includes("-f");
      if (!isForced && process.stdin.isTTY) {
        console.log("WARNING: This will replace the existing database contents.");
      }

      console.log(`Restoring Duesora state from ${archivePath}...`);
      try {
        const result = await restoreDuesoraBackup(archivePath);
        const totalRestored = Object.values(result.restoredTables).reduce((a, b) => a + b, 0);

        console.log("\nRestore completed successfully!");
        console.log(`Archive:     ${result.archivePath}`);
        console.log(`Records:     ${totalRestored} records restored across ${Object.keys(result.restoredTables).length} tables`);
        console.log(`Attachments: ${result.restoredAttachments} files unpacked`);
        return 0;
      } catch (err: unknown) {
        console.error("\nRestore failed:", err instanceof Error ? err.message : String(err));
        return 1;
      }
    }

    default:
      console.error(`Unknown command: "${command}"`);
      printUsage();
      return 1;
  }
}
