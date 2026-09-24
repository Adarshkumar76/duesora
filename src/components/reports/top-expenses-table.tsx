"use client";

import React from "react";
import Link from "next/link";
import { Download, FileSpreadsheet, FileJson, ArrowRight, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CURRENCY_SYMBOLS } from "@/lib/currency/rates";
import type { CostDriverItem } from "@/lib/reports/types";

interface TopExpensesTableProps {
  topCostDrivers: CostDriverItem[];
  workspaceId: string;
  workspaceCurrency: string;
}

export function TopExpensesTable({
  topCostDrivers,
  workspaceId,
  workspaceCurrency,
}: TopExpensesTableProps) {
  const targetSymbol = CURRENCY_SYMBOLS[workspaceCurrency] || "$";

  return (
    <div className="space-y-4">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Top Cost Drivers (Annualized)</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Highest expense commitments across your workspace
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <a
            href={`/api/workspaces/${workspaceId}/resources/export?format=csv`}
            download
          >
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Download portfolio data as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </Button>
          </a>

          <a
            href={`/api/workspaces/${workspaceId}/resources/export?format=json`}
            download
          >
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Download portfolio data as JSON"
            >
              <FileJson className="w-3.5 h-3.5 text-blue-600" />
              <span>Export JSON</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        {topCostDrivers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b border-border/60 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Asset & Provider</th>
                  <th className="py-3 px-4">Category / Type</th>
                  <th className="py-3 px-4">Billing Cadence</th>
                  <th className="py-3 px-4">Original Cost</th>
                  <th className="py-3 px-4">Annualized ({workspaceCurrency})</th>
                  <th className="py-3 px-4">Share of Budget</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {topCostDrivers.map((item) => {
                  const origSymbol = CURRENCY_SYMBOLS[item.currency] || item.currency + " ";
                  const origAmount = (
                    (item.amountMinor || 0) / 100
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });

                  const annualFormatted = (
                    item.annualNormalizedMinor / 100
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Rank */}
                      <td className="py-3 px-4 text-center font-bold text-xs text-muted-foreground">
                        <span
                          className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] ${
                            item.rank === 1
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"
                              : item.rank === 2
                              ? "bg-slate-500/10 text-slate-600 dark:text-slate-400 font-semibold"
                              : item.rank === 3
                              ? "bg-amber-700/10 text-amber-700 dark:text-amber-500 font-semibold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item.rank}
                        </span>
                      </td>

                      {/* Asset & Provider */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/resources/${item.id}`}
                          className="font-semibold text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          {item.name}
                        </Link>
                        {item.provider && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Provider: {item.provider}
                          </p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="capitalize text-xs px-2 py-0.5 rounded-full bg-muted font-medium text-foreground">
                          {item.category || item.type.replace("_", " ")}
                        </span>
                      </td>

                      {/* Cadence */}
                      <td className="py-3 px-4 text-xs capitalize text-muted-foreground">
                        {item.billingCycle}
                      </td>

                      {/* Original Cost */}
                      <td className="py-3 px-4 text-xs font-medium text-muted-foreground">
                        {origSymbol}{origAmount}
                      </td>

                      {/* Annualized Cost */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-bold text-foreground">
                          {targetSymbol}{annualFormatted} / yr
                        </span>
                      </td>

                      {/* Share of Budget */}
                      <td className="py-3 px-4">
                        <div className="space-y-1 max-w-[120px]">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground text-[11px]">
                              {item.shareOfTotalPct}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${Math.max(item.shareOfTotalPct, 3)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <Link href={`/resources/${item.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 rounded-lg text-xs gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <span>View</span>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No paying recurring expenses recorded in this workspace.
          </div>
        )}
      </div>
    </div>
  );
}
