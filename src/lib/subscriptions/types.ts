export interface SubscriptionItem {
  id: string;
  workspaceId: string;
  name: string;
  type: "subscription" | "cloud_service" | "hosting" | "software_license";
  status: "active" | "inactive" | "expired" | "archived";
  category: string | null;
  provider: string | null;
  websiteUrl: string | null;
  amountMinor: number | null;
  currency: string;
  billingCycle: string;
  renewalDate: Date | null;
  autoRenew: boolean;
  monthlyNormalizedMinor: number;
  yearlyNormalizedMinor: number;
  ownerName: string | null;
  ownerEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionMetrics {
  monthlyBurnRateMinor: number;
  annualProjectedMinor: number;
  totalActiveSubscriptions: number;
  topVendor: {
    name: string;
    annualCostMinor: number;
  } | null;
  currency: string;
}

export interface ListSubscriptionsOptions {
  search?: string | null;
  type?: "all" | "subscription" | "cloud_service" | "hosting" | "software_license" | null;
  billingCycle?: "all" | "monthly" | "yearly" | "quarterly" | "one_time" | null;
  status?: "all" | "active" | "inactive" | "expired" | null;
  page?: number;
  pageSize?: number;
}
