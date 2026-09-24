import React from "react";
import { FolderKanban, Calendar, DollarSign } from "lucide-react";
import { CURRENCY_SYMBOLS } from "@/lib/currency/rates";
import type { ReportSummary } from "@/lib/reports/types";

interface SpendBreakdownsProps {
  summary: ReportSummary;
}

const CATEGORY_COLORS = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-slate-500",
];

export function SpendBreakdowns({ summary }: SpendBreakdownsProps) {
  const symbol = CURRENCY_SYMBOLS[summary.currency] || "$";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Category Distribution */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FolderKanban className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Spend by Category</h3>
            <p className="text-xs text-muted-foreground">Portfolio expense breakdown</p>
          </div>
        </div>

        {/* Stacked bar visualization */}
        {summary.categories.length > 0 && summary.totalAnnualRunRateMinor > 0 ? (
          <>
            <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden flex">
              {summary.categories.map((cat, idx) => (
                <div
                  key={cat.category}
                  className={`${CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} transition-all`}
                  style={{ width: `${Math.max(cat.percentage, 2)}%` }}
                  title={`${cat.category}: ${cat.percentage}%`}
                />
              ))}
            </div>

            <div className="space-y-2.5 pt-1">
              {summary.categories.slice(0, 6).map((cat, idx) => {
                const amount = (cat.annualSpendMinor / 100).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
                return (
                  <div key={cat.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
                        }`}
                      />
                      <span className="font-medium text-foreground capitalize truncate max-w-[120px]">
                        {cat.category}
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        ({cat.count})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-foreground">
                        {symbol}{amount}
                      </span>
                      <span className="text-muted-foreground ml-1.5 font-mono text-[11px]">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground py-6 text-center">
            No categorized spend data available.
          </p>
        )}
      </div>

      {/* 2. Billing Cadence Mix */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Billing Cadence Mix</h3>
            <p className="text-xs text-muted-foreground">Monthly vs annual commitment share</p>
          </div>
        </div>

        {summary.cadences.length > 0 && summary.totalAnnualRunRateMinor > 0 ? (
          <div className="space-y-3 pt-1">
            {summary.cadences.map((cad) => {
              const amount = (cad.annualSpendMinor / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
              return (
                <div key={cad.billingCycle} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold capitalize text-foreground">
                      {cad.billingCycle}
                      <span className="font-normal text-muted-foreground ml-1 text-[11px]">
                        ({cad.count} items)
                      </span>
                    </span>
                    <span className="font-semibold text-foreground">
                      {symbol}{amount}
                      <span className="text-muted-foreground font-normal ml-1.5 text-[11px]">
                        ({cad.percentage}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${cad.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-6 text-center">
            No cadence data available.
          </p>
        )}
      </div>

      {/* 3. Original Currency Breakdown */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Currency Exposure</h3>
            <p className="text-xs text-muted-foreground">Original currencies before normalization</p>
          </div>
        </div>

        {summary.currencies.length > 0 ? (
          <div className="space-y-3 pt-1">
            {summary.currencies.map((curr) => {
              const origSymbol = CURRENCY_SYMBOLS[curr.currency] || curr.currency + " ";
              const rawFormatted = (curr.rawTotalMinor / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
              const normalizedFormatted = (curr.normalizedAnnualMinor / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });

              return (
                <div key={curr.currency} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-foreground font-mono">
                        {curr.currency}
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        ({curr.count} items)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-foreground">
                        {origSymbol}{rawFormatted}
                      </span>
                      {curr.currency !== summary.currency && (
                        <span className="text-[10px] text-muted-foreground ml-1.5">
                          (≈ {symbol}{normalizedFormatted})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${Math.max(curr.percentage, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-6 text-center">
            No currency breakdown available.
          </p>
        )}
      </div>
    </div>
  );
}
