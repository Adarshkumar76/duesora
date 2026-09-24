export type UrgencyBucket =
  | "overdue"
  | "critical" // <= 7 days
  | "upcoming" // <= 30 days
  | "medium"   // <= 90 days
  | "later";

export type RenewalDecision =
  | "none"
  | "needs_review"
  | "approved"
  | "cancel"
  | "negotiate";

export interface RenewalItem {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  status: "active" | "inactive" | "expired" | "archived";
  category: string | null;
  provider: string | null;
  websiteUrl: string | null;
  amountMinor: number | null;
  currency: string;
  billingCycle: string;
  renewalDate: Date;
  autoRenew: boolean;
  diffDays: number;
  urgencyBucket: UrgencyBucket;
  normalizedCostMinor: number;
  ownerName: string | null;
  ownerEmail: string | null;

  // Renewal Decision & Cancellation Window fields
  renewalDecision: RenewalDecision;
  decisionNotes: string | null;
  cancellationNoticeDays: number | null;
  cancellationDeadline: Date | null;
  decidedByUserId: string | null;
  decidedByName: string | null;
  decidedAt: Date | null;
  noticeDaysRemaining: number | null;
}

export interface RenewalMetrics {
  overdueCount: number;
  overdueCostMinor: number;
  next7DaysCount: number;
  next7DaysCostMinor: number;
  next30DaysCount: number;
  next30DaysCostMinor: number;
  next90DaysCount: number;
  next90DaysCostMinor: number;
  currency: string;

  // Governance decision metrics
  needsReviewCount: number;
  approvedCount: number;
  cancelCount: number;
  projectedSavingsMinor: number;
  negotiateCount: number;
}

export interface ListRenewalsOptions {
  bucket?: "all" | UrgencyBucket | null;
  search?: string | null;
  type?: string | null;
  decision?: "all" | RenewalDecision | null;
}
