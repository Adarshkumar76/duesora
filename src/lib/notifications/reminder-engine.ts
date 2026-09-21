import { getDb } from "@/db";
import { resources, users, memberships } from "@/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";
import {
  createNotification,
  hasReminderBeenDispatched,
  recordReminderLog,
} from "./repository";
import { sendRenewalReminderEmail } from "./email";
import { emitWorkspaceWebhook } from "@/lib/webhooks/dispatcher";

export const REMINDER_INTERVALS = [30, 14, 7, 3, 1, 0] as const;

export interface ReminderMatch {
  intervalDays: number;
  severity: "info" | "warning" | "critical";
  type: "renewal_upcoming" | "renewal_overdue";
  daysRemaining: number;
}

export interface EngineRunSummary {
  workspaceId: string;
  scannedCount: number;
  dispatchedInAppCount: number;
  dispatchedEmailCount: number;
  skippedCount: number;
  errors: string[];
}

/**
 * Calculates which reminder interval (if any) matches the given renewal date relative to now.
 */
export function calculateReminderMatch(
  renewalDate: Date,
  nowDate: Date = new Date()
): ReminderMatch | null {
  const renewalMs = new Date(renewalDate).getTime();
  const nowMs = nowDate.getTime();

  // Difference in fractional days
  const diffDays = Math.ceil((renewalMs - nowMs) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      intervalDays: 0,
      severity: "critical",
      type: "renewal_overdue",
      daysRemaining: diffDays,
    };
  }

  if (diffDays <= 1) {
    return {
      intervalDays: 1,
      severity: "critical",
      type: "renewal_upcoming",
      daysRemaining: diffDays,
    };
  }

  if (diffDays <= 3) {
    return {
      intervalDays: 3,
      severity: "warning",
      type: "renewal_upcoming",
      daysRemaining: diffDays,
    };
  }

  if (diffDays <= 7) {
    return {
      intervalDays: 7,
      severity: "warning",
      type: "renewal_upcoming",
      daysRemaining: diffDays,
    };
  }

  if (diffDays <= 14) {
    return {
      intervalDays: 14,
      severity: "info",
      type: "renewal_upcoming",
      daysRemaining: diffDays,
    };
  }

  if (diffDays <= 30) {
    return {
      intervalDays: 30,
      severity: "info",
      type: "renewal_upcoming",
      daysRemaining: diffDays,
    };
  }

  return null;
}

/**
 * Scans a workspace for resources due for renewal reminders and dispatches
 * both in-app and SMTP email notifications with cycle-based deduplication.
 */
export async function processWorkspaceReminders(
  workspaceId: string
): Promise<EngineRunSummary> {
  const db = getDb();
  const now = new Date();

  const summary: EngineRunSummary = {
    workspaceId,
    scannedCount: 0,
    dispatchedInAppCount: 0,
    dispatchedEmailCount: 0,
    skippedCount: 0,
    errors: [],
  };

  try {
    // 1. Fetch active resources with renewal dates in this workspace
    const candidateResources = await db
      .select({
        resource: resources,
        ownerName: users.name,
        ownerEmail: users.email,
      })
      .from(resources)
      .leftJoin(users, eq(resources.ownerId, users.id))
      .where(
        and(
          eq(resources.workspaceId, workspaceId),
          eq(resources.status, "active"),
          isNotNull(resources.renewalDate)
        )
      );

    summary.scannedCount = candidateResources.length;

    // 2. Fetch workspace admins & owners as default fallback recipients
    const workspaceAdmins = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: memberships.role,
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(eq(memberships.workspaceId, workspaceId));

    for (const item of candidateResources) {
      const res = item.resource;
      if (!res.renewalDate) continue;

      const match = calculateReminderMatch(res.renewalDate, now);
      if (!match) {
        summary.skippedCount++;
        continue;
      }

      const cycleKey = new Date(res.renewalDate).toISOString().split("T")[0];

      // Determine recipients: specific owner or all workspace admins/owners
      const recipients: Array<{ id: string; name: string | null; email: string }> = [];
      if (res.ownerId && item.ownerEmail) {
        recipients.push({
          id: res.ownerId,
          name: item.ownerName || null,
          email: item.ownerEmail,
        });
      } else {
        workspaceAdmins
          .filter((m) => m.role === "owner" || m.role === "admin")
          .forEach((m) => recipients.push({ id: m.id, name: m.name, email: m.email }));
      }

      // Title and message formatting
      const daysText =
        match.daysRemaining <= 0
          ? "is due today or overdue!"
          : `renews in ${match.daysRemaining} day${match.daysRemaining === 1 ? "" : "s"}`;

      const title = `${res.name} renewal alert`;
      const message = `Resource "${res.name}" (${res.type}) ${daysText}.`;

      for (const recipient of recipients) {
        // --- Channel 1: In-App Notification ---
        const alreadySentInApp = await hasReminderBeenDispatched(
          res.id,
          "in_app",
          match.intervalDays,
          cycleKey
        );

        if (!alreadySentInApp) {
          try {
            await createNotification({
              workspaceId,
              userId: recipient.id,
              resourceId: res.id,
              title,
              message,
              type: match.type,
              severity: match.severity,
              metadata: {
                intervalDays: match.intervalDays,
                daysRemaining: match.daysRemaining,
                renewalDate: res.renewalDate,
                amountMinor: res.amountMinor,
                currency: res.currency,
              },
            });

            await recordReminderLog({
              workspaceId,
              resourceId: res.id,
              channel: "in_app",
              intervalDays: match.intervalDays,
              cycleKey,
              recipient: recipient.id,
              status: "sent",
            });

            summary.dispatchedInAppCount++;
          } catch (err) {
            summary.errors.push(
              `Failed in-app dispatch for resource ${res.id}: ${err instanceof Error ? err.message : "Unknown error"}`
            );
          }
        }

        // --- Channel 2: SMTP Email ---
        const alreadySentEmail = await hasReminderBeenDispatched(
          res.id,
          "email",
          match.intervalDays,
          cycleKey
        );

        if (!alreadySentEmail) {
          try {
            const emailResult = await sendRenewalReminderEmail({
              to: recipient.email,
              recipientName: recipient.name,
              resourceName: res.name,
              resourceType: res.type,
              provider: res.provider,
              daysRemaining: match.daysRemaining,
              renewalDate: res.renewalDate,
              amountMinor: res.amountMinor,
              currency: res.currency,
              billingCycle: res.billingCycle,
              resourceId: res.id,
            });

            await recordReminderLog({
              workspaceId,
              resourceId: res.id,
              channel: "email",
              intervalDays: match.intervalDays,
              cycleKey,
              recipient: recipient.email,
              status: emailResult.success ? "sent" : "failed",
            });

            if (emailResult.success) {
              summary.dispatchedEmailCount++;
            }
          } catch (err) {
            summary.errors.push(
              `Failed email dispatch for resource ${res.id}: ${err instanceof Error ? err.message : "Unknown error"}`
            );
          }
        }
      }

      // Emit outbound webhook event for dispatched reminder
      emitWorkspaceWebhook(workspaceId, "reminder.dispatched", {
        resourceId: res.id,
        resourceName: res.name,
        intervalDays: match.intervalDays,
        daysRemaining: match.daysRemaining,
        renewalDate: res.renewalDate,
        amountMinor: res.amountMinor,
        currency: res.currency,
      }).catch(() => {});
    }
  } catch (err) {
    summary.errors.push(
      `Engine error: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }

  return summary;
}
