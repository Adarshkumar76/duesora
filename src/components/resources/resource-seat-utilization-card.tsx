"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, AlertTriangle, CheckCircle2, TrendingDown, Edit3, X, Save, Loader2, Sparkles, Zap } from "lucide-react";
import type { SeatUtilizationMetrics } from "@/lib/resources/seats";

interface ResourceSeatUtilizationCardProps {
  workspaceId: string;
  resourceId: string;
  initialMetrics: SeatUtilizationMetrics;
  userRole?: string;
}

export function ResourceSeatUtilizationCard({
  workspaceId,
  resourceId,
  initialMetrics,
  userRole = "member",
}: ResourceSeatUtilizationCardProps) {
  const canEdit = userRole !== "viewer";

  const [metrics, setMetrics] = useState<SeatUtilizationMetrics>(initialMetrics);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trimming, setTrimming] = useState(false);
  const [trimSuccess, setTrimSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [totalSeats, setTotalSeats] = useState(metrics.totalSeats.toString());
  const [assignedSeats, setAssignedSeats] = useState(metrics.assignedSeats.toString());
  const [costPerSeat, setCostPerSeat] = useState(
    metrics.costPerSeat !== null ? metrics.costPerSeat.toString() : ""
  );

  const handleAutonomousTrim = async () => {
    if (!metrics.suggestedSeatDowngrade) return;
    setTrimming(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/resources/${resourceId}/seats`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seatTrackingEnabled: true,
            totalSeats: metrics.suggestedSeatDowngrade,
            assignedSeats: metrics.assignedSeats,
            costPerSeatMinor: metrics.costPerSeat ? Math.round(metrics.costPerSeat * 100) : null,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to trim seats");
      }

      setMetrics(json.data);
      setTotalSeats(metrics.suggestedSeatDowngrade.toString());
      setTrimSuccess(true);
      setTimeout(() => setTrimSuccess(false), 4500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to execute autonomous trim");
    } finally {
      setTrimming(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const parsedTotal = parseInt(totalSeats, 10);
    const parsedAssigned = parseInt(assignedSeats, 10);
    const parsedCost = parseFloat(costPerSeat);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/resources/${resourceId}/seats`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seatTrackingEnabled: true,
            totalSeats: isNaN(parsedTotal) ? 0 : parsedTotal,
            assignedSeats: isNaN(parsedAssigned) ? 0 : parsedAssigned,
            costPerSeatMinor: isNaN(parsedCost) ? null : Math.round(parsedCost * 100),
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to update seat allocation");
      }

      setMetrics(json.data);
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update seats");
    } finally {
      setLoading(false);
    }
  };

  // Color mappings based on utilization rate
  const rateColor =
    metrics.utilizationRate >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : metrics.utilizationRate >= 50
      ? "text-amber-600 dark:text-amber-400"
      : "text-rose-600 dark:text-rose-400";

  const progressBgColor =
    metrics.utilizationRate >= 80
      ? "bg-emerald-500"
      : metrics.utilizationRate >= 50
      ? "bg-amber-500"
      : "bg-rose-500";

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Seat & License Utilization
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Optimize seat allocation and trim idle licenses before renewal.
              </p>
            </div>
          </div>

          {canEdit && !isEditing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="rounded-xl text-xs gap-1.5 h-8 font-medium cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Update Seats</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {/* Inline Editing Form */}
        {isEditing ? (
          <form onSubmit={handleSave} className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="totalSeats" className="text-xs font-semibold">
                  Total Seats Purchased
                </Label>
                <Input
                  id="totalSeats"
                  type="number"
                  min="0"
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(e.target.value)}
                  className="h-8 text-xs rounded-xl bg-background"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assignedSeats" className="text-xs font-semibold">
                  Active Assigned Seats
                </Label>
                <Input
                  id="assignedSeats"
                  type="number"
                  min="0"
                  value={assignedSeats}
                  onChange={(e) => setAssignedSeats(e.target.value)}
                  className="h-8 text-xs rounded-xl bg-background"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="costPerSeat" className="text-xs font-semibold">
                  Cost per Seat ({metrics.currency})
                </Label>
                <Input
                  id="costPerSeat"
                  type="number"
                  min="0"
                  step="0.01"
                  value={costPerSeat}
                  onChange={(e) => setCostPerSeat(e.target.value)}
                  placeholder="e.g. 15.00"
                  className="h-8 text-xs rounded-xl bg-background"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setError(null);
                }}
                disabled={loading}
                className="h-8 rounded-xl text-xs cursor-pointer"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                <span>Cancel</span>
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="h-8 rounded-xl text-xs gap-1.5 cursor-pointer bg-primary text-primary-foreground"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Allocation</span>
              </Button>
            </div>
          </form>
        ) : (
          <>
            {/* Progress Bar & Rate Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                  <span>Capacity Utilization</span>
                  {metrics.status === "healthy" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </span>
                <span className={`text-sm font-bold ${rateColor}`}>
                  {metrics.utilizationRate}%
                </span>
              </div>

              {/* Bar */}
              <div className="w-full h-2.5 rounded-full bg-muted/60 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressBgColor}`}
                  style={{ width: `${Math.min(100, metrics.utilizationRate)}%` }}
                />
              </div>
            </div>

            {/* 4-Column Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-muted/20 border border-border/50 space-y-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Purchased
                </span>
                <p className="text-base font-bold text-foreground">
                  {metrics.totalSeats} <span className="text-xs font-normal text-muted-foreground">seats</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border/50 space-y-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Assigned
                </span>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {metrics.assignedSeats} <span className="text-xs font-normal text-muted-foreground">active</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border/50 space-y-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Idle / Waste
                </span>
                <p className={`text-base font-bold ${metrics.idleSeats > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                  {metrics.idleSeats} <span className="text-xs font-normal text-muted-foreground">idle</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border/50 space-y-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Annual Waste
                </span>
                <p className={`text-base font-bold ${metrics.annualizedIdleWaste > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}>
                  {metrics.annualizedIdleWaste > 0 ? `${metrics.currency} ${metrics.annualizedIdleWaste.toLocaleString()}` : "$0"}
                </p>
              </div>
            </div>

            {/* Recommendation Alert Box */}
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                metrics.status === "critical"
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200"
                  : metrics.status === "warning"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {metrics.suggestedSeatDowngrade !== null ? (
                  <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold">
                  {metrics.suggestedSeatDowngrade !== null ? "Optimization Opportunity:" : "Capacity Assessment:"}
                </p>
                <p className="opacity-90 leading-relaxed">
                  {metrics.recommendation}
                </p>
              </div>
            </div>

            {/* 1-Click Autonomous Trim Action Banner */}
            {canEdit && metrics.suggestedSeatDowngrade !== null && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 dark:text-amber-200">
                    <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Autonomous Trim Ready</span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Reduce contract by {metrics.idleSeats} idle seat{metrics.idleSeats > 1 ? "s" : ""} to match exact active demand ({metrics.assignedSeats} seats).
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  disabled={trimming}
                  onClick={handleAutonomousTrim}
                  className="w-full sm:w-auto h-8 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 cursor-pointer shadow-xs shrink-0"
                >
                  {trimming ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Trimming Seats...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>1-Click Trim to {metrics.suggestedSeatDowngrade} Seats</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Trim Success Feedback */}
            {trimSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Capacity optimized! Allocation updated to match active users with zero wasted seats.</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
