import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

vi.mock("@/lib/notifications/repository", () => ({
  createNotification: vi.fn(),
  hasReminderBeenDispatched: vi.fn(),
  recordReminderLog: vi.fn(),
}));

vi.mock("@/lib/notifications/email", () => ({
  sendRenewalReminderEmail: vi.fn().mockResolvedValue({ success: true }),
  formatReminderSubject: vi.fn((name: string, days: number, isEscalated?: boolean) =>
    `${isEscalated ? "[ESCALATED] " : ""}Reminder: ${name} (${days} days)`
  ),
  renderRenewalEmailHtml: vi.fn().mockReturnValue("<html/>"),
  renderRenewalEmailText: vi.fn().mockReturnValue("Text"),
}));

vi.mock("@/lib/webhooks/dispatcher", () => ({
  emitWorkspaceWebhook: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/integrations/chat/dispatcher", () => ({
  dispatchRenewalChatAlert: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/audit/service", () => ({
  recordAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

import { processWorkspaceReminders } from "@/lib/notifications/reminder-engine";
import { getDb } from "@/db";
import {
  createNotification,
  hasReminderBeenDispatched,
  recordReminderLog,
} from "@/lib/notifications/repository";
import { sendRenewalReminderEmail } from "@/lib/notifications/email";
import { emitWorkspaceWebhook } from "@/lib/webhooks/dispatcher";
import { dispatchRenewalChatAlert } from "@/lib/integrations/chat/dispatcher";
import { recordAuditEvent } from "@/lib/audit/service";

describe("Phase 7: Reminder Escalation Policies", () => {
  const workspaceId = "ws-test-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("escalates to workspace admins and owners when resource renewal is <= 3 days away", async () => {
    // 2 days remaining (critical escalation threshold)
    const in2Days = new Date();
    in2Days.setDate(in2Days.getDate() + 2);

    const mockResource = {
      id: "res-critical-1",
      workspaceId,
      name: "Critical AWS Production Cluster",
      type: "cloud_service",
      status: "active",
      renewalDate: in2Days,
      amountMinor: 500000,
      currency: "USD",
      billingCycle: "monthly",
      ownerId: "user-owner-dev",
      provider: "AWS",
    };

    const mockCandidateResources = [
      {
        resource: mockResource,
        ownerName: "Dev Owner",
        ownerEmail: "dev@example.com",
      },
    ];

    const mockAdmins = [
      {
        id: "admin-1",
        name: "Admin Alice",
        email: "alice@example.com",
        role: "admin",
      },
      {
        id: "owner-1",
        name: "Owner Oscar",
        email: "oscar@example.com",
        role: "owner",
      },
      {
        id: "member-1",
        name: "Member Bob",
        email: "bob@example.com",
        role: "member",
      },
    ];

    const mockDb = {
      select: vi
        .fn()
        // First select: candidateResources
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          leftJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue(mockCandidateResources),
        })
        // Second select: workspaceAdmins
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue(mockAdmins),
        }),
    };

    vi.mocked(getDb).mockReturnValue(mockDb as never);
    vi.mocked(hasReminderBeenDispatched).mockResolvedValue(false);

    const summary = await processWorkspaceReminders(workspaceId);

    expect(summary.scannedCount).toBe(1);
    expect(summary.escalatedCount).toBe(2); // Escalated to Admin Alice and Owner Oscar (Bob excluded as member)

    // Check escalation in-app notifications
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId,
        userId: "admin-1",
        severity: "critical",
        metadata: expect.objectContaining({
          isEscalation: true,
          assignedOwnerId: "user-owner-dev",
        }),
      })
    );

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId,
        userId: "owner-1",
        severity: "critical",
        metadata: expect.objectContaining({
          isEscalation: true,
        }),
      })
    );

    // Check escalation email dispatch
    expect(sendRenewalReminderEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alice@example.com",
        isEscalated: true,
      })
    );

    expect(sendRenewalReminderEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "oscar@example.com",
        isEscalated: true,
      })
    );

    // Check escalation logs recorded with dedicated channel identifiers
    expect(recordReminderLog).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceId: "res-critical-1",
        channel: "escalation_in_app",
        recipient: "admin-1",
      })
    );

    expect(recordReminderLog).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceId: "res-critical-1",
        channel: "escalation_email",
        recipient: "alice@example.com",
      })
    );

    // Check Audit Log recording
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId,
        action: "reminder.escalated",
        entityType: "resource",
        entityId: "res-critical-1",
      })
    );

    // Check Webhook dispatch
    expect(emitWorkspaceWebhook).toHaveBeenCalledWith(
      workspaceId,
      "reminder.escalated",
      expect.objectContaining({
        resourceId: "res-critical-1",
      })
    );

    // Check Chat Alert dispatch
    expect(dispatchRenewalChatAlert).toHaveBeenCalledWith(
      workspaceId,
      expect.objectContaining({
        resourceId: "res-critical-1",
        isEscalated: true,
      })
    );
  });

  it("does not trigger escalation when renewal is not in the critical window (> 3 days)", async () => {
    // 14 days remaining (standard info reminder, not critical)
    const in14Days = new Date();
    in14Days.setDate(in14Days.getDate() + 14);

    const mockResource = {
      id: "res-standard-1",
      workspaceId,
      name: "Figma Subscription",
      type: "subscription",
      status: "active",
      renewalDate: in14Days,
      amountMinor: 4500,
      currency: "USD",
      billingCycle: "monthly",
      ownerId: "user-owner-dev",
    };

    const mockDb = {
      select: vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          leftJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([
            {
              resource: mockResource,
              ownerName: "Dev Owner",
              ownerEmail: "dev@example.com",
            },
          ]),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([
            { id: "admin-1", email: "admin@example.com", role: "admin" },
          ]),
        }),
    };

    vi.mocked(getDb).mockReturnValue(mockDb as never);
    vi.mocked(hasReminderBeenDispatched).mockResolvedValue(false);

    const summary = await processWorkspaceReminders(workspaceId);

    expect(summary.scannedCount).toBe(1);
    expect(summary.escalatedCount).toBe(0); // 0 escalations

    // Verify standard notifications were sent to owner
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-owner-dev",
        severity: "info",
      })
    );

    // Verify no escalation audit event
    expect(recordAuditEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: "reminder.escalated" })
    );

    // Verify no reminder.escalated webhook
    expect(emitWorkspaceWebhook).not.toHaveBeenCalledWith(
      workspaceId,
      "reminder.escalated",
      expect.anything()
    );
  });

  it("respects cycle deduplication and skips already escalated reminders", async () => {
    const in1Day = new Date();
    in1Day.setDate(in1Day.getDate() + 1);

    const mockResource = {
      id: "res-dedup-1",
      workspaceId,
      name: "Domain Registration",
      type: "domain",
      status: "active",
      renewalDate: in1Day,
      amountMinor: 2000,
      currency: "USD",
      billingCycle: "yearly",
      ownerId: "owner-1",
    };

    const mockDb = {
      select: vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          leftJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([
            {
              resource: mockResource,
              ownerName: "Admin Owner",
              ownerEmail: "owner@example.com",
            },
          ]),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([
            { id: "admin-1", email: "admin@example.com", role: "admin" },
          ]),
        }),
    };

    vi.mocked(getDb).mockReturnValue(mockDb as never);
    // Already dispatched!
    vi.mocked(hasReminderBeenDispatched).mockResolvedValue(true);

    const summary = await processWorkspaceReminders(workspaceId);

    expect(summary.escalatedCount).toBe(0);
    expect(createNotification).not.toHaveBeenCalled();
    expect(sendRenewalReminderEmail).not.toHaveBeenCalled();
  });

  it("can disable escalation policy via engine options", async () => {
    const in1Day = new Date();
    in1Day.setDate(in1Day.getDate() + 1);

    const mockResource = {
      id: "res-disabled-1",
      workspaceId,
      name: "Cloud Server",
      type: "hosting",
      status: "active",
      renewalDate: in1Day,
      amountMinor: 10000,
      currency: "USD",
      billingCycle: "monthly",
      ownerId: "user-dev",
    };

    const mockDb = {
      select: vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          leftJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([
            {
              resource: mockResource,
              ownerName: "Dev User",
              ownerEmail: "dev@example.com",
            },
          ]),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([
            { id: "admin-1", email: "admin@example.com", role: "admin" },
          ]),
        }),
    };

    vi.mocked(getDb).mockReturnValue(mockDb as never);
    vi.mocked(hasReminderBeenDispatched).mockResolvedValue(false);

    const summary = await processWorkspaceReminders(workspaceId, {
      enableEscalation: false,
    });

    expect(summary.scannedCount).toBe(1);
    expect(summary.escalatedCount).toBe(0);
    expect(recordAuditEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: "reminder.escalated" })
    );
  });
});
