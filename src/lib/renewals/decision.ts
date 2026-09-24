import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { resources } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { recordAuditEvent } from "@/lib/audit/service";
import { emitWorkspaceWebhook } from "@/lib/webhooks/dispatcher";
import { type RenewalDecision } from "./types";

export const ALLOWED_RENEWAL_DECISIONS: readonly RenewalDecision[] = [
  "none",
  "needs_review",
  "approved",
  "cancel",
  "negotiate",
] as const;

export interface UpdateRenewalDecisionInput {
  decision: RenewalDecision;
  notes?: string | null;
  cancellationNoticeDays?: number | null;
  cancellationDeadline?: Date | string | null;
}

/**
 * Calculates the cancellation notice deadline date by subtracting notice days from renewal date.
 */
export function calculateCancellationDeadline(
  renewalDate: Date | string | null | undefined,
  noticeDays: number | null | undefined
): Date | null {
  if (!renewalDate || noticeDays === null || noticeDays === undefined || isNaN(noticeDays) || noticeDays <= 0) {
    return null;
  }

  const rDate = new Date(renewalDate);
  if (isNaN(rDate.getTime())) {
    return null;
  }

  const deadline = new Date(rDate);
  deadline.setDate(deadline.getDate() - Math.round(noticeDays));
  return deadline;
}

/**
 * Updates the renewal governance decision for a resource.
 * Enforces member/admin/owner permissions, updates database, records audit log, and emits webhook.
 */
export async function updateRenewalDecision(
  userId: string,
  workspaceId: string,
  resourceId: string,
  input: UpdateRenewalDecisionInput
) {
  await requireWorkspaceRole(userId, workspaceId, "member");

  if (!ALLOWED_RENEWAL_DECISIONS.includes(input.decision)) {
    throw new Error(
      `Invalid renewal decision: "${input.decision}". Allowed decisions are: ${ALLOWED_RENEWAL_DECISIONS.join(", ")}`
    );
  }

  if (input.notes && input.notes.length > 1000) {
    throw new Error("Decision notes cannot exceed 1000 characters.");
  }

  if (
    input.cancellationNoticeDays !== undefined &&
    input.cancellationNoticeDays !== null &&
    (isNaN(input.cancellationNoticeDays) || input.cancellationNoticeDays < 0 || input.cancellationNoticeDays > 365)
  ) {
    throw new Error("Cancellation notice days must be an integer between 0 and 365.");
  }

  const db = getDb();

  const [existing] = await db
    .select({
      id: resources.id,
      name: resources.name,
      type: resources.type,
      renewalDate: resources.renewalDate,
      renewalDecision: resources.renewalDecision,
      decisionNotes: resources.decisionNotes,
      cancellationNoticeDays: resources.cancellationNoticeDays,
      cancellationDeadline: resources.cancellationDeadline,
      amountMinor: resources.amountMinor,
      currency: resources.currency,
    })
    .from(resources)
    .where(and(eq(resources.id, resourceId), eq(resources.workspaceId, workspaceId)))
    .limit(1);

  if (!existing) {
    throw new Error("Resource not found");
  }

  const noticeDays =
    input.cancellationNoticeDays !== undefined
      ? input.cancellationNoticeDays
      : existing.cancellationNoticeDays;

  // Determine cancellation deadline: manual input, or computed from renewalDate and noticeDays
  let computedDeadline: Date | null = null;
  if (input.cancellationDeadline !== undefined) {
    computedDeadline = input.cancellationDeadline ? new Date(input.cancellationDeadline) : null;
  } else if (noticeDays && existing.renewalDate) {
    computedDeadline = calculateCancellationDeadline(existing.renewalDate, noticeDays);
  } else {
    computedDeadline = existing.cancellationDeadline;
  }

  const now = new Date();

  const [updated] = await db
    .update(resources)
    .set({
      renewalDecision: input.decision,
      decisionNotes: input.notes !== undefined ? input.notes : existing.decisionNotes,
      cancellationNoticeDays: noticeDays,
      cancellationDeadline: computedDeadline,
      decidedByUserId: userId,
      decidedAt: now,
      updatedAt: now,
    })
    .where(eq(resources.id, resourceId))
    .returning();

  // Audit Log
  try {
    await recordAuditEvent({
      workspaceId,
      actorId: userId,
      action: "resource.renewal_decision",
      entityType: "resource",
      entityId: resourceId,
      entityName: existing.name,
      details: {
        previousDecision: existing.renewalDecision,
        newDecision: input.decision,
        notes: input.notes,
        cancellationNoticeDays: noticeDays,
        cancellationDeadline: computedDeadline ? computedDeadline.toISOString() : null,
      },
    });
  } catch {
    // Non-fatal audit log failure
  }

  // Webhook event
  try {
    await emitWorkspaceWebhook(workspaceId, "renewal.decision_updated", {
      resourceId,
      resourceName: existing.name,
      previousDecision: existing.renewalDecision,
      newDecision: input.decision,
      notes: input.notes,
      cancellationNoticeDays: noticeDays,
      cancellationDeadline: computedDeadline ? computedDeadline.toISOString() : null,
      decidedAt: now.toISOString(),
    });
  } catch {
    // Non-fatal webhook dispatch failure
  }

  return updated;
}
