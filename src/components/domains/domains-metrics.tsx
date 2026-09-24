import React from "react";
import { Globe, ShieldCheck, AlertTriangle, Activity } from "lucide-react";
import type { DomainMetrics } from "@/lib/domains/types";

interface DomainsMetricsProps {
  metrics: DomainMetrics;
}

export function DomainsMetrics({ metrics }: DomainsMetricsProps) {
  const totalAssets = metrics.totalDomains + metrics.totalCertificates;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Domains & SSL */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-emerald-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Assets
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {totalAssets}
          </span>
          <span className="text-xs text-muted-foreground">
            ({metrics.totalDomains} domains, {metrics.totalCertificates} certs)
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Managed domains & SSL certificates
        </p>
      </div>

      {/* SSL Certificates Valid */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-blue-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Valid SSL Certificates
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {metrics.healthyMonitors}
          </span>
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            TLS Verified
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Certificates currently passing security probes
        </p>
      </div>

      {/* Expiring Soon */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-amber-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Expiring &lt; 30 Days
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {metrics.expiringSoon}
          </span>
          <span className="text-xs text-muted-foreground">
            Needs attention
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Upcoming domain or certificate renewals
        </p>
      </div>

      {/* Monitor Health */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-purple-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Monitor Health
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {metrics.failingMonitors === 0 ? "100%" : `${metrics.failingMonitors} Failing`}
          </span>
          <span
            className={`text-xs font-medium ${
              metrics.failingMonitors > 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {metrics.failingMonitors > 0 ? "Action Required" : "All Operational"}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Automated TLS & DNS background monitor status
        </p>
      </div>
    </div>
  );
}
