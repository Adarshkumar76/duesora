import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calculateCancellationDeadline,
  updateRenewalDecision,
  ALLOWED_RENEWAL_DECISIONS,
} from "@/lib/renewals/decision";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { recordAuditEvent } from "@/lib/audit/service";
import { emitWorkspaceWebhook } from "@/lib/webhooks/dispatcher";
import { getDb } from "@/db";

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/lib/audit/service", () => ({
  recordAuditEvent: vi.fn(),
}));

vi.mock("@/lib/webhooks/dispatcher", () => ({
  emitWorkspaceWebhook: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/db", () => {
  const updateMock = vi.fn();
  const selectMock = vi.fn();
  return {
    getDb: vi.fn(() => ({
      update: updateMock,
      select: selectMock,
    })),
  };
});

describe("Unit: Renewal Decision Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateCancellationDeadline", () => {
    it("returns null if renewalDate is null or undefined", () => {
      expect(calculateCancellationDeadline(null, 30)).toBeNull();
      expect(calculateCancellationDeadline(undefined, 30)).toBeNull();
    });

    it("returns null if noticeDays is null, undefined, 0, or negative", () => {
      const renewalDate = new Date("2026-11-15T00:00:00.000Z");
      expect(calculateCancellationDeadline(renewalDate, null)).toBeNull();
      expect(calculateCancellationDeadline(renewalDate, undefined)).toBeNull();
      expect(calculateCancellationDeadline(renewalDate, 0)).toBeNull();
      expect(calculateCancellationDeadline(renewalDate, -5)).toBeNull();
    });

    it("accurately calculates cancellation notice deadline", () => {
      const renewalDate = new Date("2026-11-15T12:00:00.000Z");
      const deadline = calculateCancellationDeadline(renewalDate, 30);

      expect(deadline).not.toBeNull();
      expect(deadline?.toISOString()).toContain("2026-10-16");
    });
  });

  describe("updateRenewalDecision", () => {
    it("enforces member role requirement", async () => {
      vi.mocked(requireWorkspaceRole).mockRejectedValue(new Error("FORBIDDEN"));

      await expect(
        updateRenewalDecision("user-1", "ws-1", "res-1", {
          decision: "approved",
        })
      ).rejects.toThrow("FORBIDDEN");

      expect(requireWorkspaceRole).toHaveBeenCalledWith("user-1", "ws-1", "member");
    });

    it("rejects invalid renewal decisions", async () => {
      vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

      await expect(
        updateRenewalDecision("user-1", "ws-1", "res-1", {
          decision: "invalid_decision" as never,
        })
      ).rejects.toThrow('Invalid renewal decision: "invalid_decision"');
    });

    it("rejects notes exceeding 1000 characters", async () => {
      vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

      const longNotes = "a".repeat(1001);
      await expect(
        updateRenewalDecision("user-1", "ws-1", "res-1", {
          decision: "cancel",
          notes: longNotes,
        })
      ).rejects.toThrow("Decision notes cannot exceed 1000 characters.");
    });

    it("rejects out-of-range cancellation notice days", async () => {
      vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

      await expect(
        updateRenewalDecision("user-1", "ws-1", "res-1", {
          decision: "cancel",
          cancellationNoticeDays: 500,
        })
      ).rejects.toThrow("Cancellation notice days must be an integer between 0 and 365.");
    });

    it("throws Resource not found if resource does not exist", async () => {
      vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

      const limitMock = vi.fn().mockResolvedValue([]);
      const whereMock = vi.fn(() => ({ limit: limitMock }));
      const fromMock = vi.fn(() => ({ where: whereMock }));
      const selectMock = vi.fn(() => ({ from: fromMock }));

      const dbMock = { select: selectMock };
      vi.mocked(getDb).mockReturnValue(dbMock as never);

      await expect(
        updateRenewalDecision("user-1", "ws-1", "res-nonexistent", {
          decision: "approved",
        })
      ).rejects.toThrow("Resource not found");
    });

    it("updates decision, notes, computes deadline, and records audit event", async () => {
      vi.mocked(requireWorkspaceRole).mockResolvedValue({} as never);

      const existingResource = {
        id: "res-1",
        name: "Acme Analytics",
        type: "subscription",
        renewalDate: new Date("2026-11-15T00:00:00.000Z"),
        renewalDecision: "none",
        decisionNotes: null,
        cancellationNoticeDays: null,
        cancellationDeadline: null,
        amountMinor: 5000,
        currency: "USD",
      };

      const limitMock = vi.fn().mockResolvedValue([existingResource]);
      const whereMock = vi.fn(() => ({ limit: limitMock }));
      const fromMock = vi.fn(() => ({ where: whereMock }));
      const selectMock = vi.fn(() => ({ from: fromMock }));

      const updatedRow = {
        ...existingResource,
        renewalDecision: "cancel",
        decisionNotes: "Switching to in-house tool",
        cancellationNoticeDays: 30,
        cancellationDeadline: new Date("2026-10-16T00:00:00.000Z"),
        decidedByUserId: "user-1",
      };

      const returningMock = vi.fn().mockResolvedValue([updatedRow]);
      const updateWhereMock = vi.fn(() => ({ returning: returningMock }));
      const setMock = vi.fn(() => ({ where: updateWhereMock }));
      const updateMock = vi.fn(() => ({ set: setMock }));

      const dbMock = {
        select: selectMock,
        update: updateMock,
      };
      vi.mocked(getDb).mockReturnValue(dbMock as never);

      const result = await updateRenewalDecision("user-1", "ws-1", "res-1", {
        decision: "cancel",
        notes: "Switching to in-house tool",
        cancellationNoticeDays: 30,
      });

      expect(result.renewalDecision).toBe("cancel");
      expect(result.decisionNotes).toBe("Switching to in-house tool");
      expect(recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "resource.renewal_decision",
          workspaceId: "ws-1",
          actorId: "user-1",
          entityId: "res-1",
          details: expect.objectContaining({
            previousDecision: "none",
            newDecision: "cancel",
            cancellationNoticeDays: 30,
          }),
        })
      );
      expect(emitWorkspaceWebhook).toHaveBeenCalledWith(
        "ws-1",
        "renewal.decision_updated",
        expect.objectContaining({
          resourceId: "res-1",
          previousDecision: "none",
          newDecision: "cancel",
        })
      );
    });
  });
});
