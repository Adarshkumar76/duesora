export interface WorkspaceBudget {
  id: string;
  workspaceId: string;
  monthlyBudgetMinor: number | null;
  annualBudgetMinor: number | null;
  currency: string;
  alertThresholdPct: number;
  alertEmailsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceBudgetStatus {
  budget: WorkspaceBudget | null;
  currency: string;
  monthly: {
    budgetMinor: number | null;
    spendMinor: number;
    burnPercentage: number | null;
    isWarning: boolean;
    isExceeded: boolean;
    remainingMinor: number | null;
  };
  annual: {
    budgetMinor: number | null;
    spendMinor: number;
    burnPercentage: number | null;
    isWarning: boolean;
    isExceeded: boolean;
    remainingMinor: number | null;
  };
  alertThresholdPct: number;
  alertEmailsEnabled: boolean;
  hasBudgetConfigured: boolean;
}

export interface UpdateBudgetInput {
  monthlyBudgetMinor?: number | null;
  annualBudgetMinor?: number | null;
  currency?: string;
  alertThresholdPct?: number;
  alertEmailsEnabled?: boolean;
}
