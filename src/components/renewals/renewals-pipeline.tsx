"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Search,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Ban,
  Handshake,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CURRENCY_SYMBOLS } from "@/lib/currency/rates";
import type { RenewalItem, UrgencyBucket, RenewalDecision } from "@/lib/renewals/types";

interface RenewalsPipelineProps {
  initialItems: RenewalItem[];
  workspaceId: string;
  userRole?: string;
  workspaceCurrency: string;
}

export function RenewalsPipeline({
  initialItems,
  workspaceId,
  userRole,
  workspaceCurrency,
}: RenewalsPipelineProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<RenewalItem[]>(initialItems);
  const [prevInitialItems, setPrevInitialItems] = useState(initialItems);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [updatingDecisionId, setUpdatingDecisionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [statusMessage, setStatusMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Sync state if initialItems changes (e.g. on navigation) using standard React pattern
  if (prevInitialItems !== initialItems) {
    setPrevInitialItems(initialItems);
    setItems(initialItems);
  }

  const canEdit = userRole === "owner" || userRole === "admin" || userRole === "member";

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/renewals?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParam("search", searchQuery.trim() || null);
  }

  async function handleMarkRenewed(resourceId: string, resourceName: string) {
    setRenewingId(resourceId);
    setStatusMessage(null);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/resources/${resourceId}/renew`,
        {
          method: "POST",
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to renew resource");
      }

      const updated = json.data?.resource;
      const nextDate = updated?.renewalDate ? new Date(updated.renewalDate) : null;

      // Update in local state
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === resourceId && nextDate) {
            const now = new Date();
            const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            let newBucket: UrgencyBucket = "later";
            if (diffDays < 0) newBucket = "overdue";
            else if (diffDays <= 7) newBucket = "critical";
            else if (diffDays <= 30) newBucket = "upcoming";
            else if (diffDays <= 90) newBucket = "medium";

            return {
              ...item,
              renewalDate: nextDate,
              status: "active",
              diffDays,
              urgencyBucket: newBucket,
            };
          }
          return item;
        })
      );

      const formattedNext = nextDate
        ? nextDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
        : "";

      setStatusMessage({
        text: `Successfully renewed "${resourceName}"! Next renewal date advanced to ${formattedNext}.`,
      });
    } catch (err: unknown) {
      setStatusMessage({
        text: err instanceof Error ? err.message : "Renewal failed",
        error: true,
      });
    } finally {
      setRenewingId(null);
    }
  }

  async function handleDecisionChange(
    resourceId: string,
    resourceName: string,
    newDecision: RenewalDecision
  ) {
    setUpdatingDecisionId(resourceId);
    setStatusMessage(null);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/resources/${resourceId}/renewal-decision`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision: newDecision }),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to update renewal decision");
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === resourceId ? { ...item, renewalDecision: newDecision } : item
        )
      );

      const labelMap: Record<RenewalDecision, string> = {
        none: "Unreviewed",
        needs_review: "Needs Review",
        approved: "Approved to Renew",
        cancel: "Marked to Cancel",
        negotiate: "In Negotiation",
      };

      setStatusMessage({
        text: `Updated decision for "${resourceName}" to "${labelMap[newDecision]}".`,
      });
    } catch (err: unknown) {
      setStatusMessage({
        text: err instanceof Error ? err.message : "Failed to update decision",
        error: true,
      });
    } finally {
      setUpdatingDecisionId(null);
    }
  }

  const currentBucket = searchParams.get("bucket") || "all";
  const currentDecision = searchParams.get("decision") || "all";

  const BUCKETS = [
    { id: "all", label: "All Upcoming" },
    { id: "overdue", label: "Overdue" },
    { id: "critical", label: "Next 7 Days" },
    { id: "upcoming", label: "Next 30 Days" },
    { id: "medium", label: "90-Day Outlook" },
    { id: "later", label: "Later" },
  ];

  const DECISION_TABS = [
    { id: "all", label: "All Decisions" },
    { id: "needs_review", label: "Needs Review" },
    { id: "approved", label: "Approved" },
    { id: "cancel", label: "Marked to Cancel" },
    { id: "negotiate", label: "Negotiating" },
  ];

  function renderUrgencyBadge(item: RenewalItem) {
    if (item.diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <AlertCircle className="w-3.5 h-3.5" />
          {Math.abs(item.diffDays)}d overdue
        </span>
      );
    }
    if (item.diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <AlertCircle className="w-3.5 h-3.5" />
          Due Today
        </span>
      );
    }
    if (item.diffDays <= 7) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          In {item.diffDays} days
        </span>
      );
    }
    if (item.diffDays <= 30) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Clock className="w-3.5 h-3.5" />
          In {item.diffDays} days
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
        In {item.diffDays} days
      </span>
    );
  }

  function renderDecisionBadge(d: RenewalDecision) {
    switch (d) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case "cancel":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
            <Ban className="w-3 h-3" /> Cancel
          </span>
        );
      case "needs_review":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3 h-3" /> Review
          </span>
        );
      case "negotiate":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Handshake className="w-3 h-3" /> Negotiate
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground border border-border/50">
            <Clock className="w-3 h-3" /> Unreviewed
          </span>
        );
    }
  }

  function formatCost(item: RenewalItem) {
    if (item.amountMinor === null || item.amountMinor === undefined) {
      return <span className="text-xs text-muted-foreground">—</span>;
    }
    if (item.amountMinor === 0) {
      return <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Free</span>;
    }

    const symbol = CURRENCY_SYMBOLS[item.currency] || item.currency + " ";
    const amount = (item.amountMinor / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const isDifferentCurrency = item.currency !== workspaceCurrency;
    const targetSymbol = CURRENCY_SYMBOLS[workspaceCurrency] || "$";
    const converted = (item.normalizedCostMinor / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return (
      <div className="space-y-0.5">
        <p className="text-xs font-bold text-foreground">
          {symbol}{amount}
        </p>
        {isDifferentCurrency && (
          <p className="text-[10px] text-muted-foreground">
            ≈ {targetSymbol}{converted}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls & Bucket Tabs */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search renewal or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </form>

          {/* Urgency Horizons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {BUCKETS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => updateParam("bucket", tab.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
                  currentBucket === tab.id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Decision Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-semibold text-muted-foreground shrink-0">
            <Filter className="w-3.5 h-3.5" /> Decision:
          </span>
          {DECISION_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => updateParam("decision", tab.id)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 cursor-pointer border ${
                currentDecision === tab.id
                  ? "bg-foreground text-background font-semibold border-foreground"
                  : "bg-card border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
            statusMessage.error
              ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-muted-foreground hover:text-foreground ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b border-border/60 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">Asset & Provider</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">Renewal Date</th>
                  <th className="py-3 px-4">Cost</th>
                  <th className="py-3 px-4">Decision & Notice</th>
                  <th className="py-3 px-4">Auto-Renew</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {items.map((item) => {
                  const isRenewing = renewingId === item.id;
                  const isUpdatingDecision = updatingDecisionId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Asset & Provider */}
                      <td className="py-3 px-4">
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
                                href={item.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Open website"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            {item.provider && (
                              <span>Provider: {item.provider}</span>
                            )}
                            <span className="capitalize px-1.5 py-0.2 rounded-md bg-muted text-[10px]">
                              {item.type.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Urgency */}
                      <td className="py-3 px-4">
                        {renderUrgencyBadge(item)}
                      </td>

                      {/* Renewal Date */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p
                            suppressHydrationWarning
                            className="text-xs font-semibold text-foreground"
                          >
                            {new Date(item.renewalDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                            })}
                          </p>
                          <span className="text-[11px] capitalize text-muted-foreground">
                            {item.billingCycle} cycle
                          </span>
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4">
                        {formatCost(item)}
                      </td>

                      {/* Renewal Decision & Notice Window */}
                      <td className="py-3 px-4">
                        <div className="space-y-1.5">
                          {canEdit ? (
                            <select
                              value={item.renewalDecision || "none"}
                              disabled={isUpdatingDecision}
                              onChange={(e) =>
                                handleDecisionChange(
                                  item.id,
                                  item.name,
                                  e.target.value as RenewalDecision
                                )
                              }
                              className={`text-xs px-2 py-1 rounded-lg border font-semibold focus:outline-none transition-colors cursor-pointer ${
                                item.renewalDecision === "approved"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                  : item.renewalDecision === "cancel"
                                  ? "bg-destructive/10 text-destructive border-destructive/30"
                                  : item.renewalDecision === "needs_review"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                  : item.renewalDecision === "negotiate"
                                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                                  : "bg-muted/50 text-muted-foreground border-border/60"
                              }`}
                            >
                              <option value="none">Unreviewed</option>
                              <option value="needs_review">Needs Review</option>
                              <option value="approved">Approved to Renew</option>
                              <option value="cancel">Marked to Cancel</option>
                              <option value="negotiate">In Negotiation</option>
                            </select>
                          ) : (
                            renderDecisionBadge(item.renewalDecision)
                          )}

                          {/* Cancellation Notice Countdown */}
                          {item.noticeDaysRemaining !== null && (
                            <div className="flex items-center gap-1 text-[10px]" suppressHydrationWarning>
                              <span
                                className={`px-1.5 py-0.5 rounded font-medium border ${
                                  item.noticeDaysRemaining < 0
                                    ? "bg-destructive/10 text-destructive border-destructive/20"
                                    : item.noticeDaysRemaining <= 7
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                    : "bg-muted text-muted-foreground border-border/50"
                                }`}
                              >
                                {item.noticeDaysRemaining < 0
                                  ? "Notice expired"
                                  : item.noticeDaysRemaining === 0
                                  ? "Notice due today!"
                                  : `Notice: ${item.noticeDaysRemaining}d left`}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Auto-Renew */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            item.autoRenew
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.autoRenew ? "Auto-renew On" : "Manual Renewal"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkRenewed(item.id, item.name)}
                              disabled={isRenewing}
                              className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-500/10 border-emerald-500/30 cursor-pointer"
                              title="Advance renewal date by 1 billing cycle"
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 ${isRenewing ? "animate-spin text-emerald-600" : ""}`}
                              />
                              <span className="hidden sm:inline">
                                {isRenewing ? "Renewing..." : "Mark Renewed"}
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
          <div className="py-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              No renewals matching criteria
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? `No upcoming renewals matched "${searchQuery}". Try another keyword or clear the search.`
                : "All resources in this horizon are up to date with no pending actions."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
