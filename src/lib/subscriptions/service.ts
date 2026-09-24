import { and, eq, or, ilike, inArray, sql, desc, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { resources, users } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { convertCurrency, normalizeRecurringCost } from "@/lib/currency/rates";
import type {
  SubscriptionItem,
  SubscriptionMetrics,
  ListSubscriptionsOptions,
} from "./types";

export const SUBSCRIPTION_TYPES = [
  "subscription",
  "cloud_service",
  "hosting",
  "software_license",
] as const;

export async function listWorkspaceSubscriptions(
  userId: string,
  workspaceId: string,
  targetCurrency = "USD",
  options?: ListSubscriptionsOptions
): Promise<{
  items: SubscriptionItem[];
  metrics: SubscriptionMetrics;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}> {
  await requireWorkspaceRole(userId, workspaceId, "viewer");

  const db = getDb();

  // Base conditions: must be in workspace and of a recurring subscription type
  const baseConditions = [
    eq(resources.workspaceId, workspaceId),
    inArray(resources.type, [...SUBSCRIPTION_TYPES]),
  ];

  // Type filter
  if (options?.type && options.type !== "all") {
    baseConditions.push(eq(resources.type, options.type as never));
  }

  // Billing Cycle filter
  if (options?.billingCycle && options.billingCycle !== "all") {
    baseConditions.push(eq(resources.billingCycle, options.billingCycle));
  }

  // Status filter
  if (options?.status && options.status !== "all") {
    baseConditions.push(eq(resources.status, options.status));
  }

  // Search filter
  if (options?.search && options.search.trim() !== "") {
    const term = `%${options.search.trim()}%`;
    baseConditions.push(
      or(
        ilike(resources.name, term),
        ilike(resources.provider, term),
        ilike(resources.description, term),
        ilike(resources.websiteUrl, term)
      )!
    );
  }

  const page = Math.max(1, options?.page || 1);
  const pageSize = Math.min(50, Math.max(1, options?.pageSize || 20));
  const offset = (page - 1) * pageSize;

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
      createdAt: resources.createdAt,
      updatedAt: resources.updatedAt,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(resources)
    .leftJoin(users, eq(resources.ownerId, users.id))
    .where(and(...baseConditions))
    .orderBy(asc(resources.renewalDate), desc(resources.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Total count for current filter
  const [totalCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(resources)
    .where(and(...baseConditions));

  const total = Number(totalCountResult?.count || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Compute workspace subscription metrics across all active subscriptions
  const allWorkspaceSubscriptions = await db
    .select({
      name: resources.name,
      provider: resources.provider,
      amountMinor: resources.amountMinor,
      currency: resources.currency,
      billingCycle: resources.billingCycle,
      status: resources.status,
    })
    .from(resources)
    .where(
      and(
        eq(resources.workspaceId, workspaceId),
        inArray(resources.type, [...SUBSCRIPTION_TYPES])
      )
    );

  let monthlyBurnRateMinor = 0;
  let annualProjectedMinor = 0;
  let totalActiveSubscriptions = 0;
  let topVendorName = "";
  let topVendorAnnualMinor = 0;

  for (const item of allWorkspaceSubscriptions) {
    if (item.status === "active") {
      totalActiveSubscriptions++;
      const amount = item.amountMinor || 0;
      const normalizedInOriginal = normalizeRecurringCost(amount, item.billingCycle);

      const itemMonthlyInTarget = convertCurrency(
        normalizedInOriginal.monthlyMinor,
        item.currency,
        targetCurrency
      );
      const itemYearlyInTarget = convertCurrency(
        normalizedInOriginal.yearlyMinor,
        item.currency,
        targetCurrency
      );

      monthlyBurnRateMinor += itemMonthlyInTarget;
      annualProjectedMinor += itemYearlyInTarget;

      const vendorIdentifier = item.provider || item.name;
      if (itemYearlyInTarget > topVendorAnnualMinor) {
        topVendorAnnualMinor = itemYearlyInTarget;
        topVendorName = vendorIdentifier;
      }
    }
  }

  const items: SubscriptionItem[] = rawRows.map((row) => {
    const amount = row.amountMinor || 0;
    const normalizedInOriginal = normalizeRecurringCost(amount, row.billingCycle);

    const monthlyNormalized = convertCurrency(
      normalizedInOriginal.monthlyMinor,
      row.currency,
      targetCurrency
    );
    const yearlyNormalized = convertCurrency(
      normalizedInOriginal.yearlyMinor,
      row.currency,
      targetCurrency
    );

    return {
      id: row.id,
      workspaceId: row.workspaceId,
      name: row.name,
      type: row.type as SubscriptionItem["type"],
      status: row.status as SubscriptionItem["status"],
      category: row.category,
      provider: row.provider,
      websiteUrl: row.websiteUrl,
      amountMinor: row.amountMinor,
      currency: row.currency,
      billingCycle: row.billingCycle,
      renewalDate: row.renewalDate ? new Date(row.renewalDate) : null,
      autoRenew: row.autoRenew,
      monthlyNormalizedMinor: monthlyNormalized,
      yearlyNormalizedMinor: yearlyNormalized,
      ownerName: row.ownerName,
      ownerEmail: row.ownerEmail,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  });

  return {
    items,
    metrics: {
      monthlyBurnRateMinor,
      annualProjectedMinor,
      totalActiveSubscriptions,
      topVendor: topVendorName
        ? {
            name: topVendorName,
            annualCostMinor: topVendorAnnualMinor,
          }
        : null,
      currency: targetCurrency,
    },
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}
