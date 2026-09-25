import { describe, it, expect } from "vitest";
import { runSecurityAudit, formatAuditCliOutput } from "@/cli/audit";

describe("CLI Security Auditor (duesora audit)", () => {
  it("flags insecure default placeholders for AUTH_SECRET and ENCRYPTION_KEY", () => {
    const report = runSecurityAudit({
      AUTH_SECRET: "replace-with-a-long-random-secret",
      ENCRYPTION_KEY: "replace-with-a-dedicated-encryption-key",
      CRON_SECRET: "replace-with-a-secure-cron-secret",
      APP_URL: "https://duesora.example.com",
    });

    expect(report.overallStatus).toBe("insecure");
    expect(report.summary.failed).toBeGreaterThanOrEqual(3);

    const authSecretCheck = report.checks.find((c) => c.id === "sec-auth-secret");
    expect(authSecretCheck?.status).toBe("fail");
    expect(authSecretCheck?.message).toContain("default repository placeholder");

    const encCheck = report.checks.find((c) => c.id === "sec-encryption-key");
    expect(encCheck?.status).toBe("fail");
  });

  it("passes when all secrets are strong, random, and HTTPS is configured", () => {
    const report = runSecurityAudit({
      AUTH_SECRET: "a-super-long-secure-and-random-32-character-secret-key-12345",
      ENCRYPTION_KEY: "another-very-secure-32-byte-hex-encryption-key-abcdef",
      CRON_SECRET: "super-cron-secret-token-random-value",
      APP_URL: "https://duesora.example.com",
      DATABASE_URL: "postgresql://duesora:pass@db.private.internal:5432/duesora?sslmode=require",
    });

    expect(report.overallStatus).toBe("secure");
    expect(report.summary.failed).toBe(0);
    expect(report.score).toBeGreaterThanOrEqual(90);
  });

  it("formats readable CLI output with passed/warn/fail indicators", () => {
    const report = runSecurityAudit({
      AUTH_SECRET: "short",
    });
    const output = formatAuditCliOutput(report);

    expect(output).toContain("DUESORA SECURITY & CONFIGURATION AUDIT REPORT");
    expect(output).toContain("AUTH_SECRET");
    expect(output).toContain("Summary:");
  });
});
