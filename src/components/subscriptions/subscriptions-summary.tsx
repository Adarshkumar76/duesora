import React from "react";
import { CreditCard, TrendingUp, Layers, Award } from "lucide-react";
import { CURRENCY_SYMBOLS } from "@/lib/currency/rates";
import type { SubscriptionMetrics } from "@/lib/subscriptions/types";

interface SubscriptionsSummaryProps {
  metrics: SubscriptionMetrics;
}

export function SubscriptionsSummary({ metrics }: SubscriptionsSummaryProps) {
  const symbol = CURRENCY_SYMBOLS[metrics.currency] || "$";

  const monthlyFormatted = (metrics.monthlyBurnRateMinor / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const annualFormatted = (metrics.annualProjectedMinor / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const topVendorCost = metrics.topVendor
    ? (metrics.topVendor.annualCostMinor / 100).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Monthly Recurring Spend */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-emerald-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Monthly Run-Rate
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {symbol}{monthlyFormatted}
          </span>
          <span className="text-xs text-muted-foreground font-medium">/ mo</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Normalized monthly commitment
        </p>
      </div>

      {/* Annual Projected Spend */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-blue-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Annual Forecast
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {symbol}{annualFormatted}
          </span>
          <span className="text-xs text-muted-foreground font-medium">/ yr</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Projected 12-month software spend
        </p>
      </div>

      {/* Active Subscriptions Count */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-purple-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Active Subscriptions
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {metrics.totalActiveSubscriptions}
          </span>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Active
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Tools, cloud, hosting & licenses
        </p>
      </div>

      {/* Highest Cost Commitment */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-amber-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Top Expense
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          {metrics.topVendor ? (
            <>
              <p className="text-base font-bold text-foreground truncate max-w-full" title={metrics.topVendor.name}>
                {metrics.topVendor.name}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                {symbol}{topVendorCost} / yr
              </p>
            </>
          ) : (
            <p className="text-2xl font-bold text-foreground">—</p>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Single largest recurring subscription
        </p>
      </div>
    </div>
  );
}
