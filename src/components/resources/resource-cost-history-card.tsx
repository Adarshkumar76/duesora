"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Clock, History, ArrowRight, Sparkles, User } from "lucide-react";
import { CURRENCY_SYMBOLS } from "@/lib/currency/rates";
import type { ResourceCostHistoryEntry } from "@/lib/resources/cost-history";

interface ResourceCostHistoryCardProps {
  history: ResourceCostHistoryEntry[];
  currentCurrency?: string;
}

export function ResourceCostHistoryCard({
  history,
  currentCurrency = "USD",
}: ResourceCostHistoryCardProps) {
  function formatCost(minor: number | null | undefined, cycle: string | null | undefined, curr: string) {
    if (minor === null || minor === undefined) return "Free / Unset";
    const symbol = CURRENCY_SYMBOLS[curr.toUpperCase()] || curr.toUpperCase();
    const formatted = `${symbol}${(minor / 100).toFixed(2)}`;
    return cycle ? `${formatted} / ${cycle}` : formatted;
  }

  function formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Cost History & Rate Shifts</span>
          </CardTitle>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground border border-border/50">
            {history.length} {history.length === 1 ? "adjustment" : "adjustments"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {history.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-foreground">Stable Cost Structure</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No price fluctuations or billing cadence adjustments have been recorded for this resource yet.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/70">
            {history.map((entry) => {
              const isHike = entry.changePercentage > 0;
              const isCut = entry.changePercentage < 0;

              return (
                <div key={entry.id} className="relative space-y-1.5 group">
                  {/* Indicator Dot */}
                  <span
                    className={`absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-card transition-transform group-hover:scale-125 ${
                      isHike
                        ? "bg-rose-500"
                        : isCut
                        ? "bg-emerald-500"
                        : "bg-slate-400"
                    }`}
                  />

                  {/* Header Row: Shift Badge & Date */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${
                          isHike
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            : isCut
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-muted text-muted-foreground border border-border/50"
                        }`}
                      >
                        {isHike ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : isCut ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : null}
                        {isHike ? `+${entry.changePercentage}%` : `${entry.changePercentage}%`}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {isHike ? "Price Increase" : isCut ? "Cost Reduction" : "Cadence Update"}
                      </span>
                    </div>

                    <span suppressHydrationWarning className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(entry.effectiveDate || entry.createdAt)}
                    </span>
                  </div>

                  {/* Price Transition Row */}
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground/90 bg-muted/30 p-2 rounded-lg border border-border/40">
                    <span className="line-through text-muted-foreground">
                      {formatCost(entry.previousAmountMinor, entry.previousBillingCycle, entry.currency)}
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className={isHike ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
                      {formatCost(entry.newAmountMinor, entry.newBillingCycle, entry.currency)}
                    </span>
                  </div>

                  {/* Reason & Actor Row */}
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-muted-foreground">
                    {entry.changeReason ? (
                      <p className="italic">
                        &ldquo;{entry.changeReason}&rdquo;
                      </p>
                    ) : (
                      <span />
                    )}

                    {entry.changedByName && (
                      <span className="flex items-center gap-1 ml-auto">
                        <User className="w-3 h-3" />
                        {entry.changedByName}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
