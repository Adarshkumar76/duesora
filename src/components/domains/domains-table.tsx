"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Globe,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Plus,
  ArrowRight,
  Server,
  Activity,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportModal } from "@/components/resources/import-modal";
import type { DomainItem } from "@/lib/domains/types";
import type { MonitorStatus } from "@/lib/monitors/types";

interface DomainsTableProps {
  initialItems: DomainItem[];
  workspaceId: string;
  userRole?: string;
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export function DomainsTable({
  initialItems,
  workspaceId,
  userRole,
  totalCount,
  currentPage,
  totalPages,
}: DomainsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<DomainItem[]>(initialItems);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [sweepSummary, setSweepSummary] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [checkMessage, setCheckMessage] = useState<{ id: string; text: string; error?: boolean } | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const canEdit = userRole === "owner" || userRole === "admin" || userRole === "member";

  // URL Filter Helpers
  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/domains?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParam("search", searchQuery.trim() || null);
  }

  async function handleCheckAll() {
    setIsCheckingAll(true);
    setSweepSummary(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/resources/monitor`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to run health check sweep");
      }
      const data = json.data;
      setSweepSummary(
        `Sweep complete: ${data?.scannedCount || 0} scanned, ${data?.healthyCount || 0} healthy, ${data?.warningCount || 0} warnings, ${data?.criticalCount || 0} critical.`
      );
      router.refresh();
    } catch (err: unknown) {
      setSweepSummary(err instanceof Error ? err.message : "Health sweep failed");
    } finally {
      setIsCheckingAll(false);
    }
  }

  async function handleRunCheck(resourceId: string) {
    setCheckingId(resourceId);
    setCheckMessage(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/resources/${resourceId}/monitor`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to run health check");
      }

      if (json.data?.monitor) {
        const mon = json.data.monitor;
        setItems((prev) =>
          prev.map((item) =>
            item.id === resourceId
              ? {
                  ...item,
                  monitor: {
                    id: mon.id,
                    hostname: mon.hostname,
                    status: mon.status as MonitorStatus,
                    tlsIssuer: mon.tlsIssuer,
                    tlsSubject: mon.tlsSubject,
                    tlsValidFrom: mon.tlsValidFrom ? new Date(mon.tlsValidFrom) : null,
                    tlsValidTo: mon.tlsValidTo ? new Date(mon.tlsValidTo) : null,
                    tlsDaysRemaining: mon.tlsDaysRemaining,
                    tlsProtocol: mon.tlsProtocol,
                    dnsNameservers: mon.dnsNameservers,
                    dnsIpv4: mon.dnsIpv4,
                    latencyMs: mon.latencyMs,
                    lastCheckedAt: new Date(mon.lastCheckedAt),
                    errorMessage: mon.errorMessage,
                  },
                }
              : item
          )
        );
        setCheckMessage({
          id: resourceId,
          text: `Check complete: Status is ${mon.status} (${mon.latencyMs || 0}ms)`,
        });
      }
    } catch (err: unknown) {
      setCheckMessage({
        id: resourceId,
        text: err instanceof Error ? err.message : "Health check failed",
        error: true,
      });
    } finally {
      setCheckingId(null);
    }
  }

  const currentType = searchParams.get("type") || "all";
  const currentHealth = searchParams.get("health") || "all";

  function renderHealthBadge(status?: MonitorStatus) {
    switch (status) {
      case "healthy":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Healthy
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" />
            Warning
          </span>
        );
      case "critical":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-3 h-3" />
            Critical
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            <HelpCircle className="w-3 h-3" />
            Not Monitored
          </span>
        );
    }
  }

  function renderTlsDaysBadge(days?: number | null) {
    if (days === null || days === undefined) {
      return <span className="text-xs text-muted-foreground">—</span>;
    }
    if (days <= 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
          <ShieldX className="w-3.5 h-3.5" />
          Expired
        </span>
      );
    }
    if (days <= 14) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
          <ShieldAlert className="w-3.5 h-3.5" />
          {days} days left
        </span>
      );
    }
    if (days <= 30) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          {days} days left
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <ShieldCheck className="w-3.5 h-3.5" />
        {days} days left
      </span>
    );
  }

  function formatRelativeExpiry(date: Date | null) {
    if (!date) return "No date set";
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return "Expires today";
    if (diffDays === 1) return "Expires tomorrow";
    return `In ${diffDays} days`;
  }

  return (
    <div className="space-y-4">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search domain, host, or registrar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-card border border-border focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-foreground placeholder:text-muted-foreground"
          />
        </form>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Asset Type */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60">
            {[
              { id: "all", label: "All Types" },
              { id: "domain", label: "Domains" },
              { id: "ssl_certificate", label: "SSL Certs" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => updateParam("type", tab.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  currentType === tab.id
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Health Status */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60">
            {[
              { id: "all", label: "All Health" },
              { id: "healthy", label: "Healthy" },
              { id: "warning", label: "Warning" },
              { id: "critical", label: "Critical" },
              { id: "unmonitored", label: "Unmonitored" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => updateParam("health", tab.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  currentHealth === tab.id
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sweep All Action */}
          {canEdit && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isCheckingAll}
                onClick={handleCheckAll}
                className="rounded-xl border-border/80 shadow-2xs gap-1.5 text-xs font-semibold hover:bg-muted/70 cursor-pointer h-8"
                title="Run health checks on all workspace domains & SSL certificates"
              >
                {isCheckingAll ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                    <span>Checking All...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Check All</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsImportModalOpen(true)}
                className="rounded-xl border-border/80 shadow-2xs gap-1.5 text-xs font-semibold hover:bg-muted/70 cursor-pointer h-8"
                title="Import domains via CSV"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Import Domains</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Sweep Notification Banner */}
      {sweepSummary && (
        <div className="p-3 rounded-xl text-xs flex items-center justify-between border bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 shrink-0" />
            <span>{sweepSummary}</span>
          </div>
          <button
            onClick={() => setSweepSummary(null)}
            className="text-muted-foreground hover:text-foreground ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Check Notification Banner */}
      {checkMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
            checkMessage.error
              ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          <span>{checkMessage.text}</span>
          <button
            onClick={() => setCheckMessage(null)}
            className="text-muted-foreground hover:text-foreground ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b border-border/60 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">Domain / Asset</th>
                  <th className="py-3 px-4">SSL/TLS Certificate</th>
                  <th className="py-3 px-4">DNS & Server</th>
                  <th className="py-3 px-4">Renewal & Expiry</th>
                  <th className="py-3 px-4">Monitor Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {items.map((item) => {
                  const isChecking = checkingId === item.id;
                  const targetUrl = item.websiteUrl || `https://${item.name}`;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Domain / Asset */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            {item.type === "ssl_certificate" ? (
                              <ShieldCheck className="w-4 h-4" />
                            ) : (
                              <Globe className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/resources/${item.id}`}
                                className="font-semibold text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                              >
                                {item.name}
                              </Link>
                              {item.websiteUrl && (
                                <a
                                  href={targetUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Visit domain"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                              {item.provider && (
                                <span>Registrar: {item.provider}</span>
                              )}
                              {item.category && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{item.category}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SSL/TLS Certificate */}
                      <td className="py-3 px-4">
                        {item.monitor?.tlsIssuer ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              {renderTlsDaysBadge(item.monitor.tlsDaysRemaining)}
                              {item.monitor.tlsProtocol && (
                                <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.2 rounded-sm bg-muted">
                                  {item.monitor.tlsProtocol}
                                </span>
                              )}
                            </div>
                            <p
                              className="text-xs text-muted-foreground truncate max-w-[180px]"
                              title={item.monitor.tlsIssuer}
                            >
                              {item.monitor.tlsIssuer}
                            </p>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            <span>No TLS probe data</span>
                          </div>
                        )}
                      </td>

                      {/* DNS & Server */}
                      <td className="py-3 px-4">
                        {item.monitor ? (
                          <div className="space-y-0.5 text-xs">
                            <div className="flex items-center gap-1.5 text-foreground font-mono text-[11px]">
                              <Server className="w-3 h-3 text-muted-foreground" />
                              <span>{item.monitor.hostname}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                              {item.monitor.latencyMs !== null && (
                                <span>{item.monitor.latencyMs}ms ping</span>
                              )}
                              {item.monitor.lastCheckedAt && (
                                <span suppressHydrationWarning>
                                  Checked{" "}
                                  {new Date(item.monitor.lastCheckedAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Renewal & Expiry */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p
                            suppressHydrationWarning
                            className="text-xs font-semibold text-foreground"
                          >
                            {item.renewalDate
                              ? new Date(item.renewalDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "2-digit",
                                  year: "numeric",
                                })
                              : "No renewal date"}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs">
                            <span
                              suppressHydrationWarning
                              className="text-muted-foreground"
                            >
                              {formatRelativeExpiry(item.renewalDate)}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                                item.autoRenew
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {item.autoRenew ? "Auto-renew" : "Manual"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Monitor Status */}
                      <td className="py-3 px-4">
                        {renderHealthBadge(item.monitor?.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRunCheck(item.id)}
                              disabled={isChecking}
                              className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Run live TLS & DNS probe"
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 ${isChecking ? "animate-spin text-emerald-600" : ""}`}
                              />
                              <span className="hidden sm:inline">
                                {isChecking ? "Testing..." : "Check"}
                              </span>
                            </Button>
                          )}
                          <Link href={`/resources/${item.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2.5 rounded-lg text-xs gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <span>View</span>
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="p-8 sm:p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Globe className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-foreground">
                No domains or certificates found
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {searchQuery || currentHealth !== "all" || currentType !== "all"
                  ? "No matching domains match your current filter criteria."
                  : "Track domain expirations, nameservers, and monitor SSL/TLS certificates with automated background health checks."}
              </p>
            </div>
            <div className="pt-2">
              <Link href="/resources/new?type=domain">
                <Button
                  size="sm"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5 text-xs font-medium cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Domain</span>
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Page {currentPage} of {totalPages} ({totalCount} total)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => updateParam("page", String(currentPage - 1))}
                className="h-7 text-xs rounded-lg cursor-pointer"
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-1 text-muted-foreground/50">...</span>}
                    <button
                      type="button"
                      onClick={() => updateParam("page", String(p))}
                      className={`h-7 w-7 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                        currentPage === p
                          ? "bg-emerald-600 text-white font-semibold"
                          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => updateParam("page", String(currentPage + 1))}
                className="h-7 text-xs rounded-lg cursor-pointer"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        workspaceId={workspaceId}
        presetType="domain"
      />
    </div>
  );
}
