import React from "react";
import { TrendingUp, CreditCard, PieChart, CheckCircle2 } from "lucide-react";
import { CURRENCY_SYMBOLS } from "@/lib/currency/rates";
import type { ReportSummary } from "@/lib/reports/types";

interface ReportSummaryCardsProps {
  summary: ReportSummary;
}

export function ReportSummaryCards({ summary }: ReportSummaryCardsProps) {
  const symbol = CURRENCY_SYMBOLS[summary.currency] || "$";

  const annualFormatted = (summary.totalAnnualRunRateMinor / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const monthlyFormatted = (summary.totalMonthlyRunRateMinor / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const avgFormatted = (summary.averageAssetCostMinor / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Annual Run-Rate */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-emerald-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Annual Run-Rate
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
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
          Total annualized workspace recurring commitment
        </p>
      </div>

      {/* Monthly Run-Rate */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-blue-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Monthly Run-Rate
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
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
          Normalized monthly cash outflow
        </p>
      </div>

      {/* Average Asset Cost */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-purple-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Avg Cost / Paid Asset
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {symbol}{avgFormatted}
          </span>
          <span className="text-xs text-muted-foreground font-medium">/ yr</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Average annual cost across paying items
        </p>
      </div>

      {/* Portfolio Composition */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-amber-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Portfolio Composition
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {summary.payingResources}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            paying of {summary.totalResources} assets
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {summary.totalResources - summary.payingResources} free / unpriced resources
        </p>
      </div>
    </div>
  );
}
