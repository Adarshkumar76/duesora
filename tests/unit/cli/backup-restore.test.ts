import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, expect, vi } from "vitest";
import { packTarGz } from "@/cli/archive";
import { RESTORE_TABLE_ORDER, restoreDuesoraBackup } from "@/cli/restore";
import { runCli } from "@/cli/index";

describe("CLI Backup & Restore Operations", () => {
  describe("RESTORE_TABLE_ORDER", () => {
    it("ensures parent tables are restored before dependent child tables", () => {
      const userIndex = RESTORE_TABLE_ORDER.indexOf("users");
      const workspaceIndex = RESTORE_TABLE_ORDER.indexOf("workspaces");
      const resourceIndex = RESTORE_TABLE_ORDER.indexOf("resources");
      const monitorIndex = RESTORE_TABLE_ORDER.indexOf("resource_monitors");
      const documentIndex = RESTORE_TABLE_ORDER.indexOf("resource_documents");
      const apiKeyIndex = RESTORE_TABLE_ORDER.indexOf("api_keys");

      expect(userIndex).toBeGreaterThanOrEqual(0);
      expect(workspaceIndex).toBeGreaterThanOrEqual(0);
      expect(resourceIndex).toBeGreaterThan(workspaceIndex);
      expect(monitorIndex).toBeGreaterThan(resourceIndex);
      expect(documentIndex).toBeGreaterThan(resourceIndex);
      expect(apiKeyIndex).toBeGreaterThan(workspaceIndex);
    });

    it("covers exchange_rates, audit_logs, and budgets", () => {
      expect(RESTORE_TABLE_ORDER).toContain("exchange_rates");
      expect(RESTORE_TABLE_ORDER).toContain("audit_logs");
      expect(RESTORE_TABLE_ORDER).toContain("workspace_budgets");
    });
  });

  describe("Archive Validation & Tamper Detection", () => {
    it("fails when archive file does not exist", async () => {
      await expect(restoreDuesoraBackup("non-existent-archive.tar.gz")).rejects.toThrow(
        "Backup archive not found"
      );
    });

    it("fails when archive lacks manifest.json", async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "duesora-test-archive-"));
      const archivePath = path.join(tmpDir, "corrupt.tar.gz");

      const tarGz = packTarGz([
        {
          path: "database.json",
          data: Buffer.from("{}", "utf8"),
        },
      ]);
      fs.writeFileSync(archivePath, tarGz);

      try {
        await expect(restoreDuesoraBackup(archivePath)).rejects.toThrow(
          "Invalid archive: missing manifest.json"
        );
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it("detects checksum tampering in archive entries", async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "duesora-test-tamper-"));
      const archivePath = path.join(tmpDir, "tampered.tar.gz");

      const dbData = Buffer.from(JSON.stringify({ users: [] }), "utf8");

      const manifest = {
        version: "0.1.0",
        timestamp: new Date().toISOString(),
        totalRecords: 0,
        tableCounts: {},
        attachmentCount: 0,
        checksums: {
          "database.json": "0000000000000000000000000000000000000000000000000000000000000000", // Tampered hash
        },
      };

      const tarGz = packTarGz([
        {
          path: "manifest.json",
          data: Buffer.from(JSON.stringify(manifest), "utf8"),
        },
        {
          path: "database.json",
          data: dbData,
        },
      ]);
      fs.writeFileSync(archivePath, tarGz);

      try {
        await expect(restoreDuesoraBackup(archivePath)).rejects.toThrow(
          "Integrity verification failed for database.json: checksum mismatch"
        );
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it("fails when archive lacks database.json", async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "duesora-test-missing-db-"));
      const archivePath = path.join(tmpDir, "missing-db.tar.gz");

      const manifest = {
        version: "0.1.0",
        timestamp: new Date().toISOString(),
        totalRecords: 0,
        tableCounts: {},
        attachmentCount: 0,
        checksums: {},
      };

      const tarGz = packTarGz([
        {
          path: "manifest.json",
          data: Buffer.from(JSON.stringify(manifest), "utf8"),
        },
      ]);
      fs.writeFileSync(archivePath, tarGz);

      try {
        await expect(restoreDuesoraBackup(archivePath)).rejects.toThrow(
          "Invalid archive: missing database.json"
        );
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe("runCli dispatching", () => {
    it("handles help flags with exit code 0", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      try {
        expect(await runCli([])).toBe(0);
        expect(await runCli(["--help"])).toBe(0);
        expect(await runCli(["-h"])).toBe(0);
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("handles version flags with exit code 0", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      try {
        expect(await runCli(["--version"])).toBe(0);
        expect(await runCli(["-v"])).toBe(0);
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("returns error code 1 for unknown commands", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      try {
        expect(await runCli(["non-existent-subcommand"])).toBe(1);
      } finally {
        consoleSpy.mockRestore();
        logSpy.mockRestore();
      }
    });

    it("returns error code 1 for restore command without file argument", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      try {
        expect(await runCli(["restore"])).toBe(1);
      } finally {
        consoleSpy.mockRestore();
        logSpy.mockRestore();
      }
    });
  });
});
