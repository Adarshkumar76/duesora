import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT } from "@/app/api/workspaces/[workspaceId]/budgets/route";
import { auth } from "@/auth";
import {
  getWorkspaceBudgetStatus,
  upsertWorkspaceBudget,
} from "@/lib/budgets/service";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/budgets/service", () => ({
  getWorkspaceBudgetStatus: vi.fn(),
  upsertWorkspaceBudget: vi.fn(),
}));

describe("API: /api/workspaces/[workspaceId]/budgets", () => {
  const context = {
    params: Promise.resolve({
      workspaceId: "ws-test-1",
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET handler", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-test-1/budgets");
      const res = await GET(req, context);
      expect(res.status).toBe(401);
    });

    it("returns 403 when caller is not allowed", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-outsider" } } as never);
      vi.mocked(getWorkspaceBudgetStatus).mockRejectedValue(new Error("FORBIDDEN"));

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-test-1/budgets");
      const res = await GET(req, context);
      expect(res.status).toBe(403);
    });

    it("returns 200 with budget status data", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-viewer" } } as never);

      const mockStatus = {
        budget: null,
        currency: "USD",
        monthly: {
          budgetMinor: 50000,
          spendMinor: 25000,
          burnPercentage: 50,
          isWarning: false,
          isExceeded: false,
          remainingMinor: 25000,
        },
        annual: {
          budgetMinor: 600000,
          spendMinor: 300000,
          burnPercentage: 50,
          isWarning: false,
          isExceeded: false,
          remainingMinor: 300000,
        },
        alertThresholdPct: 80,
        alertEmailsEnabled: true,
        hasBudgetConfigured: true,
      };

      vi.mocked(getWorkspaceBudgetStatus).mockResolvedValue(mockStatus);

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-test-1/budgets");
      const res = await GET(req, context);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data).toEqual(mockStatus);
    });
  });

  describe("PUT handler", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-test-1/budgets", {
        method: "PUT",
        body: JSON.stringify({ monthlyBudgetMinor: 50000 }),
      });
      const res = await PUT(req, context);
      expect(res.status).toBe(401);
    });

    it("returns 403 when user is not admin or owner", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-viewer" } } as never);
      vi.mocked(upsertWorkspaceBudget).mockRejectedValue(new Error("FORBIDDEN"));

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-test-1/budgets", {
        method: "PUT",
        body: JSON.stringify({ monthlyBudgetMinor: 50000 }),
      });
      const res = await PUT(req, context);
      expect(res.status).toBe(403);
    });

    it("returns 400 when currency is unsupported", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-admin" } } as never);
      vi.mocked(upsertWorkspaceBudget).mockRejectedValue(new Error("Unsupported currency: BTC"));

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-test-1/budgets", {
        method: "PUT",
        body: JSON.stringify({ currency: "BTC" }),
      });
      const res = await PUT(req, context);
      expect(res.status).toBe(400);
    });

    it("returns 200 with saved budget on success", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-admin" } } as never);

      const mockSaved = {
        id: "budget-1",
        workspaceId: "ws-test-1",
        monthlyBudgetMinor: 100000,
        annualBudgetMinor: 1200000,
        currency: "USD",
        alertThresholdPct: 80,
        alertEmailsEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(upsertWorkspaceBudget).mockResolvedValue(mockSaved);

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-test-1/budgets", {
        method: "PUT",
        body: JSON.stringify({
          monthlyBudgetMinor: 100000,
          annualBudgetMinor: 1200000,
          currency: "USD",
          alertThresholdPct: 80,
          alertEmailsEnabled: true,
        }),
      });

      const res = await PUT(req, context);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe("budget-1");
    });
  });
});
