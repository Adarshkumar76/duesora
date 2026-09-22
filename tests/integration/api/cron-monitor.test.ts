import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getMonitorCron, POST as postMonitorCron } from "@/app/api/cron/monitor/route";
import { GET as getAllCron, POST as postAllCron } from "@/app/api/cron/all/route";
import { runAutomatedMonitoringJob } from "@/lib/monitors/service";
import { processWorkspaceReminders } from "@/lib/notifications/reminder-engine";

vi.mock("@/lib/monitors/service", () => ({
  runAutomatedMonitoringJob: vi.fn(),
}));

vi.mock("@/lib/notifications/reminder-engine", () => ({
  processWorkspaceReminders: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/db", () => ({
  getDb: () => ({
    select: () => ({
      from: () => Promise.resolve([{ id: "ws-1" }, { id: "ws-2" }]),
    }),
  }),
}));

describe("API: /api/cron/monitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret-xyz";
  });

  it("returns 401 UNAUTHORIZED when no authorization is provided in production", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const req = new NextRequest("http://localhost:3000/api/cron/monitor");
    const res = await getMonitorCron(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 200 and executes monitoring job when valid Bearer token is provided", async () => {
    vi.mocked(runAutomatedMonitoringJob).mockResolvedValue({
      scannedCount: 4,
      healthyCount: 3,
      warningCount: 1,
      criticalCount: 0,
      errorCount: 0,
      alertsDispatched: 1,
      durationMs: 145,
      errors: [],
    });

    const req = new NextRequest("http://localhost:3000/api/cron/monitor", {
      headers: {
        authorization: "Bearer test-cron-secret-xyz",
      },
    });

    const res = await getMonitorCron(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.scannedCount).toBe(4);
    expect(json.data.alertsDispatched).toBe(1);
    expect(runAutomatedMonitoringJob).toHaveBeenCalledWith({ workspaceId: undefined });
  });

  it("passes workspaceId parameter when supplied in query", async () => {
    vi.mocked(runAutomatedMonitoringJob).mockResolvedValue({
      scannedCount: 1,
      healthyCount: 1,
      warningCount: 0,
      criticalCount: 0,
      errorCount: 0,
      alertsDispatched: 0,
      durationMs: 40,
      errors: [],
    });

    const req = new NextRequest(
      "http://localhost:3000/api/cron/monitor?workspaceId=ws-specific&secret=test-cron-secret-xyz"
    );

    const res = await postMonitorCron(req);
    expect(res.status).toBe(200);
    expect(runAutomatedMonitoringJob).toHaveBeenCalledWith({ workspaceId: "ws-specific" });
  });
});

describe("API: /api/cron/all", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret-xyz";
  });

  it("returns 401 UNAUTHORIZED when unauthorized in production", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const req = new NextRequest("http://localhost:3000/api/cron/all");
    const res = await getAllCron(req);
    expect(res.status).toBe(401);
  });

  it("runs both monitoring and reminders when authorized and returns aggregate data", async () => {
    vi.mocked(runAutomatedMonitoringJob).mockResolvedValue({
      scannedCount: 2,
      healthyCount: 2,
      warningCount: 0,
      criticalCount: 0,
      errorCount: 0,
      alertsDispatched: 0,
      durationMs: 80,
      errors: [],
    });

    vi.mocked(processWorkspaceReminders).mockResolvedValue({
      workspaceId: "ws-1",
      scannedCount: 5,
      dispatchedInAppCount: 1,
      dispatchedEmailCount: 1,
      skippedCount: 3,
      errors: [],
    });

    const req = new NextRequest("http://localhost:3000/api/cron/all", {
      headers: {
        authorization: "Bearer test-cron-secret-xyz",
      },
    });

    const res = await postAllCron(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.monitoring).toBeDefined();
    expect(json.data.reminders).toBeDefined();
    expect(json.data.reminders.length).toBe(2);
  });
});
