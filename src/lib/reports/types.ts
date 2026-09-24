export interface CategorySpend {
  category: string;
  count: number;
  annualSpendMinor: number;
  percentage: number;
}

export interface CadenceSpend {
  billingCycle: string;
  count: number;
  annualSpendMinor: number;
  percentage: number;
}

export interface CurrencyBreakdown {
  currency: string;
  count: number;
  rawTotalMinor: number;
  normalizedAnnualMinor: number;
  percentage: number;
}

export interface CostDriverItem {
  rank: number;
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
  shareOfTotalPct: number;
}

export interface ReportSummary {
  totalAnnualRunRateMinor: number;
  totalMonthlyRunRateMinor: number;
  averageAssetCostMinor: number;
  totalResources: number;
  payingResources: number;
  currency: string;
  categories: CategorySpend[];
  cadences: CadenceSpend[];
  currencies: CurrencyBreakdown[];
  topCostDrivers: CostDriverItem[];
}
