"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface RenewalsChartProps {
  data?: Array<{
    month: string;
    actual: number;
    projected: number;
  }>;
}

const DEFAULT_DATA = [
  { month: "Jan", actual: 35, projected: 22 },
  { month: "Feb", actual: 50, projected: 38 },
  { month: "Mar", actual: 75, projected: 40 },
  { month: "Apr", actual: 68, projected: 48 },
  { month: "May", actual: 70, projected: 42 },
  { month: "Jun", actual: 72, projected: 36 },
  { month: "Jul", actual: 68, projected: 46 },
  { month: "Aug", actual: 44, projected: 47 },
  { month: "Sep", actual: 95, projected: 78 },
  { month: "Oct", actual: 55, projected: 38 },
  { month: "Nov", actual: 78, projected: 88 },
  { month: "Dec", actual: 60, projected: 42 },
];

export function RenewalsChart({ data = DEFAULT_DATA }: RenewalsChartProps) {
  const chartData = data.length === 12 ? data : DEFAULT_DATA;
  const maxVal = Math.max(...chartData.flatMap((d) => [d.actual, d.projected]), 100);

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold text-foreground">
          Renewals Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-6">
        <div className="relative h-56 flex flex-col justify-between pt-4">
          {/* Subtle horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
            <div className="border-b border-border/60 w-full" />
            <div className="border-b border-border/60 w-full" />
            <div className="border-b border-border/60 w-full" />
            <div className="border-b border-border/60 w-full" />
          </div>

          {/* Bar Columns Container */}
          <div className="relative z-10 flex items-end justify-between h-44 px-2">
            {chartData.map((item) => {
              const actualHeight = Math.max(8, Math.round((item.actual / maxVal) * 100));
              const projectedHeight = Math.max(8, Math.round((item.projected / maxVal) * 100));

              return (
                <div key={item.month} className="flex flex-col items-center gap-2 group">
                  <div className="flex items-end gap-1 h-36">
                    {/* Actual Bar (Emerald Green) */}
                    <div
                      style={{ height: `${actualHeight}%` }}
                      className="w-2.5 sm:w-3.5 rounded-t-sm bg-emerald-600 dark:bg-emerald-500 transition-all group-hover:opacity-90"
                      title={`${item.month} Actual: $${item.actual}`}
                    />
                    {/* Projected Bar (Slate Gray) */}
                    <div
                      style={{ height: `${projectedHeight}%` }}
                      className="w-2.5 sm:w-3.5 rounded-t-sm bg-slate-400 dark:bg-slate-600 transition-all group-hover:opacity-90"
                      title={`${item.month} Projected: $${item.projected}`}
                    />
                  </div>
                  {/* Month Label */}
                  <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
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
