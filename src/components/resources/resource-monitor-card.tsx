"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Loader2,
  Lock,
  Clock,
  History,
  CheckCircle2,
} from "lucide-react";
import type { ResourceMonitorRecord, ResourceMonitorLogRecord, MonitorStatus } from "@/lib/monitors/types";

interface ResourceMonitorCardProps {
  initialMonitor: ResourceMonitorRecord | null;
  initialLogs?: ResourceMonitorLogRecord[];
  workspaceId: string;
  resourceId: string;
  targetHostname: string;
}

export function ResourceMonitorCard({
  initialMonitor,
  initialLogs = [],
  workspaceId,
  resourceId,
  targetHostname,
}: ResourceMonitorCardProps) {
  const [monitor, setMonitor] = useState<ResourceMonitorRecord | null>(initialMonitor);
  const [logs, setLogs] = useState<ResourceMonitorLogRecord[]>(initialLogs);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleCheckNow = async () => {
    setChecking(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/resources/${resourceId}/monitor`,
        {
          method: "POST",
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Check failed");
      }

      if (json.data?.monitor) {
        setMonitor(json.data.monitor);
        if (json.data.logs) {
          setLogs(json.data.logs);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to run health check");
    } finally {
      setChecking(false);
    }
  };

  const statusConfig: Record<
    MonitorStatus,
    { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    healthy: {
      label: "SSL Valid & Secure",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      icon: ShieldCheck,
    },
    warning: {
      label: "Expiring Soon",
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      icon: AlertTriangle,
    },
    critical: {
      label: "Critical / Expired",
      badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
      icon: ShieldAlert,
    },
    error: {
      label: "Check Failed",
      badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
      icon: XCircle,
    },
    unknown: {
      label: "Not Checked",
      badgeClass: "bg-muted text-muted-foreground border-border",
      icon: Clock,
    },
  };

  const currentStatus = monitor?.status || "unknown";
  const activeStatus = statusConfig[currentStatus] || statusConfig.unknown;
  const StatusIcon = activeStatus.icon;

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "—";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <span>TLS / SSL & Domain Health</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${activeStatus.badgeClass}`}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  <span>{activeStatus.label}</span>
                </span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Target: <span className="font-mono font-medium text-foreground">{targetHostname || "—"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {logs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory((prev) => !prev)}
                className="rounded-xl text-xs font-semibold h-8.5 px-3 border-border/70 cursor-pointer"
              >
                <History className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                <span>{showHistory ? "Hide History" : "History"}</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleCheckNow}
              disabled={checking}
              className="rounded-xl text-xs font-semibold h-8.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
            >
              {checking ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  <span>Check Now</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20 flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 3-Column Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Certificate Validity */}
          <div className="p-3.5 rounded-xl bg-background border border-border/60 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              SSL Expiration
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-foreground">
                {monitor?.tlsDaysRemaining !== null && monitor?.tlsDaysRemaining !== undefined
                  ? `${monitor.tlsDaysRemaining} days`
                  : "—"}
              </span>
              {monitor?.tlsValidTo && (
                <span className="text-[11px] text-muted-foreground truncate">
                  ({formatDate(monitor.tlsValidTo)})
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground block truncate">
              {monitor?.tlsIssuer ? `Issuer: ${monitor.tlsIssuer}` : "No certificate inspected"}
            </span>
          </div>

          {/* Protocol & Latency */}
          <div className="p-3.5 rounded-xl bg-background border border-border/60 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Protocol & Latency
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-foreground">
                {monitor?.tlsProtocol || "TLS"}
              </span>
              {monitor?.latencyMs !== null && monitor?.latencyMs !== undefined && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {monitor.latencyMs}ms response
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground block truncate">
              {monitor?.lastCheckedAt
                ? `Last checked: ${new Date(monitor.lastCheckedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Not checked recently"}
            </span>
          </div>

          {/* DNS Nameservers */}
          <div className="p-3.5 rounded-xl bg-background border border-border/60 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              DNS Nameservers
            </span>
            <div className="text-sm font-semibold text-foreground truncate">
              {monitor?.dnsNameservers && monitor.dnsNameservers.length > 0
                ? monitor.dnsNameservers[0]
                : "—"}
            </div>
            <span className="text-[11px] text-muted-foreground block truncate">
              {monitor?.dnsNameservers && monitor.dnsNameservers.length > 1
                ? `+ ${monitor.dnsNameservers.length - 1} secondary nameservers`
                : monitor?.dnsIpv4 && monitor.dnsIpv4.length > 0
                ? `A: ${monitor.dnsIpv4.join(", ")}`
                : "No DNS records stored"}
            </span>
          </div>
        </div>

        {/* Automated Alerting Indicator */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground px-1 pt-1 border-t border-border/40 gap-2">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Automated monitoring active</span>
          </span>
          {monitor?.lastAlertedAt ? (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Alert dispatched: {formatDate(monitor.lastAlertedAt)} ({monitor.lastAlertStatus})
            </span>
          ) : (
            <span className="text-muted-foreground">All checks within normal parameters</span>
          )}
        </div>

        {/* History Accordion */}
        {showHistory && logs.length > 0 && (
          <div className="pt-2 border-t border-border/50 space-y-2 animate-in fade-in-0 duration-200">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Recent Probe History</span>
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {logs.map((log) => {
                const isHealthy = log.status === "healthy";
                const isWarn = log.status === "warning";
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border/60 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isHealthy ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : isWarn ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      )}
                      <span className="font-medium text-foreground truncate">{log.message}</span>
                    </div>

                    <div className="flex items-center gap-3 text-muted-foreground shrink-0 text-[11px]">
                      {log.latencyMs !== null && <span>{log.latencyMs}ms</span>}
                      <span>{new Date(log.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
