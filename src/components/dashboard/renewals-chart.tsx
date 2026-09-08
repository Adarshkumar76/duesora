"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface RenewalsChartProps {
  data?: Array<{
    month: string;
    actual: number;
    projected: number;
  }>;
  currency?: string;
}

export function RenewalsChart({ data = [], currency = "USD" }: RenewalsChartProps) {
  const [hoveredMonth, setHoveredMonth] = useState<{
    month: string;
    actual: number;
    projected: number;
  } | null>(null);

  const chartData = data;
  const maxVal = Math.max(...chartData.flatMap((d) => [d.actual, d.projected]), 50);

  const currencySymbol = currency === "INR" ? "₹" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-foreground">
            Renewals Overview
          </CardTitle>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-500" />
              <span className="text-muted-foreground font-medium">Actual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-400 dark:bg-slate-600" />
              <span className="text-muted-foreground font-medium">Projected</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-6">
        <div className="relative h-56 flex flex-col justify-between pt-4">
          {/* Horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
            <div className="border-b border-border/60 w-full" />
            <div className="border-b border-border/60 w-full" />
            <div className="border-b border-border/60 w-full" />
            <div className="border-b border-border/60 w-full" />
          </div>

          {/* Interactive Tooltip Card */}
          {hoveredMonth && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-popover text-popover-foreground border border-border/80 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-3 text-xs animate-in fade-in-0 zoom-in-95 duration-100">
              <span className="font-bold text-foreground">{hoveredMonth.month}</span>
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Actual:</span>
                <span>{currencySymbol}{hoveredMonth.actual}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500 font-medium">
                <span>Projected:</span>
                <span>{currencySymbol}{hoveredMonth.projected}</span>
              </div>
            </div>
          )}

          {/* Bar Columns Container */}
          <div className="relative z-10 flex items-end justify-between h-44 px-2">
            {chartData.map((item) => {
              const actualHeight = Math.max(4, Math.round((item.actual / maxVal) * 100));
              const projectedHeight = Math.max(4, Math.round((item.projected / maxVal) * 100));
              const isHovered = hoveredMonth?.month === item.month;

              return (
                <div
                  key={item.month}
                  onMouseEnter={() => setHoveredMonth(item)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="flex items-end gap-1 h-36">
                    {/* Actual Bar (Emerald Green) */}
                    <div
                      style={{ height: `${actualHeight}%` }}
                      className={`w-2 sm:w-3.5 rounded-t-sm bg-emerald-600 dark:bg-emerald-500 transition-all duration-300 ${
                        isHovered ? "ring-2 ring-emerald-400 opacity-100 scale-y-105 origin-bottom" : "group-hover:opacity-90"
                      }`}
                    />
                    {/* Projected Bar (Slate Gray) */}
                    <div
                      style={{ height: `${projectedHeight}%` }}
                      className={`w-2 sm:w-3.5 rounded-t-sm bg-slate-400 dark:bg-slate-600 transition-all duration-300 ${
                        isHovered ? "ring-2 ring-slate-300 opacity-100 scale-y-105 origin-bottom" : "group-hover:opacity-90"
                      }`}
                    />
                  </div>
                  {/* Month Label */}
                  <span className={`text-[11px] font-medium transition-colors ${
                    isHovered ? "text-foreground font-bold" : "text-muted-foreground group-hover:text-foreground"
                  }`}>
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
