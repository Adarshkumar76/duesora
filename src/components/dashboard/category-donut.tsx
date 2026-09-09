"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Plus } from "lucide-react";

interface CategoryItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface CategoryDonutProps {
  categories?: CategoryItem[];
}

export function CategoryDonut({ categories = [] }: CategoryDonutProps) {
  const [hoveredCat, setHoveredCat] = useState<CategoryItem | null>(null);

  const hasData = categories.length > 0 && categories.some((c) => c.count > 0);
  const totalCount = categories.reduce((sum, c) => sum + c.count, 0);

  // Calculate SVG stroke dashes for donut segments
  const radius = 64;
  const circumference = 2 * Math.PI * radius; // ~402.12

  // Pure declarative segment computation without let mutation
  const segments = categories.map((cat, index) => {
    const precedingPercent = categories
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
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold text-foreground flex items-center justify-between">
          <span>Top Categories</span>
          {hasData && (
            <span className="text-xs font-normal text-muted-foreground">
              {totalCount} total resources
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center pb-6">
        {hasData ? (
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 w-full">
            {/* SVG Donut with hover tooltip & smooth animations */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg
                viewBox="0 0 160 160"
                className="w-full h-full -rotate-90 transform transition-transform duration-300"
              >
                {segments.map((seg) => {
                  const isHovered = hoveredCat?.name === seg.name;
                  return (
                    <circle
                      key={seg.name}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth={isHovered ? "28" : "24"}
                      strokeDasharray={`${Math.max(0, seg.strokeDash - 2)} ${circumference}`}
                      strokeDashoffset={seg.strokeOffset}
                      onMouseEnter={() => setHoveredCat(seg)}
                      onMouseLeave={() => setHoveredCat(null)}
                      className="transition-all duration-300 cursor-pointer origin-center hover:opacity-95"
                    />
                  );
                })}
              </svg>

              {/* Dynamic Center Details on Hover */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4 text-center">
                {hoveredCat ? (
                  <div className="animate-in fade-in zoom-in-90 duration-150">
                    <p className="text-[11px] font-semibold text-muted-foreground truncate max-w-[100px]">
                      {hoveredCat.name}
                    </p>
                    <p className="text-lg font-extrabold text-foreground leading-tight">
                      {hoveredCat.count}
                    </p>
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      {hoveredCat.percentage}%
                    </span>
                  </div>
                ) : (
                  <div className="animate-in fade-in duration-200">
                    <span className="text-xs text-muted-foreground font-medium">
                      Total
                    </span>
                    <p className="text-lg font-extrabold text-foreground leading-tight">
                      {totalCount}
                    </p>
                    <span className="text-[10px] text-muted-foreground">Resources</span>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Legend */}
            <div className="space-y-2.5 shrink-0">
              {categories.map((cat) => {
                const isHovered = hoveredCat?.name === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onMouseEnter={() => setHoveredCat(cat)}
                    onMouseLeave={() => setHoveredCat(null)}
                    className={`flex items-center justify-between gap-3 text-sm px-2.5 py-1.5 rounded-xl transition-all cursor-pointer w-full text-left ${
                      isHovered ? "bg-muted/80 shadow-2xs" : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0 transition-transform duration-200"
                        style={{
                          backgroundColor: cat.color,
                          transform: isHovered ? "scale(1.3)" : "scale(1)",
                        }}
                      />
                      <span className="font-medium text-foreground text-xs sm:text-sm">
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground ml-2">
                      {cat.count} ({cat.percentage}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-16 h-16 rounded-full border-4 border-dashed border-border/80 flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">0%</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">No categories yet</p>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Add domains or subscriptions to view resource distribution.
              </p>
            </div>
            <Link
              href="/resources/new"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 pt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Resource</span>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
