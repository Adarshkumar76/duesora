import { eq, and, desc, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { resourceCostHistory } from "@/db/cost-history-schema";
import { resources, users } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { normalizeRecurringCost } from "@/lib/currency/rates";

export interface ResourceCostHistoryEntry {
  id: string;
  resourceId: string;
  workspaceId: string;
  previousAmountMinor: number | null;
  newAmountMinor: number;
  currency: string;
  previousBillingCycle: string | null;
  newBillingCycle: string | null;
  changePercentageBps: number;
  changePercentage: number;
  changedByUserId: string | null;
  changedByName?: string | null;
  changedByEmail?: string | null;
  changeReason: string | null;
  effectiveDate: Date;
  createdAt: Date;
}

export interface RecordCostChangeInput {
  resourceId: string;
  workspaceId: string;
  previousAmountMinor?: number | null;
  newAmountMinor: number;
  currency: string;
  previousBillingCycle?: string | null;
  newBillingCycle?: string | null;
  changedByUserId?: string | null;
  changeReason?: string | null;
  effectiveDate?: Date;
}

export interface WorkspacePriceHikeItem extends ResourceCostHistoryEntry {
  resourceName: string;
  resourceType: string;
}

/**
 * Calculates percentage shift in basis points (1% = 100 bps) based on normalized monthly costs.
 */
export function calculateCostChangeBps(
  prevAmountMinor: number | null | undefined,
  prevBillingCycle: string | null | undefined,
  newAmountMinor: number,
  newBillingCycle: string | null | undefined
): number {
  const prevAmount = prevAmountMinor ?? 0;
  const prevNorm = normalizeRecurringCost(prevAmount, prevBillingCycle);
  const newNorm = normalizeRecurringCost(newAmountMinor, newBillingCycle);

  if (prevNorm.monthlyMinor > 0) {
    const delta = newNorm.monthlyMinor - prevNorm.monthlyMinor;
    return Math.round((delta / prevNorm.monthlyMinor) * 10000);
  }

  if (newNorm.monthlyMinor > 0 && prevAmount <= 0) {
    return 10000; // 100% initial addition / upgrade from free
  }

  return 0;
}

/**
 * Records an entry in resource_cost_history.
 */
export async function recordResourceCostChange(
  input: RecordCostChangeInput
): Promise<ResourceCostHistoryEntry> {
  const db = getDb();

  const changeBps = calculateCostChangeBps(
    input.previousAmountMinor,
    input.previousBillingCycle,
    input.newAmountMinor,
    input.newBillingCycle
  );

  const [saved] = await db
    .insert(resourceCostHistory)
    .values({
      resourceId: input.resourceId,
      workspaceId: input.workspaceId,
      previousAmountMinor: input.previousAmountMinor ?? null,
      newAmountMinor: input.newAmountMinor,
      currency: input.currency.toUpperCase(),
      previousBillingCycle: input.previousBillingCycle ?? null,
      newBillingCycle: input.newBillingCycle ?? null,
      changePercentageBps: changeBps,
      changedByUserId: input.changedByUserId ?? null,
      changeReason: input.changeReason ?? null,
      effectiveDate: input.effectiveDate || new Date(),
    })
    .returning();

  return {
    ...saved,
    changePercentage: Number((saved.changePercentageBps / 100).toFixed(2)),
  };
}

/**
 * Lists the cost evolution timeline for a specific resource.
 */
export async function listResourceCostHistory(
  userId: string,
  workspaceId: string,
  resourceId: string
): Promise<ResourceCostHistoryEntry[]> {
  await requireWorkspaceRole(userId, workspaceId, "viewer");

  const db = getDb();

  const rows = await db
    .select({
      history: resourceCostHistory,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(resourceCostHistory)
    .leftJoin(users, eq(resourceCostHistory.changedByUserId, users.id))
    .where(
      and(
        eq(resourceCostHistory.workspaceId, workspaceId),
        eq(resourceCostHistory.resourceId, resourceId)
      )
    )
    .orderBy(desc(resourceCostHistory.effectiveDate), desc(resourceCostHistory.createdAt));

  return rows.map(({ history, actorName, actorEmail }) => ({
    id: history.id,
    resourceId: history.resourceId,
    workspaceId: history.workspaceId,
    previousAmountMinor: history.previousAmountMinor,
    newAmountMinor: history.newAmountMinor,
    currency: history.currency,
    previousBillingCycle: history.previousBillingCycle,
    newBillingCycle: history.newBillingCycle,
    changePercentageBps: history.changePercentageBps,
    changePercentage: Number((history.changePercentageBps / 100).toFixed(2)),
    changedByUserId: history.changedByUserId,
    changedByName: actorName,
    changedByEmail: actorEmail,
    changeReason: history.changeReason,
    effectiveDate: history.effectiveDate,
    createdAt: history.createdAt,
  }));
}

/**
 * Lists recent price hikes across the entire workspace (for reports & dashboards).
 */
export async function listWorkspacePriceChanges(
  userId: string,
  workspaceId: string,
  optionsOrLimit?: { limit?: number; onlyIncreases?: boolean } | number
): Promise<WorkspacePriceHikeItem[]> {
  await requireWorkspaceRole(userId, workspaceId, "viewer");

  const limit =
    typeof optionsOrLimit === "number" ? optionsOrLimit : optionsOrLimit?.limit ?? 10;
  const onlyIncreases =
    typeof optionsOrLimit === "object" ? optionsOrLimit.onlyIncreases : false;

  const db = getDb();

  const conditions = [eq(resourceCostHistory.workspaceId, workspaceId)];
  if (onlyIncreases) {
    conditions.push(gt(resourceCostHistory.changePercentageBps, 0));
  }

  const rows = await db
    .select({
      history: resourceCostHistory,
      resourceName: resources.name,
      resourceType: resources.type,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(resourceCostHistory)
    .innerJoin(resources, eq(resourceCostHistory.resourceId, resources.id))
    .leftJoin(users, eq(resourceCostHistory.changedByUserId, users.id))
    .where(and(...conditions))
    .orderBy(desc(resourceCostHistory.effectiveDate), desc(resourceCostHistory.createdAt))
    .limit(limit);

  return rows.map(({ history, resourceName, resourceType, actorName, actorEmail }) => ({
    id: history.id,
    resourceId: history.resourceId,
    workspaceId: history.workspaceId,
    resourceName,
    resourceType,
    previousAmountMinor: history.previousAmountMinor,
    newAmountMinor: history.newAmountMinor,
    currency: history.currency,
    previousBillingCycle: history.previousBillingCycle,
    newBillingCycle: history.newBillingCycle,
    changePercentageBps: history.changePercentageBps,
    changePercentage: Number((history.changePercentageBps / 100).toFixed(2)),
    changedByUserId: history.changedByUserId,
    changedByName: actorName,
    changedByEmail: actorEmail,
    changeReason: history.changeReason,
    effectiveDate: history.effectiveDate,
    createdAt: history.createdAt,
  }));
}
