import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getWorkspaceBudget,
  upsertWorkspaceBudget,
  getWorkspaceBudgetStatus,
} from "@/lib/budgets/service";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { recordAuditEvent } from "@/lib/audit/service";
import { getDb } from "@/db";

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/lib/audit/service", () => ({
  recordAuditEvent: vi.fn(),
}));

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

describe("Budget Service: getWorkspaceBudget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enforces viewer role on active workspace", async () => {
    vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

    await expect(
      getWorkspaceBudget("user-1", "ws-1")
    ).rejects.toThrow("FORBIDDEN");

    expect(requireWorkspaceRole).toHaveBeenCalledWith("user-1", "ws-1", "viewer");
  });

  it("returns null when no budget is configured", async () => {
    vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(getDb).mockReturnValue(mockDb as never);

    const result = await getWorkspaceBudget("user-1", "ws-1");
    expect(result).toBeNull();
  });

  it("returns budget record when configured", async () => {
    vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

    const mockBudget = {
      id: "b-1",
      workspaceId: "ws-1",
      monthlyBudgetMinor: 50000,
      annualBudgetMinor: 600000,
      currency: "USD",
      alertThresholdPct: 80,
      alertEmailsEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockBudget]),
    };
    vi.mocked(getDb).mockReturnValue(mockDb as never);

    const result = await getWorkspaceBudget("user-1", "ws-1");
    expect(result).toEqual(mockBudget);
  });
});

describe("Budget Service: upsertWorkspaceBudget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enforces admin role for mutating budget", async () => {
    vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

    await expect(
      upsertWorkspaceBudget("user-1", "ws-1", {
        monthlyBudgetMinor: 50000,
      })
    ).rejects.toThrow("FORBIDDEN");

    expect(requireWorkspaceRole).toHaveBeenCalledWith("user-1", "ws-1", "admin");
  });

  it("rejects unsupported currency", async () => {
    vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

    await expect(
      upsertWorkspaceBudget("user-1", "ws-1", {
        currency: "INVALID",
      })
    ).rejects.toThrow("Unsupported currency: INVALID");
  });

  it("upserts budget and records audit event", async () => {
    vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

    const savedRecord = {
      id: "b-1",
      workspaceId: "ws-1",
      monthlyBudgetMinor: 100000, // $1000
      annualBudgetMinor: 1200000, // $12000
      currency: "USD",
      alertThresholdPct: 85,
      alertEmailsEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([savedRecord]),
    };
    vi.mocked(getDb).mockReturnValue(mockDb as never);

    const result = await upsertWorkspaceBudget(
      "user-1",
      "ws-1",
      {
        monthlyBudgetMinor: 100000,
        annualBudgetMinor: 1200000,
        currency: "USD",
        alertThresholdPct: 85,
        alertEmailsEnabled: true,
      },
      "127.0.0.1"
    );

    expect(result).toEqual(savedRecord);
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "ws-1",
        actorId: "user-1",
        action: "budget.updated",
        entityType: "workspace_budget",
        ipAddress: "127.0.0.1",
      })
    );
  });
});

describe("Budget Service: getWorkspaceBudgetStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("computes burn percentage and threshold breach states accurately", async () => {
    vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

    const mockWorkspace = { id: "ws-1", defaultCurrency: "USD" };
    const mockBudget = {
      id: "b-1",
      workspaceId: "ws-1",
      monthlyBudgetMinor: 10000, // $100.00 / month cap
      annualBudgetMinor: 120000,  // $1,200.00 / year cap
      currency: "USD",
      alertThresholdPct: 80,
      alertEmailsEnabled: true,
    };

    // Active resources total $85/month ($1,020/year) -> 85% of monthly budget (Warning!)
    const mockResources = [
      {
        amountMinor: 8500, // $85.00
        currency: "USD",
        billingCycle: "monthly",
        status: "active",
      },
    ];

    let queryCount = 0;
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(() => {
        queryCount++;
        if (queryCount === 1) return Promise.resolve([mockWorkspace]);
        if (queryCount === 2) return Promise.resolve([mockBudget]);
        return Promise.resolve(mockResources);
      }),
    };
    vi.mocked(getDb).mockReturnValue(mockDb as never);

    const status = await getWorkspaceBudgetStatus("user-1", "ws-1");

    expect(status.hasBudgetConfigured).toBe(true);
    expect(status.currency).toBe("USD");
    expect(status.monthly.spendMinor).toBe(8500);
    expect(status.monthly.budgetMinor).toBe(10000);
    expect(status.monthly.burnPercentage).toBe(85);
    expect(status.monthly.isWarning).toBe(true);
    expect(status.monthly.isExceeded).toBe(false);
    expect(status.monthly.remainingMinor).toBe(1500);

    expect(status.annual.spendMinor).toBe(102000); // 85 * 12 = 1020
    expect(status.annual.burnPercentage).toBe(85);
    expect(status.annual.isWarning).toBe(true);
    expect(status.annual.isExceeded).toBe(false);
  });

  it("detects exceeded budget when spend surpasses 100%", async () => {
    vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

    const mockWorkspace = { id: "ws-1", defaultCurrency: "USD" };
    const mockBudget = {
      id: "b-1",
      workspaceId: "ws-1",
      monthlyBudgetMinor: 5000, // $50.00 cap
      annualBudgetMinor: 60000,
      currency: "USD",
      alertThresholdPct: 80,
      alertEmailsEnabled: true,
    };

    // Active resources total $60/month -> 120% of monthly budget (Exceeded!)
    const mockResources = [
      {
        amountMinor: 6000,
        currency: "USD",
        billingCycle: "monthly",
        status: "active",
      },
    ];

    let queryCount = 0;
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(() => {
        queryCount++;
        if (queryCount === 1) return Promise.resolve([mockWorkspace]);
        if (queryCount === 2) return Promise.resolve([mockBudget]);
        return Promise.resolve(mockResources);
      }),
    };
    vi.mocked(getDb).mockReturnValue(mockDb as never);

    const status = await getWorkspaceBudgetStatus("user-1", "ws-1");

    expect(status.monthly.burnPercentage).toBe(120);
    expect(status.monthly.isWarning).toBe(true);
    expect(status.monthly.isExceeded).toBe(true);
    expect(status.monthly.remainingMinor).toBe(-1000);
  });
});
