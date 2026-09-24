import { eq, and, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { workspaces, resources } from "@/db/schema";
import { workspaceBudgets } from "@/db/budget-schema";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { convertCurrency, normalizeRecurringCost, SUPPORTED_CURRENCIES } from "@/lib/currency/rates";
import { recordAuditEvent } from "@/lib/audit/service";
import type {
  WorkspaceBudget,
  WorkspaceBudgetStatus,
  UpdateBudgetInput,
} from "./types";

/**
 * Retrieves the budget configuration for a workspace.
 */
export async function getWorkspaceBudget(
  userId: string,
  workspaceId: string
): Promise<WorkspaceBudget | null> {
  await requireWorkspaceRole(userId, workspaceId, "viewer");

  const db = getDb();
  const [budget] = await db
    .select()
    .from(workspaceBudgets)
    .where(eq(workspaceBudgets.workspaceId, workspaceId));

  return (budget as WorkspaceBudget) || null;
}

/**
 * Creates or updates the budget settings for a workspace.
 * Requires Admin or Owner role.
 */
export async function upsertWorkspaceBudget(
  userId: string,
  workspaceId: string,
  input: UpdateBudgetInput,
  ipAddress?: string
): Promise<WorkspaceBudget> {
  await requireWorkspaceRole(userId, workspaceId, "admin");

  const db = getDb();

  // Validate threshold percentage
  let threshold = input.alertThresholdPct ?? 80;
  if (threshold < 1) threshold = 1;
  if (threshold > 100) threshold = 100;

  // Validate currency
  const currency = input.currency ? input.currency.toUpperCase() : "USD";
  if (!SUPPORTED_CURRENCIES.includes(currency as (typeof SUPPORTED_CURRENCIES)[number])) {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  // Validate minor amounts (must be >= 0 or null)
  const monthlyMinor =
    input.monthlyBudgetMinor !== undefined
      ? input.monthlyBudgetMinor === null
        ? null
        : Math.max(0, Math.round(input.monthlyBudgetMinor))
      : null;

  const annualMinor =
    input.annualBudgetMinor !== undefined
      ? input.annualBudgetMinor === null
        ? null
        : Math.max(0, Math.round(input.annualBudgetMinor))
      : null;

  const alertEmails = input.alertEmailsEnabled ?? true;

  const [savedBudget] = await db
    .insert(workspaceBudgets)
    .values({
      workspaceId,
      monthlyBudgetMinor: monthlyMinor,
      annualBudgetMinor: annualMinor,
      currency,
      alertThresholdPct: threshold,
      alertEmailsEnabled: alertEmails,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: workspaceBudgets.workspaceId,
      set: {
        monthlyBudgetMinor: monthlyMinor,
        annualBudgetMinor: annualMinor,
        currency,
        alertThresholdPct: threshold,
        alertEmailsEnabled: alertEmails,
        updatedAt: new Date(),
      },
    })
    .returning();

  // Record audit log
  await recordAuditEvent({
    workspaceId,
    actorId: userId,
    action: "budget.updated",
    entityType: "workspace_budget",
    entityId: savedBudget.id,
    entityName: `Budget (${currency})`,
    details: {
      monthlyBudgetMinor: monthlyMinor,
      annualBudgetMinor: annualMinor,
      currency,
      alertThresholdPct: threshold,
      alertEmailsEnabled: alertEmails,
    },
    ipAddress,
  });

  return savedBudget as WorkspaceBudget;
}

/**
 * Calculates current spend velocity (MRR & ARR) against configured budget targets.
 * Computes burn percentage and threshold breach states.
 */
export async function getWorkspaceBudgetStatus(
  userId: string,
  workspaceId: string
): Promise<WorkspaceBudgetStatus> {
  await requireWorkspaceRole(userId, workspaceId, "viewer");

  const db = getDb();

  // 1. Fetch workspace default currency
  const [workspace] = await db
    .select({
      id: workspaces.id,
      defaultCurrency: workspaces.defaultCurrency,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId));

  // 2. Fetch configured budget
  const [budgetRecord] = await db
    .select()
    .from(workspaceBudgets)
    .where(eq(workspaceBudgets.workspaceId, workspaceId));

  const budget = (budgetRecord as WorkspaceBudget) || null;
  const currency = budget?.currency || workspace?.defaultCurrency || "USD";
  const alertThresholdPct = budget?.alertThresholdPct ?? 80;
  const alertEmailsEnabled = budget?.alertEmailsEnabled ?? true;

  // 3. Fetch active resources
  const rawResources = await db
    .select({
      amountMinor: resources.amountMinor,
      currency: resources.currency,
      billingCycle: resources.billingCycle,
      status: resources.status,
    })
    .from(resources)
    .where(
      and(
        eq(resources.workspaceId, workspaceId),
        eq(resources.status, "active")
      )
    );

  let totalMonthlySpendMinor = 0;
  let totalAnnualSpendMinor = 0;

  for (const item of rawResources) {
    const rawAmount = item.amountMinor || 0;
    if (rawAmount <= 0) continue;

    const normalized = normalizeRecurringCost(rawAmount, item.billingCycle);
    const itemMonthlyInTarget = convertCurrency(
      normalized.monthlyMinor,
      item.currency,
      currency
    );
    const itemAnnualInTarget = convertCurrency(
      normalized.yearlyMinor,
      item.currency,
      currency
    );

    totalMonthlySpendMinor += itemMonthlyInTarget;
    totalAnnualSpendMinor += itemAnnualInTarget;
  }

  // 4. Calculate monthly metrics
  const monthlyBudgetMinor = budget?.monthlyBudgetMinor ?? null;
  const monthlyBurnPercentage =
    monthlyBudgetMinor !== null && monthlyBudgetMinor > 0
      ? Number(((totalMonthlySpendMinor / monthlyBudgetMinor) * 100).toFixed(1))
      : null;
  const monthlyIsWarning =
    monthlyBurnPercentage !== null && monthlyBurnPercentage >= alertThresholdPct;
  const monthlyIsExceeded =
    monthlyBurnPercentage !== null && monthlyBurnPercentage >= 100;
  const monthlyRemainingMinor =
    monthlyBudgetMinor !== null ? monthlyBudgetMinor - totalMonthlySpendMinor : null;

  // 5. Calculate annual metrics
  const annualBudgetMinor = budget?.annualBudgetMinor ?? null;
  const annualBurnPercentage =
    annualBudgetMinor !== null && annualBudgetMinor > 0
      ? Number(((totalAnnualSpendMinor / annualBudgetMinor) * 100).toFixed(1))
      : null;
  const annualIsWarning =
    annualBurnPercentage !== null && annualBurnPercentage >= alertThresholdPct;
  const annualIsExceeded =
    annualBurnPercentage !== null && annualBurnPercentage >= 100;
  const annualRemainingMinor =
    annualBudgetMinor !== null ? annualBudgetMinor - totalAnnualSpendMinor : null;

  const hasBudgetConfigured = Boolean(
    (monthlyBudgetMinor !== null && monthlyBudgetMinor > 0) ||
      (annualBudgetMinor !== null && annualBudgetMinor > 0)
  );

  return {
    budget,
    currency,
    monthly: {
      budgetMinor: monthlyBudgetMinor,
      spendMinor: totalMonthlySpendMinor,
      burnPercentage: monthlyBurnPercentage,
      isWarning: monthlyIsWarning,
      isExceeded: monthlyIsExceeded,
      remainingMinor: monthlyRemainingMinor,
    },
    annual: {
      budgetMinor: annualBudgetMinor,
      spendMinor: totalAnnualSpendMinor,
      burnPercentage: annualBurnPercentage,
      isWarning: annualIsWarning,
      isExceeded: annualIsExceeded,
      remainingMinor: annualRemainingMinor,
    },
    alertThresholdPct,
    alertEmailsEnabled,
    hasBudgetConfigured,
  };
}
