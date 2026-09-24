"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrencyMinor } from "@/lib/currency/rates";
import type { CategorySpend } from "@/lib/reports/types";
import { PieChart } from "lucide-react";

interface CategoryDonutProps {
  categories: CategorySpend[];
  currency: string;
}

const PALETTE = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#64748b", // slate
];

export function CategoryDonut({ categories, currency }: CategoryDonutProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  const totalSpendMinor = categories.reduce((acc, c) => acc + c.annualSpendMinor, 0);

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Spend by Category
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Proportional distribution of recurring annual commitments ({formatCurrencyMinor(totalSpendMinor, currency)} total).
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {/* Progress Bar Stack */}
        <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden flex">
          {categories.map((cat, idx) => {
            if (cat.percentage <= 0) return null;
            const color = PALETTE[idx % PALETTE.length];
            return (
              <div
                key={cat.category}
                style={{ width: `${cat.percentage}%`, backgroundColor: color }}
                title={`${cat.category}: ${cat.percentage}%`}
                className="h-full first:rounded-l-full last:rounded-r-full transition-all"
              />
            );
          })}
        </div>

        {/* Legend / Category breakdown list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {categories.slice(0, 8).map((cat, idx) => {
            const color = PALETTE[idx % PALETTE.length];
            return (
              <div
                key={cat.category}
                className="flex items-center justify-between p-2 rounded-xl border border-border/40 bg-muted/20 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium capitalize text-foreground truncate">
                    {cat.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground">({cat.count})</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono">
                  <span className="font-semibold text-foreground">
                    {formatCurrencyMinor(cat.annualSpendMinor, currency)}
                  </span>
                  <span className="text-[10px] text-muted-foreground w-8 text-right">
                    {cat.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
