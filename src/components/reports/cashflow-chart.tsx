"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrencyMinor } from "@/lib/currency/rates";
import type { MonthlyCashflowPoint } from "@/lib/reports/types";
import { TrendingUp, AlertCircle } from "lucide-react";

interface CashflowChartProps {
  forecast: MonthlyCashflowPoint[];
  currency: string;
}

export function CashflowChart({ forecast, currency }: CashflowChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!forecast || forecast.length === 0) {
    return null;
  }

  const maxSpend = Math.max(...forecast.map((f) => f.projectedSpendMinor), 1);
  const totalForecastMinor = forecast.reduce((acc, f) => acc + f.projectedSpendMinor, 0);
  const avgMonthlyMinor = Math.round(totalForecastMinor / forecast.length);

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                12-Month Renewal Cashflow Forecast
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Projected cash commitments and renewal density over the next 12 rolling months.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm bg-primary/80" />
              <span>Projected Spend</span>
            </div>
            <div className="text-muted-foreground font-mono text-[11px] bg-muted/50 px-2 py-0.5 rounded-lg border border-border/50">
              Avg: {formatCurrencyMinor(avgMonthlyMinor, currency)}/mo
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 pb-4">
        {totalForecastMinor === 0 ? (
          <div className="py-12 text-center space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/60" />
            <p className="text-xs text-muted-foreground">No recurring active assets scheduled for the next 12 months.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Bars container */}
            <div className="h-48 w-full flex items-end justify-between gap-1.5 sm:gap-3 pt-6 pb-2 px-1">
              {forecast.map((pt, idx) => {
                const heightPct = Math.max(Math.round((pt.projectedSpendMinor / maxSpend) * 100), 4);
                const isHovered = hoveredIdx === idx;

                return (
                  <div
                    key={pt.monthKey}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="relative flex-1 h-full flex flex-col items-center justify-end group cursor-pointer"
                  >
                    {/* Hover Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-14 z-20 px-2.5 py-1.5 rounded-xl bg-popover text-popover-foreground border border-border/80 shadow-lg text-[11px] whitespace-nowrap pointer-events-none animate-in fade-in-0 zoom-in-95">
                        <div className="font-semibold">{pt.label}</div>
                        <div className="text-emerald-500 font-mono font-bold">
                          {formatCurrencyMinor(pt.projectedSpendMinor, currency)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {pt.renewalCount} {pt.renewalCount === 1 ? "renewal" : "renewals"}
                        </div>
                      </div>
                    )}

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[36px] rounded-t-lg transition-all duration-200 ${
                        isHovered
                          ? "bg-primary shadow-md shadow-primary/20 scale-y-105"
                          : "bg-primary/75 hover:bg-primary/90"
                      }`}
                    />

                    {/* Month Label */}
                    <span className="text-[10px] font-medium text-muted-foreground mt-2 truncate max-w-full text-center">
                      {pt.label.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom summary badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-border/50 text-xs">
              <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">12-Mo Total</span>
                <p className="font-bold font-mono text-foreground mt-0.5">
                  {formatCurrencyMinor(totalForecastMinor, currency)}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Peak Month</span>
                <p className="font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatCurrencyMinor(maxSpend, currency)}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Monthly Mean</span>
                <p className="font-bold font-mono text-foreground mt-0.5">
                  {formatCurrencyMinor(avgMonthlyMinor, currency)}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Scheduled Events</span>
                <p className="font-bold font-mono text-foreground mt-0.5">
                  {forecast.reduce((a, b) => a + b.renewalCount, 0)} events
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
