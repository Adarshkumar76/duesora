import { and, eq, or, ilike, isNotNull, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db";
import { resources, users } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { convertCurrency } from "@/lib/currency/rates";
import { emitWorkspaceWebhook } from "@/lib/webhooks/dispatcher";
import { recordAuditEvent } from "@/lib/audit/service";
import type {
  RenewalItem,
  RenewalMetrics,
  UrgencyBucket,
  ListRenewalsOptions,
} from "./types";

export function calculateNextRenewalDate(
  currentDate: Date | null | undefined,
  billingCycle: string | null | undefined
): Date {
  const cycle = (billingCycle || "yearly").toLowerCase();

  // If one_time or lifetime, return today or existing date
  if (cycle === "one_time" || cycle === "lifetime") {
    return currentDate ? new Date(currentDate) : new Date();
  }

  const base =
    currentDate && !isNaN(new Date(currentDate).getTime())
      ? new Date(currentDate)
      : new Date();

  const next = new Date(base);

  if (cycle === "monthly") {
    next.setMonth(next.getMonth() + 1);
  } else if (cycle === "quarterly") {
    next.setMonth(next.getMonth() + 3);
  } else {
    // yearly
    next.setFullYear(next.getFullYear() + 1);
  }

  // Roll forward if next is still in the past
  const now = new Date();
  while (next <= now) {
    if (cycle === "monthly") {
      next.setMonth(next.getMonth() + 1);
    } else if (cycle === "quarterly") {
      next.setMonth(next.getMonth() + 3);
    } else {
      next.setFullYear(next.getFullYear() + 1);
    }
  }

  return next;
}

export function determineUrgencyBucket(diffDays: number): UrgencyBucket {
  if (diffDays < 0) return "overdue";
  if (diffDays <= 7) return "critical";
  if (diffDays <= 30) return "upcoming";
  if (diffDays <= 90) return "medium";
  return "later";
}

export async function renewWorkspaceResource(
  userId: string,
  workspaceId: string,
  resourceId: string
) {
  await requireWorkspaceRole(userId, workspaceId, "member");

  const db = getDb();

  const [existing] = await db
    .select()
    .from(resources)
    .where(
      and(
        eq(resources.id, resourceId),
        eq(resources.workspaceId, workspaceId)
      )
    )
    .limit(1);

  if (!existing) {
    throw new Error("Resource not found");
  }

  const nextRenewalDate = calculateNextRenewalDate(
    existing.renewalDate,
    existing.billingCycle
  );

  const [updated] = await db
    .update(resources)
    .set({
      renewalDate: nextRenewalDate,
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(resources.id, resourceId))
    .returning();

  emitWorkspaceWebhook(workspaceId, "resource.renewed", {
    resourceId,
    previousRenewalDate: existing.renewalDate,
    nextRenewalDate,
    billingCycle: existing.billingCycle,
  }).catch(() => {});

  recordAuditEvent({
    workspaceId,
    actorId: userId,
    action: "resource.renewed",
    entityType: "resource",
    entityId: resourceId,
    entityName: existing.name,
    details: {
      previousRenewalDate: existing.renewalDate,
      nextRenewalDate,
      billingCycle: existing.billingCycle,
    },
  }).catch(() => {});

  return updated;
}

export async function listWorkspaceRenewals(
  userId: string,
  workspaceId: string,
  targetCurrency = "USD",
  options?: ListRenewalsOptions
): Promise<{
  items: RenewalItem[];
  metrics: RenewalMetrics;
}> {
  await requireWorkspaceRole(userId, workspaceId, "viewer");

  const db = getDb();

  const baseConditions = [
    eq(resources.workspaceId, workspaceId),
    isNotNull(resources.renewalDate),
  ];

  if (options?.type && options.type !== "all") {
    baseConditions.push(eq(resources.type, options.type as never));
  }

  if (options?.search && options.search.trim() !== "") {
    const term = `%${options.search.trim()}%`;
    baseConditions.push(
      or(
        ilike(resources.name, term),
        ilike(resources.provider, term),
        ilike(resources.description, term),
        ilike(resources.category, term)
      )!
    );
  }

  const decidedUsers = alias(users, "decided_users");

  const rawRows = await db
    .select({
      id: resources.id,
      workspaceId: resources.workspaceId,
      name: resources.name,
      type: resources.type,
      status: resources.status,
      category: resources.category,
      provider: resources.provider,
      websiteUrl: resources.websiteUrl,
      amountMinor: resources.amountMinor,
      currency: resources.currency,
      billingCycle: resources.billingCycle,
      renewalDate: resources.renewalDate,
      autoRenew: resources.autoRenew,
      renewalDecision: resources.renewalDecision,
      decisionNotes: resources.decisionNotes,
      cancellationNoticeDays: resources.cancellationNoticeDays,
      cancellationDeadline: resources.cancellationDeadline,
      decidedByUserId: resources.decidedByUserId,
      decidedByName: decidedUsers.name,
      decidedAt: resources.decidedAt,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(resources)
    .leftJoin(users, eq(resources.ownerId, users.id))
    .leftJoin(decidedUsers, eq(resources.decidedByUserId, decidedUsers.id))
    .where(and(...baseConditions))
    .orderBy(asc(resources.renewalDate));

  const now = new Date();

  // Metrics calculation
  let overdueCount = 0;
  let overdueCostMinor = 0;
  let next7DaysCount = 0;
  let next7DaysCostMinor = 0;
  let next30DaysCount = 0;
  let next30DaysCostMinor = 0;
  let next90DaysCount = 0;
  let next90DaysCostMinor = 0;

  // Governance decision metrics
  let needsReviewCount = 0;
  let approvedCount = 0;
  let cancelCount = 0;
  let projectedSavingsMinor = 0;
  let negotiateCount = 0;

  const processedItems: RenewalItem[] = [];

  for (const row of rawRows) {
    if (!row.renewalDate) continue;

    const rDate = new Date(row.renewalDate);
    const diffDays = Math.ceil((rDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const urgencyBucket = determineUrgencyBucket(diffDays);

    const convertedCost = convertCurrency(
      row.amountMinor || 0,
      row.currency,
      targetCurrency
    );

    // Aggregate urgency metrics
    if (diffDays < 0) {
      overdueCount++;
      overdueCostMinor += convertedCost;
    } else if (diffDays <= 7) {
      next7DaysCount++;
      next7DaysCostMinor += convertedCost;
    } else if (diffDays <= 30) {
      next30DaysCount++;
      next30DaysCostMinor += convertedCost;
    } else if (diffDays <= 90) {
      next90DaysCount++;
      next90DaysCostMinor += convertedCost;
    }

    // Aggregate governance metrics
    const decision = (row.renewalDecision || "none") as RenewalItem["renewalDecision"];
    if (decision === "needs_review") needsReviewCount++;
    else if (decision === "approved") approvedCount++;
    else if (decision === "cancel") {
      cancelCount++;
      projectedSavingsMinor += convertedCost;
    } else if (decision === "negotiate") {
      negotiateCount++;
    }

    let noticeDaysRemaining: number | null = null;
    let cancellationDeadlineDate: Date | null = null;
    if (row.cancellationDeadline) {
      cancellationDeadlineDate = new Date(row.cancellationDeadline);
      noticeDaysRemaining = Math.ceil(
        (cancellationDeadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    processedItems.push({
      id: row.id,
      workspaceId: row.workspaceId,
      name: row.name,
      type: row.type,
      status: row.status as RenewalItem["status"],
      category: row.category,
      provider: row.provider,
      websiteUrl: row.websiteUrl,
      amountMinor: row.amountMinor,
      currency: row.currency,
      billingCycle: row.billingCycle,
      renewalDate: rDate,
      autoRenew: row.autoRenew,
      diffDays,
      urgencyBucket,
      normalizedCostMinor: convertedCost,
      ownerName: row.ownerName,
      ownerEmail: row.ownerEmail,
      renewalDecision: decision,
      decisionNotes: row.decisionNotes,
      cancellationNoticeDays: row.cancellationNoticeDays,
      cancellationDeadline: cancellationDeadlineDate,
      decidedByUserId: row.decidedByUserId,
      decidedByName: row.decidedByName,
      decidedAt: row.decidedAt ? new Date(row.decidedAt) : null,
      noticeDaysRemaining,
    });
  }

  // Filter items by bucket and decision if requested
  let filteredItems = processedItems;

  if (options?.bucket && options.bucket !== "all") {
    filteredItems = filteredItems.filter((item) => item.urgencyBucket === options.bucket);
  }

  if (options?.decision && options.decision !== "all") {
    filteredItems = filteredItems.filter((item) => item.renewalDecision === options.decision);
  }

  return {
    items: filteredItems,
    metrics: {
      overdueCount,
      overdueCostMinor,
      next7DaysCount,
      next7DaysCostMinor,
      next30DaysCount,
      next30DaysCostMinor,
      next90DaysCount,
      next90DaysCostMinor,
      currency: targetCurrency,
      needsReviewCount,
      approvedCount,
      cancelCount,
      projectedSavingsMinor,
      negotiateCount,
    },
  };
}
