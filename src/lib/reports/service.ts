import { and, eq, ne, isNotNull } from "drizzle-orm";
import { getDb } from "@/db";
import { resources } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { convertCurrency, normalizeRecurringCost } from "@/lib/currency/rates";
import type {
  ReportSummary,
  CategorySpend,
  CadenceSpend,
  CurrencyBreakdown,
  CostDriverItem,
} from "./types";

export async function getWorkspaceSpendReport(
  userId: string,
  workspaceId: string,
  targetCurrency = "USD"
): Promise<ReportSummary> {
  await requireWorkspaceRole(userId, workspaceId, "viewer");

  const db = getDb();

  const rawResources = await db
    .select({
      id: resources.id,
      name: resources.name,
      type: resources.type,
      status: resources.status,
      category: resources.category,
      provider: resources.provider,
      amountMinor: resources.amountMinor,
      currency: resources.currency,
      billingCycle: resources.billingCycle,
    })
    .from(resources)
    .where(
      and(
        eq(resources.workspaceId, workspaceId),
        ne(resources.status, "archived")
      )
    );

  let totalAnnualRunRateMinor = 0;
  let totalMonthlyRunRateMinor = 0;
  let payingResources = 0;

  const categoryMap = new Map<string, { count: number; annualMinor: number }>();
  const cadenceMap = new Map<string, { count: number; annualMinor: number }>();
  const currencyMap = new Map<
    string,
    { count: number; rawMinor: number; normalizedMinor: number }
  >();

  const itemDetails: {
    id: string;
    name: string;
    category: string | null;
    type: string;
    provider: string | null;
    amountMinor: number | null;
    currency: string;
    billingCycle: string;
    annualNormalizedMinor: number;
    monthlyNormalizedMinor: number;
  }[] = [];

  for (const item of rawResources) {
    const rawAmount = item.amountMinor || 0;
    const isPaying = rawAmount > 0 && item.status === "active";
    if (isPaying) payingResources++;

    const normalizedOriginal = normalizeRecurringCost(rawAmount, item.billingCycle);
    const annualInTarget = isPaying
      ? convertCurrency(normalizedOriginal.yearlyMinor, item.currency, targetCurrency)
      : 0;
    const monthlyInTarget = isPaying
      ? convertCurrency(normalizedOriginal.monthlyMinor, item.currency, targetCurrency)
      : 0;

    totalAnnualRunRateMinor += annualInTarget;
    totalMonthlyRunRateMinor += monthlyInTarget;

    // Category aggregation
    const cat = item.category || (item.type ? item.type.replace("_", " ") : "uncategorized");
    const existingCat = categoryMap.get(cat) || { count: 0, annualMinor: 0 };
    categoryMap.set(cat, {
      count: existingCat.count + 1,
      annualMinor: existingCat.annualMinor + annualInTarget,
    });

    // Cadence aggregation
    const cycle = item.billingCycle || "yearly";
    const existingCadence = cadenceMap.get(cycle) || { count: 0, annualMinor: 0 };
    cadenceMap.set(cycle, {
      count: existingCadence.count + 1,
      annualMinor: existingCadence.annualMinor + annualInTarget,
    });

    // Currency aggregation
    const curr = (item.currency || "USD").toUpperCase();
    const existingCurrency = currencyMap.get(curr) || {
      count: 0,
      rawMinor: 0,
      normalizedMinor: 0,
    };
    currencyMap.set(curr, {
      count: existingCurrency.count + 1,
      rawMinor: existingCurrency.rawMinor + (isPaying ? rawAmount : 0),
      normalizedMinor: existingCurrency.normalizedMinor + annualInTarget,
    });

    itemDetails.push({
      id: item.id,
      name: item.name,
      category: item.category,
      type: item.type,
      provider: item.provider,
      amountMinor: item.amountMinor,
      currency: item.currency,
      billingCycle: item.billingCycle,
      annualNormalizedMinor: annualInTarget,
      monthlyNormalizedMinor: monthlyInTarget,
    });
  }

  // Calculate percentages and sort categories
  const categories: CategorySpend[] = Array.from(categoryMap.entries())
    .map(([category, val]) => ({
      category,
      count: val.count,
      annualSpendMinor: val.annualMinor,
      percentage:
        totalAnnualRunRateMinor > 0
          ? Math.round((val.annualMinor / totalAnnualRunRateMinor) * 100)
          : 0,
    }))
    .sort((a, b) => b.annualSpendMinor - a.annualSpendMinor);

  // Cadences
  const cadences: CadenceSpend[] = Array.from(cadenceMap.entries())
    .map(([billingCycle, val]) => ({
      billingCycle,
      count: val.count,
      annualSpendMinor: val.annualMinor,
      percentage:
        totalAnnualRunRateMinor > 0
          ? Math.round((val.annualMinor / totalAnnualRunRateMinor) * 100)
          : 0,
    }))
    .sort((a, b) => b.annualSpendMinor - a.annualSpendMinor);

  // Currencies
  const currencies: CurrencyBreakdown[] = Array.from(currencyMap.entries())
    .map(([currency, val]) => ({
      currency,
      count: val.count,
      rawTotalMinor: val.rawMinor,
      normalizedAnnualMinor: val.normalizedMinor,
      percentage:
        totalAnnualRunRateMinor > 0
          ? Math.round((val.normalizedMinor / totalAnnualRunRateMinor) * 100)
          : 0,
    }))
    .sort((a, b) => b.normalizedAnnualMinor - a.normalizedAnnualMinor);

  // Top 10 cost drivers
  const topCostDrivers: CostDriverItem[] = itemDetails
    .filter((i) => i.annualNormalizedMinor > 0)
    .sort((a, b) => b.annualNormalizedMinor - a.annualNormalizedMinor)
    .slice(0, 10)
    .map((item, idx) => ({
      rank: idx + 1,
      ...item,
      shareOfTotalPct:
        totalAnnualRunRateMinor > 0
          ? Number(((item.annualNormalizedMinor / totalAnnualRunRateMinor) * 100).toFixed(1))
          : 0,
    }));

  const totalResources = rawResources.length;
  const averageAssetCostMinor =
    payingResources > 0 ? Math.round(totalAnnualRunRateMinor / payingResources) : 0;

  return {
    totalAnnualRunRateMinor,
    totalMonthlyRunRateMinor,
    averageAssetCostMinor,
    totalResources,
    payingResources,
    currency: targetCurrency,
    categories,
    cadences,
    currencies,
    topCostDrivers,
  };
}
