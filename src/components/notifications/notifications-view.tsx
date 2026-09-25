"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Bell,
  AlertTriangle,
  Clock,
  Info,
  CheckCheck,
  Check,
  RefreshCw,
  ExternalLink,
  Loader2,
  Calendar,
} from "lucide-react";
import type { NotificationItem } from "@/lib/notifications/repository";

interface NotificationsViewProps {
  initialNotifications: NotificationItem[];
  initialTotal: number;
  initialUnreadCount: number;
  workspaceId: string;
  userRole?: string;
  currentPage?: number;
  pageSize?: number;
}

export function NotificationsView({
  initialNotifications,
  initialTotal,
  initialUnreadCount,
  workspaceId,
  userRole = "member",
  currentPage = 1,
  pageSize = 20,
}: NotificationsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<NotificationItem[]>(initialNotifications);
  const [prevInitial, setPrevInitial] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "critical" | "warning">("all");
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  if (prevInitial !== initialNotifications) {
    setPrevInitial(initialNotifications);
    setItems(initialNotifications);
  }

  const totalPages = Math.max(1, Math.ceil(initialTotal / pageSize));

  function updatePage(newPage: number) {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set("page", String(newPage));
    router.push(`/notifications?${params.toString()}`);
  }

  const canRunCheck = userRole === "owner" || userRole === "admin";

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/notifications/${id}`, {
        method: "PATCH",
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((n) => (n.id === id ? { ...n, status: "read", readAt: new Date() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/notifications`, {
        method: "PATCH",
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((n) => ({ ...n, status: "read", readAt: new Date() }))
        );
        setUnreadCount(0);
      }
    } catch {
      // ignore
    }
  };

  const handleRunRenewalCheck = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/reminders/run`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok && json.data) {
        const summary = json.data;
        setScanMessage(
          `Scanned ${summary.scannedCount} resources. Dispatched ${summary.dispatchedInAppCount} in-app alerts and ${summary.dispatchedEmailCount} emails.`
        );
        // Refresh list
        const listRes = await fetch(`/api/workspaces/${workspaceId}/notifications?pageSize=50`);
        const listJson = await listRes.json();
        if (listJson.data) {
          setItems(listJson.data);
          setUnreadCount(listJson.meta?.unreadCount ?? 0);
        }
      } else {
        setScanMessage(json.error?.message || "Check completed with errors.");
      }
    } catch (err) {
      setScanMessage(err instanceof Error ? err.message : "Failed to run check.");
    } finally {
      setIsScanning(false);
    }
  };

  // Filter items
  const filteredItems = items.filter((n) => {
    if (activeFilter === "unread") return n.status === "unread";
    if (activeFilter === "critical") return n.severity === "critical";
    if (activeFilter === "warning") return n.severity === "warning";
    return true;
  });

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner / Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Renewal alerts, upcoming deadlines, and workspace updates.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="rounded-xl border-border/80 shadow-2xs text-xs font-medium cursor-pointer gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mark all as read</span>
            </Button>
          )}

          {canRunCheck && (
            <Button
              size="sm"
              onClick={handleRunRenewalCheck}
              disabled={isScanning}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs text-xs font-medium cursor-pointer gap-1.5"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking Renewals...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Run Renewal Check</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Scan Feedback Banner */}
      {scanMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300/50 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between font-medium animate-in fade-in-0 duration-200">
          <span>{scanMessage}</span>
          <button
            type="button"
            onClick={() => setScanMessage(null)}
            className="hover:opacity-75 cursor-pointer ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3 overflow-x-auto text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
            activeFilter === "all"
              ? "bg-foreground text-background font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          All ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("unread")}
          className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
            activeFilter === "unread"
              ? "bg-foreground text-background font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("critical")}
          className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
            activeFilter === "critical"
              ? "bg-foreground text-background font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Urgent ({items.filter((n) => n.severity === "critical").length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("warning")}
          className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
            activeFilter === "warning"
              ? "bg-foreground text-background font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Warnings ({items.filter((n) => n.severity === "warning").length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center bg-card">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground mx-auto flex items-center justify-center mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No notifications found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              {activeFilter === "unread"
                ? "You've read all your notifications. Great job!"
                : "No notifications match this filter."}
            </p>
          </div>
        ) : (
          filteredItems.map((notif) => {
            const isUnread = notif.status === "unread";
            const isCritical = notif.severity === "critical";
            const isWarning = notif.severity === "warning";

            return (
              <div
                key={notif.id}
                className={`rounded-2xl border p-4 sm:p-4.5 transition-all duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 ${
                  isUnread
                    ? isCritical
                      ? "border-rose-300/60 bg-rose-50/20 dark:bg-rose-950/10 shadow-xs"
                      : "border-emerald-300/50 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs"
                    : "border-border/70 bg-card hover:border-border"
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isCritical
                        ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300/30"
                        : isWarning
                        ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300/30"
                        : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300/30"
                    }`}
                  >
                    {isCritical ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : isWarning ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <Info className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-foreground">{notif.title}</h4>
                      {isUnread && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          New
                        </span>
                      )}
                      {notif.resourceName && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-foreground">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span>{notif.resourceName}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                      <span>{formatDate(notif.createdAt)}</span>
                      {notif.resourceId && (
                        <Link
                          href={`/resources/${notif.resourceId}`}
                          className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          <span>Open Resource</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  {isUnread ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkRead(notif.id)}
                      title="Mark as read"
                      className="rounded-xl text-xs text-muted-foreground hover:text-foreground cursor-pointer h-8 px-2.5"
                    >
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      <span>Read</span>
                    </Button>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/60 px-2 py-1">
                      Read
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="p-4 border border-border/60 bg-card rounded-2xl flex items-center justify-between text-xs text-muted-foreground shadow-2xs">
          <span>
            Page {currentPage} of {totalPages} ({initialTotal} total)
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => updatePage(currentPage - 1)}
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
                    onClick={() => updatePage(p)}
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
              onClick={() => updatePage(currentPage + 1)}
              className="h-7 text-xs rounded-lg cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
