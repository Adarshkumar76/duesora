"use client";

import { useState } from "react";
import {
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CronStatusCardProps {
  workspaceId: string;
  userRole?: string;
}

export function CronStatusCard({ workspaceId, userRole }: CronStatusCardProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunResult, setLastRunResult] = useState<{
    success: boolean;
    timestamp: string;
    source?: string;
    data?: { scannedResources?: number; [key: string]: unknown };
    error?: string;
  } | null>(null);

  const canTrigger = userRole === "owner" || userRole === "admin";

  const handleRunManualSweep = async () => {
    setIsRunning(true);
    setLastRunResult(null);

    try {
      const res = await fetch(`/api/cron/monitor?workspaceId=${workspaceId}`, {
        method: "POST",
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setLastRunResult({
          success: true,
          timestamp: new Date().toLocaleTimeString(),
          source: json.source,
          data: json.data,
        });
      } else {
        setLastRunResult({
          success: false,
          timestamp: new Date().toLocaleTimeString(),
          error: json.error?.message || "Failed to complete automated sweep",
        });
      }
    } catch (err) {
      setLastRunResult({
        success: false,
        timestamp: new Date().toLocaleTimeString(),
        error: err instanceof Error ? err.message : "Network error triggering sweep",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-foreground">
              Automated Background Jobs & Cron
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              Active Schedule
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Automated recurring sweeps inspect domain DNS & SSL health, advance renewal alerts, and synchronize live currency exchange rates.
          </p>
        </div>

        {canTrigger && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isRunning}
            onClick={handleRunManualSweep}
            className="cursor-pointer gap-1.5 self-start sm:self-auto text-xs shrink-0"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sweeping Workspace...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-current" />
                <span>Run Full Sweep Now</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Cron Schedules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">
                Domain & SSL Health Probes
              </span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
              00:00 UTC Daily
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Performs TLS certificate handshake, expiry countdown, DNS ping, and dispatches multi-channel alerts (Slack, Discord, Telegram, Teams).
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
            <span>Path:</span>
            <code className="text-foreground bg-muted/50 px-1 py-0.5 rounded">/api/cron/monitor</code>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">
                FX Exchange Rate Sync
              </span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
              01:00 UTC Daily
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Syncs real-time foreign currency conversions (USD, EUR, GBP, INR, CAD, AUD, JPY, SGD) to normalize multi-currency spend accurately.
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
            <span>Path:</span>
            <code className="text-foreground bg-muted/50 px-1 py-0.5 rounded">/api/currency/sync</code>
          </div>
        </div>
      </div>

      {/* Sweep Execution Result Banner */}
      {lastRunResult && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
            lastRunResult.success
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300"
          }`}
        >
          {lastRunResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          )}

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                {lastRunResult.success
                  ? `Manual sweep completed at ${lastRunResult.timestamp}`
                  : `Sweep failed at ${lastRunResult.timestamp}`}
              </span>
              {lastRunResult.source && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-background/50">
                  {lastRunResult.source}
                </span>
              )}
            </div>

            {lastRunResult.success && lastRunResult.data && (
              <p className="text-[11px] opacity-90">
                Processed {lastRunResult.data.scannedResources ?? 0} resources. Health checks evaluated, and active notification channels notified.
              </p>
            )}

            {lastRunResult.error && (
              <p className="text-[11px] font-mono">{lastRunResult.error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
