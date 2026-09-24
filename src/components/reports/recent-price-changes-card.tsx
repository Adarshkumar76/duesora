"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ArrowRight, ShieldAlert, Sparkles, ExternalLink } from "lucide-react";
import { CURRENCY_SYMBOLS } from "@/lib/currency/rates";
import type { WorkspacePriceHikeItem } from "@/lib/resources/cost-history";

interface RecentPriceChangesCardProps {
  changes: WorkspacePriceHikeItem[];
}

export function RecentPriceChangesCard({ changes }: RecentPriceChangesCardProps) {
  function formatCost(minor: number | null | undefined, cycle: string | null | undefined, curr: string) {
    if (minor === null || minor === undefined) return "Free";
    const symbol = CURRENCY_SYMBOLS[curr.toUpperCase()] || curr.toUpperCase();
    const formatted = `${symbol}${(minor / 100).toFixed(2)}`;
    return cycle ? `${formatted}/${cycle.slice(0, 2)}` : formatted;
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
            <TrendingUp className="w-4 h-4 text-rose-500" />
            <span>Price Creep & Rate Shifts</span>
          </CardTitle>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground border border-border/50">
            {changes.length} {changes.length === 1 ? "event" : "events"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {changes.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-foreground">Zero Price Creep Detected</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No subscription or recurring service rate shifts have been recorded in this workspace.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b border-border/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Rate Shift</th>
                  <th className="px-4 py-3">Old ➔ New Cost</th>
                  <th className="px-4 py-3">Effective Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {changes.map((change) => {
                  const isHike = change.changePercentage > 0;
                  const isCut = change.changePercentage < 0;

                  return (
                    <tr
                      key={change.id}
                      className="hover:bg-muted/20 transition-colors group text-xs"
                    >
                      <td className="px-4 py-3 font-semibold text-foreground">
                        <Link
                          href={`/resources/${change.resourceId}`}
                          className="hover:underline flex items-center gap-1.5"
                        >
                          <span>{change.resourceName}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                        </Link>
                        {change.changeReason && (
                          <p className="text-[10px] text-muted-foreground font-normal italic truncate max-w-xs">
                            {change.changeReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">
                        {change.resourceType}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] ${
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
                          {isHike ? `+${change.changePercentage}%` : `${change.changePercentage}%`}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="line-through text-muted-foreground">
                            {formatCost(change.previousAmountMinor, change.previousBillingCycle, change.currency)}
                          </span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span
                            className={
                              isHike
                                ? "text-rose-600 dark:text-rose-400 font-semibold"
                                : "text-emerald-600 dark:text-emerald-400 font-semibold"
                            }
                          >
                            {formatCost(change.newAmountMinor, change.newBillingCycle, change.currency)}
                          </span>
                        </div>
                      </td>
                      <td suppressHydrationWarning className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(change.effectiveDate || change.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/resources/${change.resourceId}`}
                          className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
