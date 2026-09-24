import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getResourceCostHistory } from "@/app/api/workspaces/[workspaceId]/resources/[resourceId]/cost-history/route";
import { GET as getWorkspaceCostChanges } from "@/app/api/workspaces/[workspaceId]/cost-changes/route";
import { auth } from "@/auth";
import {
  listResourceCostHistory,
  listWorkspacePriceChanges,
  recordResourceCostChange,
} from "@/lib/resources/cost-history";
import { updateWorkspaceResource } from "@/lib/resources/service";
import * as resourceRepo from "@/lib/resources/repository";
import * as authWorkspace from "@/lib/auth/workspace";
import * as auditService from "@/lib/audit/service";
import * as webhookDispatcher from "@/lib/webhooks/dispatcher";
import * as chatDispatcher from "@/lib/integrations/chat/dispatcher";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/resources/cost-history", () => ({
  listResourceCostHistory: vi.fn(),
  listWorkspacePriceChanges: vi.fn(),
  recordResourceCostChange: vi.fn(),
  calculateCostChangeBps: vi.fn().mockReturnValue(2500),
}));

vi.mock("@/lib/resources/repository", () => ({
  createResource: vi.fn(),
  getResourceById: vi.fn(),
  listResources: vi.fn(),
  deleteResource: vi.fn(),
  updateResource: vi.fn(),
}));

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/lib/audit/service", () => ({
  recordAuditEvent: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/webhooks/dispatcher", () => ({
  emitWorkspaceWebhook: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/integrations/chat/dispatcher", () => ({
  dispatchPriceIncreaseChatAlert: vi.fn().mockResolvedValue([]),
}));

describe("Cost History API & Mutation Alert Triggers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/workspaces/[workspaceId]/resources/[resourceId]/cost-history", () => {
    const context = {
      params: Promise.resolve({
        workspaceId: "ws-test",
        resourceId: "res-test",
      }),
    };

    it("returns 401 when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const req = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-test/resources/res-test/cost-history"
      );
      const res = await getResourceCostHistory(req, context);
      expect(res.status).toBe(401);
    });

    it("returns 403 when user is not member/viewer of workspace", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(listResourceCostHistory).mockRejectedValue(new Error("FORBIDDEN"));

      const req = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-test/resources/res-test/cost-history"
      );
      const res = await getResourceCostHistory(req, context);
      expect(res.status).toBe(403);
    });

    it("returns 200 with cost history entries", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      const mockHistory = [
        {
          id: "hist-1",
          resourceId: "res-test",
          workspaceId: "ws-test",
          previousAmountMinor: 1000,
          newAmountMinor: 1500,
          currency: "USD",
          previousBillingCycle: "monthly",
          newBillingCycle: "monthly",
          changePercentageBps: 5000,
          changePercentage: 50,
          changedByUserId: "user-1",
          changedByName: "Admin",
          changedByEmail: "admin@example.com",
          changeReason: "Tier upgrade",
          effectiveDate: new Date(),
          createdAt: new Date(),
        },
      ];
      vi.mocked(listResourceCostHistory).mockResolvedValue(mockHistory);

      const req = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-test/resources/res-test/cost-history"
      );
      const res = await getResourceCostHistory(req, context);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data).toHaveLength(1);
      expect(json.data[0].changePercentage).toBe(50);
      expect(json.data[0].changeReason).toBe("Tier upgrade");
    });
  });

  describe("GET /api/workspaces/[workspaceId]/cost-changes", () => {
    const context = {
      params: Promise.resolve({
        workspaceId: "ws-test",
      }),
    };

    it("returns 401 when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-test/cost-changes");
      const res = await getWorkspaceCostChanges(req, context);
      expect(res.status).toBe(401);
    });

    it("passes limit and onlyIncreases query parameters to service", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(listWorkspacePriceChanges).mockResolvedValue([]);

      const req = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-test/cost-changes?limit=5&onlyIncreases=true"
      );
      const res = await getWorkspaceCostChanges(req, context);
      expect(res.status).toBe(200);

      expect(listWorkspacePriceChanges).toHaveBeenCalledWith("user-1", "ws-test", {
        limit: 5,
        onlyIncreases: true,
      });
    });
  });

  describe("Resource Update Price Increase Trigger", () => {
    it("records cost change and triggers audit log, webhook, and chat alert on price hike", async () => {
      vi.mocked(authWorkspace.requireWorkspaceRole).mockResolvedValue({} as never);

      // Existing resource ($20 / month)
      vi.mocked(resourceRepo.getResourceById).mockResolvedValue({
        id: "res-1",
        workspaceId: "ws-1",
        name: "Cloudflare Pro",
        type: "service",
        amountMinor: 2000,
        currency: "USD",
        billingCycle: "monthly",
      } as never);

      // Updated resource ($25 / month)
      vi.mocked(resourceRepo.updateResource).mockResolvedValue({
        id: "res-1",
        workspaceId: "ws-1",
        name: "Cloudflare Pro",
        type: "service",
        amountMinor: 2500,
        currency: "USD",
        billingCycle: "monthly",
      } as never);

      vi.mocked(recordResourceCostChange).mockResolvedValue({
        id: "hist-1",
        resourceId: "res-1",
        workspaceId: "ws-1",
        previousAmountMinor: 2000,
        newAmountMinor: 2500,
        currency: "USD",
        previousBillingCycle: "monthly",
        newBillingCycle: "monthly",
        changePercentageBps: 2500,
        changePercentage: 25,
        changedByUserId: "user-1",
        changeReason: "Plan upgrade",
        effectiveDate: new Date(),
        createdAt: new Date(),
      });

      const updated = await updateWorkspaceResource("user-1", "ws-1", "res-1", {
        amountMinor: 2500,
        changeReason: "Plan upgrade",
      });

      expect(updated).toBeDefined();

      // Check cost change was recorded
      expect(recordResourceCostChange).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceId: "res-1",
          workspaceId: "ws-1",
          previousAmountMinor: 2000,
          newAmountMinor: 2500,
          currency: "USD",
          changedByUserId: "user-1",
          changeReason: "Plan upgrade",
        })
      );

      // Flush microtasks for the async background alerts (.then() callbacks)
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify audit event
      expect(auditService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "resource.price_increased",
          workspaceId: "ws-1",
          entityId: "res-1",
        })
      );

      // Verify webhook emission
      expect(webhookDispatcher.emitWorkspaceWebhook).toHaveBeenCalledWith(
        "ws-1",
        "resource.price_changed",
        expect.objectContaining({
          resourceId: "res-1",
          changePercentage: 25,
        })
      );

      // Verify chat dispatcher
      expect(chatDispatcher.dispatchPriceIncreaseChatAlert).toHaveBeenCalledWith(
        "ws-1",
        expect.objectContaining({
          resourceId: "res-1",
          changePercentage: 25,
        })
      );
    });
  });
});
