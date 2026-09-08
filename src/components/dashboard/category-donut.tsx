"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface CategoryItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface CategoryDonutProps {
  categories?: CategoryItem[];
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { name: "Domains", count: 14, percentage: 45, color: "#10B981" },
  { name: "Subscriptions", count: 8, percentage: 25, color: "#34D399" },
  { name: "Hosting", count: 6, percentage: 18, color: "#475569" },
  { name: "SSL & Security", count: 4, percentage: 12, color: "#94A3B8" },
];

export function CategoryDonut({ categories = DEFAULT_CATEGORIES }: CategoryDonutProps) {
  const items = categories.length > 0 && categories.some((c) => c.count > 0)
    ? categories
    : DEFAULT_CATEGORIES;

  // Calculate SVG stroke dashes for donut segments
  const radius = 64;
  const circumference = 2 * Math.PI * radius; // ~402.12

  // Pure declarative segment computation without let mutation
  const segments = items.map((cat, index) => {
    const precedingPercent = items
      .slice(0, index)
      .reduce((sum, prev) => sum + prev.percentage, 0);
    const strokeDash = (cat.percentage / 100) * circumference;
    const strokeOffset = -(precedingPercent / 100) * circumference;
    return {
      ...cat,
      strokeDash,
      strokeOffset,
    };
  });

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold text-foreground">
          Top Categories
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center pb-6">
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 w-full">
          {/* SVG Donut */}
          <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
            <svg
              viewBox="0 0 160 160"
              className="w-full h-full -rotate-90 transform"
            >
              {segments.map((seg) => (
                <circle
                  key={seg.name}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth="24"
                  strokeDasharray={`${Math.max(0, seg.strokeDash - 3)} ${circumference}`}
                  strokeDashoffset={seg.strokeOffset}
                  className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                />
              ))}
            </svg>
            {/* Center Cutout / Total */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-muted-foreground font-medium">Distribution</span>
            </div>
          </div>

          {/* Legend matching mockup */}
          <div className="space-y-3 shrink-0">
            {items.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2.5 text-sm">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="font-medium text-foreground text-xs sm:text-sm">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
