"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Sliders,
} from "lucide-react";
import type { WorkspaceBudgetStatus } from "@/lib/budgets/types";
import { CURRENCY_SYMBOLS } from "@/lib/currency/rates";

interface BudgetProgressCardProps {
  status: WorkspaceBudgetStatus;
  workspaceId: string;
}

export function BudgetProgressCard({
  status,
  workspaceId,
}: BudgetProgressCardProps) {
  const [viewMode, setViewMode] = useState<"monthly" | "annual">("monthly");

  const currencySymbol = CURRENCY_SYMBOLS[status.currency] || "$";
  const { monthly, annual, alertThresholdPct } = status;

  const currentMetrics = viewMode === "monthly" ? monthly : annual;
  const isExceeded = currentMetrics.isExceeded;
  const isWarning = currentMetrics.isWarning && !isExceeded;
  const hasCap = currentMetrics.budgetMinor !== null && currentMetrics.budgetMinor > 0;

  // Format currency amounts
  const spendFormatted = (currentMetrics.spendMinor / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const capFormatted = hasCap && currentMetrics.budgetMinor
    ? (currentMetrics.budgetMinor / 100).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : null;

  const remainingFormatted =
    hasCap && currentMetrics.remainingMinor !== null
      ? (Math.abs(currentMetrics.remainingMinor) / 100).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : null;

  // Unconfigured state banner
  if (!status.hasBudgetConfigured) {
    return (
      <div className="rounded-2xl border border-dashed border-border/90 bg-card/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
            <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Track Workspace Budget Ceilings
            </h3>
            <p className="text-xs text-muted-foreground max-w-xl mt-0.5">
              Set monthly or annual spending caps to prevent unexpected SaaS renewals and cloud cost overruns.
            </p>
          </div>
        </div>
        <Link href="/settings">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-2xs shrink-0 cursor-pointer">
            <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Configure Budget</span>
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
        isExceeded
          ? "border-rose-500/40 bg-rose-50/30 dark:bg-rose-950/20"
          : isWarning
          ? "border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/20"
          : "border-border/80 bg-card"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isExceeded
                ? "bg-rose-500 text-white"
                : isWarning
                ? "bg-amber-500 text-white"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {isExceeded ? (
              <ShieldAlert className="w-5 h-5" />
            ) : isWarning ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Wallet className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                Spend Velocity & Budget Utilization
              </h3>
              {isExceeded ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500 text-white animate-pulse">
                  Cap Exceeded
                </span>
              ) : isWarning ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500 text-white">
                  Approaching Cap ({currentMetrics.burnPercentage}%)
                </span>
              ) : hasCap ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  On Target ({currentMetrics.burnPercentage}%)
                </span>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Normalized recurring commitment in {status.currency} vs budget targets
            </p>
          </div>
        </div>

        {/* View Switcher & Settings Link */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex rounded-lg border border-border/80 bg-muted/40 p-0.5 text-xs">
            <button
              onClick={() => setViewMode("monthly")}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                viewMode === "monthly"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewMode("annual")}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                viewMode === "annual"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
            </button>
          </div>

          <Link href="/settings">
            <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer" title="Adjust Budget">
              <Sliders className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      {/* Figures & Progress Meter */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between flex-wrap gap-2 text-sm">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">
              {currencySymbol}
              {spendFormatted}
            </span>
            <span className="text-xs text-muted-foreground">
              spent / {viewMode === "monthly" ? "month" : "year"}
            </span>
          </div>

          {hasCap ? (
            <div className="text-right text-xs">
              <span className="text-muted-foreground">Target Cap: </span>
              <span className="font-bold text-foreground">
                {currencySymbol}
                {capFormatted}
              </span>
              <span className="mx-1 text-muted-foreground">•</span>
              {currentMetrics.remainingMinor !== null && (
                <span
                  className={`font-semibold ${
                    isExceeded ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {isExceeded
                    ? `Over by ${currencySymbol}${remainingFormatted}`
                    : `${currencySymbol}${remainingFormatted} remaining`}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">
              No {viewMode} cap configured
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {hasCap && (
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                isExceeded
                  ? "bg-rose-500"
                  : isWarning
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{
                width: `${Math.min(100, currentMetrics.burnPercentage || 0)}%`,
              }}
            />
          </div>
        )}

        {/* Warning Callout Box */}
        {isExceeded ? (
          <div className="text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center justify-between pt-1">
            <span>
              ⚠️ Spending has exceeded your {viewMode} budget ceiling by{" "}
              {currencySymbol}{remainingFormatted}.
            </span>
            <Link
              href="/reports"
              className="inline-flex items-center gap-1 font-bold underline hover:no-underline"
            >
              Analyze drivers <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : isWarning ? (
          <div className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center justify-between pt-1">
            <span>
              Spend has reached {currentMetrics.burnPercentage}% of your {viewMode} limit (threshold: {alertThresholdPct}%).
            </span>
            <Link
              href="/reports"
              className="inline-flex items-center gap-1 font-bold underline hover:no-underline"
            >
              Review breakdown <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
