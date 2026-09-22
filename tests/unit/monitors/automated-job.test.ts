import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { shouldSendMonitorAlert } from "@/lib/monitors/service";
import { formatMonitorSubject, renderMonitorEmailHtml } from "@/lib/notifications/email";
import { verifyCronAuthorization } from "@/lib/cron/auth";
import { NextRequest } from "next/server";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

describe("Automated Monitoring Alert Logic (shouldSendMonitorAlert)", () => {
  const now = new Date("2026-09-22T12:00:00Z");

  it("triggers a recovery alert when status transitions from warning/critical/error to healthy", () => {
    const res1 = shouldSendMonitorAlert("healthy", "critical", "critical", new Date("2026-09-21T12:00:00Z"), now);
    expect(res1.shouldAlert).toBe(true);
    expect(res1.alertReason).toBe("recovered");

    const res2 = shouldSendMonitorAlert("healthy", "warning", "warning", new Date("2026-09-21T12:00:00Z"), now);
    expect(res2.shouldAlert).toBe(true);
    expect(res2.alertReason).toBe("recovered");

    const res3 = shouldSendMonitorAlert("healthy", "error", "error", new Date("2026-09-21T12:00:00Z"), now);
    expect(res3.shouldAlert).toBe(true);
    expect(res3.alertReason).toBe("recovered");
  });

  it("does not alert when status remains steadily healthy", () => {
    const res = shouldSendMonitorAlert("healthy", "healthy", null, null, now);
    expect(res.shouldAlert).toBe(false);
    expect(res.alertReason).toBe(null);
  });

  it("alerts on first degradation transition (healthy -> warning or healthy -> critical)", () => {
    const res1 = shouldSendMonitorAlert("warning", "healthy", null, null, now);
    expect(res1.shouldAlert).toBe(true);
    expect(res1.alertReason).toBe("degraded");

    const res2 = shouldSendMonitorAlert("critical", "warning", "warning", new Date("2026-09-22T10:00:00Z"), now);
    expect(res2.shouldAlert).toBe(true);
    expect(res2.alertReason).toBe("degraded");
  });

  it("suppresses redundant alerts within 24 hours for the same degraded status", () => {
    // Alert was sent 2 hours ago
    const twoHoursAgo = new Date("2026-09-22T10:00:00Z");
    const res = shouldSendMonitorAlert("critical", "critical", "critical", twoHoursAgo, now);
    expect(res.shouldAlert).toBe(false);
    expect(res.alertReason).toBe(null);
  });

  it("fires a periodic reminder alert if still degraded after 24 hours", () => {
    // Alert was sent 25 hours ago
    const twentyFiveHoursAgo = new Date("2026-09-21T11:00:00Z");
    const res = shouldSendMonitorAlert("critical", "critical", "critical", twentyFiveHoursAgo, now);
    expect(res.shouldAlert).toBe(true);
    expect(res.alertReason).toBe("periodic_degraded");
  });
});

describe("Monitor Alert Email Formatting", () => {
  it("formats recovery email subject and HTML correctly", () => {
    const subject = formatMonitorSubject({
      to: "admin@example.com",
      resourceName: "Acme Production",
      hostname: "acme.com",
      resourceId: "res-123",
      status: "healthy",
      tlsDaysRemaining: 90,
      tlsIssuer: "Let's Encrypt",
    });
    expect(subject).toContain("[RESOLVED]");
    expect(subject).toContain("acme.com");

    const html = renderMonitorEmailHtml({
      to: "admin@example.com",
      resourceName: "Acme Production",
      hostname: "acme.com",
      resourceId: "res-123",
      status: "healthy",
      tlsDaysRemaining: 90,
      tlsIssuer: "Let's Encrypt",
    });
    expect(html).toContain("HEALTHY / RECOVERED");
    expect(html).toContain("acme.com");
    expect(html).toContain("Let's Encrypt");
  });

  it("formats critical expiration subject when cert has expired or expires soon", () => {
    const expiredSubject = formatMonitorSubject({
      to: "admin@example.com",
      resourceName: "Old Domain",
      hostname: "old.org",
      resourceId: "res-456",
      status: "critical",
      tlsDaysRemaining: 0,
      tlsIssuer: "DigiCert",
    });
    expect(expiredSubject).toContain("[CRITICAL] SSL certificate EXPIRED");

    const expiringSubject = formatMonitorSubject({
      to: "admin@example.com",
      resourceName: "Upcoming Domain",
      hostname: "upcoming.org",
      resourceId: "res-789",
      status: "critical",
      tlsDaysRemaining: 5,
      tlsIssuer: "DigiCert",
    });
    expect(expiringSubject).toContain("expiring in 5 days");
  });
});

describe("Cron Authorization (verifyCronAuthorization)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("authenticates successfully via Bearer token matching CRON_SECRET", async () => {
    process.env.CRON_SECRET = "super-secret-cron-token-123";
    const req = new NextRequest("http://localhost:3000/api/cron/monitor", {
      headers: {
        authorization: "Bearer super-secret-cron-token-123",
      },
    });

    const result = await verifyCronAuthorization(req);
    expect(result.authorized).toBe(true);
    expect(result.source).toBe("cron_secret");
  });

  it("authenticates successfully via x-cron-secret header", async () => {
    process.env.CRON_SECRET = "super-secret-cron-token-123";
    const req = new NextRequest("http://localhost:3000/api/cron/monitor", {
      headers: {
        "x-cron-secret": "super-secret-cron-token-123",
      },
    });

    const result = await verifyCronAuthorization(req);
    expect(result.authorized).toBe(true);
    expect(result.source).toBe("cron_secret");
  });

  it("authenticates successfully via ?secret= query parameter", async () => {
    process.env.CRON_SECRET = "super-secret-cron-token-123";
    const req = new NextRequest("http://localhost:3000/api/cron/monitor?secret=super-secret-cron-token-123");

    const result = await verifyCronAuthorization(req);
    expect(result.authorized).toBe(true);
    expect(result.source).toBe("cron_secret");
  });

  it("rejects invalid cron secret when CRON_SECRET is configured", async () => {
    process.env.CRON_SECRET = "super-secret-cron-token-123";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const req = new NextRequest("http://localhost:3000/api/cron/monitor", {
      headers: {
        authorization: "Bearer wrong-secret",
      },
    });

    const result = await verifyCronAuthorization(req);
    expect(result.authorized).toBe(false);
  });
});
