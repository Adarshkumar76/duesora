import React from "react";
import { AlertCircle, AlertTriangle, CalendarClock, TrendingUp } from "lucide-react";
import { CURRENCY_SYMBOLS } from "@/lib/currency/rates";
import type { RenewalMetrics } from "@/lib/renewals/types";

interface RenewalsMetricsProps {
  metrics: RenewalMetrics;
}

export function RenewalsMetrics({ metrics }: RenewalsMetricsProps) {
  const symbol = CURRENCY_SYMBOLS[metrics.currency] || "$";

  const overdueCost = (metrics.overdueCostMinor / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const next7Cost = (metrics.next7DaysCostMinor / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const next30Cost = (metrics.next30DaysCostMinor / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const next90Cost = (metrics.next90DaysCostMinor / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Overdue */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-rose-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Overdue Commitments
          </span>
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            {metrics.overdueCount}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            ({symbol}{overdueCost} due)
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Past renewal date requiring confirmation
        </p>
      </div>

      {/* Critical: Next 7 Days */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-amber-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Due in 7 Days
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {metrics.next7DaysCount}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            ({symbol}{next7Cost})
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Immediate cash outflow & renewal window
        </p>
      </div>

      {/* Upcoming: Next 30 Days */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-emerald-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Due in 30 Days
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CalendarClock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {metrics.next30DaysCount}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            ({symbol}{next30Cost})
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Upcoming commitments this month
        </p>
      </div>

      {/* Horizon: Next 90 Days */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-blue-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            90-Day Outlook
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {metrics.next90DaysCount}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            ({symbol}{next90Cost})
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Quarterly projected renewal cash flow
        </p>
      </div>

      {/* Governance Decision Cards Row */}
      <div className="sm:col-span-2 lg:col-span-4 rounded-2xl border border-border/80 bg-muted/20 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Renewal Decision Governance & Cost Savings
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review upcoming contracts, sign off on approved renewals, and stop auto-renew on cancelled services.
            </p>
          </div>

          {metrics.cancelCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span>Projected Savings:</span>
              <strong>{symbol}{((metrics.projectedSavingsMinor || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Needs Review
            </span>
            <span className="text-xl font-bold text-foreground mt-1 block">
              {metrics.needsReviewCount || 0}
            </span>
            <span className="text-[11px] text-muted-foreground">Pending team decision</span>
          </div>

          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Approved
            </span>
            <span className="text-xl font-bold text-foreground mt-1 block">
              {metrics.approvedCount || 0}
            </span>
            <span className="text-[11px] text-muted-foreground">Cleared to renew</span>
          </div>

          <div className="p-3 rounded-xl border border-destructive/20 bg-destructive/5">
            <span className="text-[11px] font-semibold text-destructive uppercase tracking-wider block">
              Marked to Cancel
            </span>
            <span className="text-xl font-bold text-foreground mt-1 block">
              {metrics.cancelCount || 0}
            </span>
            <span className="text-[11px] text-muted-foreground">Do not auto-renew</span>
          </div>

          <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5">
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
              Negotiating
            </span>
            <span className="text-xl font-bold text-foreground mt-1 block">
              {metrics.negotiateCount || 0}
            </span>
            <span className="text-[11px] text-muted-foreground">In vendor discussions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
