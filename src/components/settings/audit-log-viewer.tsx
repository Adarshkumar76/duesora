"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Search,
  User,
  FileText,
  UserCheck,
  RefreshCw,
  PlusCircle,
  Trash2,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuditLogEntry } from "@/lib/audit/types";

interface AuditLogViewerProps {
  workspaceId: string;
  initialLogs: AuditLogEntry[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  currentUserRole?: string;
}

export function AuditLogViewer({
  workspaceId,
  initialLogs,
  totalCount,
  currentPage,
  totalPages,
  currentUserRole: _currentUserRole,
}: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [page, setPage] = useState(currentPage);
  const [total, setTotal] = useState(totalCount);
  const [pages, setPages] = useState(totalPages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLogs(initialLogs);
    setTotal(totalCount);
    setPage(currentPage);
    setPages(totalPages);
  }, [initialLogs, totalCount, currentPage, totalPages, workspaceId]);

  async function fetchLogs(typeFilter: string, searchFilter: string, targetPage: number) {
    if (!workspaceId) {
      setError("No active workspace selected");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("entityType", typeFilter);
      if (searchFilter.trim()) params.set("search", searchFilter.trim());
      params.set("page", String(targetPage));
      params.set("pageSize", "10");

      const res = await fetch(`/api/workspaces/${workspaceId}/audit?${params.toString()}`);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        const errMsg = errorJson?.error?.message || `Failed to load audit logs (HTTP ${res.status})`;
        setError(errMsg);
        return;
      }

      const json = await res.json();
      if (json.data?.items) {
        setLogs(json.data.items);
      }
      if (json.data?.pagination) {
        setPage(json.data.pagination.page);
        setTotal(json.data.pagination.total);
        setPages(json.data.pagination.totalPages);
      }
    } catch (err) {
      console.warn("Audit logs network error:", err);
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  }

  function handleFilterClick(type: string) {
    setSelectedType(type);
    setPage(1);
    fetchLogs(type, search, 1);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchLogs(selectedType, search, 1);
  }

  function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > pages) return;
    setPage(newPage);
    fetchLogs(selectedType, search, newPage);
  }

  function renderActionIcon(action: string) {
    if (action.includes("created")) return <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />;
    if (action.includes("deleted") || action.includes("removed")) return <Trash2 className="w-3.5 h-3.5 text-rose-600" />;
    if (action.includes("renewed")) return <RefreshCw className="w-3.5 h-3.5 text-blue-600" />;
    if (action.includes("role") || action.includes("updated")) return <Edit className="w-3.5 h-3.5 text-amber-600" />;
    if (action.includes("invited")) return <UserCheck className="w-3.5 h-3.5 text-purple-600" />;
    return <FileText className="w-3.5 h-3.5 text-muted-foreground" />;
  }

  function formatActionPill(action: string) {
    let colorClass = "bg-muted text-muted-foreground";
    if (action.includes("created") || action.includes("renewed")) {
      colorClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    } else if (action.includes("deleted") || action.includes("removed") || action.includes("revoked")) {
      colorClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    } else if (action.includes("role") || action.includes("invited") || action.includes("updated")) {
      colorClass = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${colorClass}`}
      >
        {renderActionIcon(action)}
        <span>{action}</span>
      </span>
    );
  }

  const FILTERS = [
    { id: "all", label: "All Activity" },
    { id: "resource", label: "Resources" },
    { id: "member", label: "Team & Access" },
    { id: "invitation", label: "Invitations" },
    { id: "integration", label: "Integrations" },
  ];

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-foreground">Workspace Audit Log</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Immutable governance and security activity log for team member changes, resource mutations, and renewals.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 overflow-x-auto text-xs">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleFilterClick(f.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${selectedType === f.id
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter by action or target..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-1.5 rounded-xl text-xs bg-muted/30 border border-border focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-foreground placeholder:text-muted-foreground"
        />
      </form>

      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchLogs(selectedType, search, page)}
            className="underline hover:no-underline font-semibold cursor-pointer ml-3 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Log Entries Table */}
      <div className="rounded-xl border border-border/60 overflow-hidden bg-background/50">
        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/60 font-semibold text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Target Entity</th>
                  <th className="py-2.5 px-4">Details</th>
                  <th className="py-2.5 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-border/40 transition-opacity duration-200 ${isLoading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    {/* Actor */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {log.actorName ? log.actorName.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground truncate max-w-[120px]">
                            {log.actorName || log.actorEmail || "System"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-4">
                      {formatActionPill(log.action)}
                    </td>

                    {/* Target Entity */}
                    <td className="py-2.5 px-4">
                      <div>
                        <span className="font-medium text-foreground">
                          {log.entityName || log.entityId || "—"}
                        </span>
                        <span className="ml-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                          ({log.entityType})
                        </span>
                      </div>
                    </td>

                    {/* Details */}
                    <td className="py-2.5 px-4 text-muted-foreground">
                      {log.details ? (
                        <div className="font-mono text-[10px] truncate max-w-[200px]" title={JSON.stringify(log.details, null, 2)}>
                          {Object.entries(log.details)
                            .map(([k, v]) => `${k}: ${String(v)}`)
                            .join(", ")}
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="py-2.5 px-4 text-right whitespace-nowrap text-muted-foreground">
                      <span suppressHydrationWarning>
                        {mounted
                          ? new Date(log.createdAt).toLocaleString([], {
                            month: "short",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : "..."}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">No audit events found</p>
            <p>Activity history will be logged here as team and resource actions are performed.</p>
          </div>
        )}

        {/* Pagination Bar */}
        {total > 0 && (
          <div className="p-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>
                Page <strong className="font-semibold text-foreground">{page}</strong> of{" "}
                <strong className="font-semibold text-foreground">{Math.max(1, pages)}</strong>
              </span>
              <span className="text-muted-foreground/60">•</span>
              <span>
                {total} total event{total === 1 ? "" : "s"}
              </span>
              {isLoading && (
                <RefreshCw className="w-3 h-3 animate-spin text-emerald-600 ml-1 inline" />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => handlePageChange(page - 1)}
                className="h-7 px-2.5 text-xs rounded-lg cursor-pointer"
              >
                Previous
              </Button>

              {pages <= 7 ? (
                Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handlePageChange(p)}
                    className={`h-7 w-7 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      p === page
                        ? "bg-foreground text-background"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))
              ) : (
                <span className="px-2 text-xs font-medium text-foreground">
                  {page} / {pages}
                </span>
              )}

              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages || isLoading}
                onClick={() => handlePageChange(page + 1)}
                className="h-7 px-2.5 text-xs rounded-lg cursor-pointer"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
