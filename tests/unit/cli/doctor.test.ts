import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  checkNodeRuntime,
  checkEnvironmentVariables,
  checkStorage,
  checkSmtp,
  formatDoctorCliOutput,
  type DoctorReport,
} from "@/cli/doctor";

describe("CLI Doctor Diagnostics", () => {
  it("verifies Node runtime meets version >= 20 requirement", () => {
    const res = checkNodeRuntime();
    expect(res.name).toBe("Node.js Runtime");
    expect(res.category).toBe("runtime");
    expect(res.status).toBe("ok");
    expect(res.message).toContain("meets >= v20 requirement");
  });

  describe("checkEnvironmentVariables", () => {
    it("reports errors when critical variables are missing", () => {
      const res = checkEnvironmentVariables({});
      expect(res.status).toBe("error");
      expect(res.message).toContain("DATABASE_URL");
      expect(res.message).toContain("AUTH_SECRET");
    });

    it("reports warnings when recommended variables are missing", () => {
      const res = checkEnvironmentVariables({
        DATABASE_URL: "postgresql://localhost:5432/test",
        AUTH_SECRET: "test-auth-secret-1234567890",
      });
      expect(res.status).toBe("warn");
      expect(res.message).toContain("NEXTAUTH_URL");
    });

    it("reports ok when all variables are present", () => {
      const res = checkEnvironmentVariables({
        DATABASE_URL: "postgresql://localhost:5432/test",
        AUTH_SECRET: "test-auth-secret-1234567890",
        CRON_SECRET: "test-cron-secret",
        APP_URL: "https://duesora.example.com",
        REDIS_URL: "redis://localhost:6379",
      });
      expect(res.status).toBe("ok");
      expect(res.message).toBe("Critical secrets and URLs configured properly");
    });
  });

  describe("checkStorage", () => {
    it("successfully creates and verifies read/write in target storage directory", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "duesora-doctor-test-"));
      try {
        const res = checkStorage(tmpDir);
        expect(res.status).toBe("ok");
        expect(res.category).toBe("storage");
        expect(res.message).toContain("Read/write permissions verified");
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe("checkSmtp", () => {
    it("returns ok when SMTP is unconfigured as optional", async () => {
      const res = await checkSmtp({});
      expect(res.status).toBe("ok");
      expect(res.message).toContain("SMTP not configured (optional");
    });
  });

  describe("formatDoctorCliOutput", () => {
    it("formats a successful diagnostic report", () => {
      const sampleReport: DoctorReport = {
        timestamp: "2026-09-25T10:00:00.000Z",
        success: true,
        errors: 0,
        warnings: 0,
        checks: [
          {
            name: "Node.js Runtime",
            category: "runtime",
            status: "ok",
            message: "Node.js v24.18.0",
          },
        ],
      };

      const output = formatDoctorCliOutput(sampleReport);
      expect(output).toContain("DUESORA SYSTEM HEALTH REPORT");
      expect(output).toContain("[✓ PASS] Node.js Runtime");
      expect(output).toContain("ALL CHECKS PASSED");
    });

    it("formats a failing diagnostic report with error count", () => {
      const sampleReport: DoctorReport = {
        timestamp: "2026-09-25T10:00:00.000Z",
        success: false,
        errors: 2,
        warnings: 1,
        checks: [
          {
            name: "Database",
            category: "database",
            status: "error",
            message: "Connection failed",
            detail: "Port 5432 unreachable",
          },
          {
            name: "Redis",
            category: "redis",
            status: "warn",
            message: "Optional cache offline",
          },
        ],
      };

      const output = formatDoctorCliOutput(sampleReport);
      expect(output).toContain("[✗ FAIL] Database");
      expect(output).toContain("Detail: Port 5432 unreachable");
      expect(output).toContain("[⚠ WARN] Redis");
      expect(output).toContain("Status: UNHEALTHY (2 critical errors detected)");
    });
  });
});
