import { getDb } from "@/db";
import { resources, users, memberships, workspaces } from "@/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";
import {
  createNotification,
  hasReminderBeenDispatched,
  recordReminderLog,
} from "./repository";
import { sendRenewalReminderEmail } from "./email";
import { emitWorkspaceWebhook } from "@/lib/webhooks/dispatcher";
import { dispatchRenewalChatAlert } from "@/lib/integrations/chat/dispatcher";
import { recordAuditEvent } from "@/lib/audit/service";

export const REMINDER_INTERVALS = [30, 14, 7, 3, 1, 0] as const;

export interface ReminderMatch {
  intervalDays: number;
  severity: "info" | "warning" | "critical";
  type: "renewal_upcoming" | "renewal_overdue";
  daysRemaining: number;
}

export interface ReminderEngineOptions {
  escalationDays?: number; // Days remaining threshold to trigger admin escalation (default: 3)
  enableEscalation?: boolean; // Whether admin escalation policy is enabled (default: true)
  reminderDays?: number[]; // Custom reminder intervals
}

export interface EngineRunSummary {
  workspaceId: string;
  scannedCount: number;
  dispatchedInAppCount: number;
  dispatchedEmailCount: number;
  escalatedCount: number;
  skippedCount: number;
  errors: string[];
}

/**
 * Calculates which reminder interval (if any) matches the given renewal date relative to now.
 */
export function calculateReminderMatch(
  renewalDate: Date,
  nowDate: Date = new Date(),
  configuredIntervals: number[] = [30, 14, 7, 3, 1, 0]
): ReminderMatch | null {
  const renewalMs = new Date(renewalDate).getTime();
  const nowMs = nowDate.getTime();

  // Difference in fractional days
  const diffDays = Math.ceil((renewalMs - nowMs) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    if (configuredIntervals.includes(0)) {
      return {
        intervalDays: 0,
        severity: "critical",
        type: "renewal_overdue",
        daysRemaining: diffDays,
      };
    }
    return null;
  }

  // Sort configured intervals ascending to match the nearest upcoming horizon
  const positiveIntervals = configuredIntervals.filter((i) => i > 0).sort((a, b) => a - b);
  for (const interval of positiveIntervals) {
    if (diffDays <= interval) {
      const severity: "info" | "warning" | "critical" =
        interval <= 1 ? "critical" : interval <= 7 ? "warning" : "info";
      return {
        intervalDays: interval,
        severity,
        type: "renewal_upcoming",
        daysRemaining: diffDays,
      };
    }
  }

  return null;
}

/**
 * Scans a workspace for resources due for renewal reminders and dispatches
 * both in-app and SMTP email notifications with cycle-based deduplication.
 */
export async function processWorkspaceReminders(
  workspaceId: string,
  options?: ReminderEngineOptions
): Promise<EngineRunSummary> {
  const db = getDb();
  const now = new Date();

  const summary: EngineRunSummary = {
    workspaceId,
    scannedCount: 0,
    dispatchedInAppCount: 0,
    dispatchedEmailCount: 0,
    escalatedCount: 0,
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
        reminderDays: workspaces.reminderDays,
      })
      .from(resources)
      .leftJoin(users, eq(resources.ownerId, users.id))
      .leftJoin(workspaces, eq(resources.workspaceId, workspaces.id))
      .where(
        and(
          eq(resources.workspaceId, workspaceId),
          eq(resources.status, "active"),
          isNotNull(resources.renewalDate)
        )
      );

    summary.scannedCount = candidateResources.length;

    // Determine configured reminder intervals (options or workspace settings or default)
    let configuredIntervals: number[] = options?.reminderDays || [30, 14, 7, 3, 1, 0];
    if (!options?.reminderDays && candidateResources[0]?.reminderDays) {
      try {
        const parsed = JSON.parse(candidateResources[0].reminderDays);
        if (Array.isArray(parsed) && parsed.length > 0) {
          configuredIntervals = parsed;
        }
      } catch {
        // use default
      }
    }

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

      const match = calculateReminderMatch(res.renewalDate, now, configuredIntervals);
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

      // --- Escalation Policy: If renewal is critical (<= escalationDays, default 3) ---
      const escalationThreshold = options?.escalationDays ?? 3;
      const isEscalationEnabled = options?.enableEscalation !== false;
      const isCriticalWindow = match.daysRemaining <= escalationThreshold;

      if (isEscalationEnabled && isCriticalWindow) {
        // Target all workspace Admins and Owners
        const adminTargets = workspaceAdmins.filter(
          (m) => m.role === "owner" || m.role === "admin"
        );

        let didEscalateAny = false;

        for (const admin of adminTargets) {
          // 1. Escalated In-App Notification
          const alreadyEscalatedInApp = await hasReminderBeenDispatched(
            res.id,
            "escalation_in_app",
            match.intervalDays,
            cycleKey
          );

          if (!alreadyEscalatedInApp) {
            try {
              const escalationTitle =
                match.daysRemaining <= 0
                  ? `🚨 [ESCALATION] OVERDUE: "${res.name}" renewal missed`
                  : `⚠️ [ESCALATION] Urgent: "${res.name}" renews in ${match.daysRemaining} day${match.daysRemaining === 1 ? "" : "s"}`;

              const ownerInfo = item.ownerName || item.ownerEmail || "Unassigned";
              const escalationMsg = `Action required: "${res.name}" (${res.type}) ${daysText}. Assigned owner: ${ownerInfo}. Escalated to workspace administration.`;

              await createNotification({
                workspaceId,
                userId: admin.id,
                resourceId: res.id,
                title: escalationTitle,
                message: escalationMsg,
                type: match.type,
                severity: "critical",
                metadata: {
                  intervalDays: match.intervalDays,
                  daysRemaining: match.daysRemaining,
                  renewalDate: res.renewalDate,
                  amountMinor: res.amountMinor,
                  currency: res.currency,
                  isEscalation: true,
                  assignedOwnerId: res.ownerId || null,
                  assignedOwnerName: item.ownerName || null,
                },
              });

              await recordReminderLog({
                workspaceId,
                resourceId: res.id,
                channel: "escalation_in_app",
                intervalDays: match.intervalDays,
                cycleKey,
                recipient: admin.id,
                status: "sent",
              });

              summary.dispatchedInAppCount++;
              summary.escalatedCount++;
              didEscalateAny = true;
            } catch (err) {
              summary.errors.push(
                `Failed escalation in-app dispatch for resource ${res.id} to admin ${admin.id}: ${err instanceof Error ? err.message : "Unknown error"}`
              );
            }
          }

          // 2. Escalated Email Notification
          const alreadyEscalatedEmail = await hasReminderBeenDispatched(
            res.id,
            "escalation_email",
            match.intervalDays,
            cycleKey
          );

          if (!alreadyEscalatedEmail) {
            try {
              const emailResult = await sendRenewalReminderEmail({
                to: admin.email,
                recipientName: admin.name,
                resourceName: res.name,
                resourceType: res.type,
                provider: res.provider,
                daysRemaining: match.daysRemaining,
                renewalDate: res.renewalDate,
                amountMinor: res.amountMinor,
                currency: res.currency,
                billingCycle: res.billingCycle,
                resourceId: res.id,
                isEscalated: true,
                escalatedReason: `This renewal is ${match.daysRemaining <= 0 ? "overdue" : `due in ${match.daysRemaining} day(s)`} and has been escalated to workspace administration (Assigned owner: ${item.ownerName || item.ownerEmail || "Unassigned"}).`,
              });

              await recordReminderLog({
                workspaceId,
                resourceId: res.id,
                channel: "escalation_email",
                intervalDays: match.intervalDays,
                cycleKey,
                recipient: admin.email,
                status: emailResult.success ? "sent" : "failed",
              });

              if (emailResult.success) {
                summary.dispatchedEmailCount++;
              }
            } catch (err) {
              summary.errors.push(
                `Failed escalation email dispatch for resource ${res.id} to admin ${admin.email}: ${err instanceof Error ? err.message : "Unknown error"}`
              );
            }
          }
        }

        if (didEscalateAny) {
          // Record Audit Event for Governance & Compliance
          await recordAuditEvent({
            workspaceId,
            action: "reminder.escalated",
            entityType: "resource",
            entityId: res.id,
            entityName: res.name,
            details: {
              daysRemaining: match.daysRemaining,
              intervalDays: match.intervalDays,
              ownerId: res.ownerId || null,
              ownerEmail: item.ownerEmail || null,
              adminsEscalatedCount: adminTargets.length,
            },
          });

          // Dispatch escalation webhook
          emitWorkspaceWebhook(workspaceId, "reminder.escalated", {
            resourceId: res.id,
            resourceName: res.name,
            intervalDays: match.intervalDays,
            daysRemaining: match.daysRemaining,
            renewalDate: res.renewalDate,
            amountMinor: res.amountMinor,
            currency: res.currency,
            assignedOwner: item.ownerEmail || null,
            adminsEscalatedCount: adminTargets.length,
          }).catch(() => {});

          // Dispatch escalation alert to Slack/Discord
          dispatchRenewalChatAlert(workspaceId, {
            resourceId: res.id,
            resourceName: res.name,
            resourceType: res.type,
            provider: res.provider,
            daysRemaining: match.daysRemaining,
            renewalDate: res.renewalDate,
            amountMinor: res.amountMinor,
            currency: res.currency,
            billingCycle: res.billingCycle,
            isEscalated: true,
          }).catch(() => {});
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

      // Dispatch alert to Slack / Discord channels
      dispatchRenewalChatAlert(workspaceId, {
        resourceId: res.id,
        resourceName: res.name,
        resourceType: res.type,
        provider: res.provider,
        daysRemaining: match.daysRemaining,
        renewalDate: res.renewalDate,
        amountMinor: res.amountMinor,
        currency: res.currency,
        billingCycle: res.billingCycle,
      }).catch(() => {});
    }
  } catch (err) {
    summary.errors.push(
      `Engine error: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }

  return summary;
}
