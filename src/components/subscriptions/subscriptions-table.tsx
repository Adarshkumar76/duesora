"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard,
  ExternalLink,
  Search,
  Plus,
  ArrowRight,
  User,
  Clock,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportModal } from "@/components/resources/import-modal";
import { VendorLogo } from "@/components/resources/vendor-logo";
import { CURRENCY_SYMBOLS } from "@/lib/currency/rates";
import type { SubscriptionItem } from "@/lib/subscriptions/types";

interface SubscriptionsTableProps {
  initialItems: SubscriptionItem[];
  workspaceId: string;
  userRole?: string;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  workspaceCurrency: string;
}

export function SubscriptionsTable({
  initialItems,
  workspaceId,
  userRole,
  totalCount,
  currentPage,
  totalPages,
  workspaceCurrency,
}: SubscriptionsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const canEdit = userRole === "owner" || userRole === "admin" || userRole === "member";

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/subscriptions?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParam("search", searchQuery.trim() || null);
  }

  const currentType = searchParams.get("type") || "all";
  const currentCycle = searchParams.get("cycle") || "all";

  function formatTypeLabel(type: string) {
    switch (type) {
      case "cloud_service":
        return "Cloud";
      case "hosting":
        return "Hosting";
      case "software_license":
        return "License";
      default:
        return "SaaS";
    }
  }

  function formatCost(item: SubscriptionItem) {
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

    const isNonMonthly = item.billingCycle !== "monthly" && item.monthlyNormalizedMinor > 0;
    const targetSymbol = CURRENCY_SYMBOLS[workspaceCurrency] || "$";
    const monthlyNormalized = (item.monthlyNormalizedMinor / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return (
      <div className="space-y-0.5">
        <p className="text-xs font-bold text-foreground">
          {symbol}{amount}
          <span className="text-muted-foreground font-normal text-[11px]">
            {item.billingCycle === "monthly"
              ? " / mo"
              : item.billingCycle === "yearly"
              ? " / yr"
              : item.billingCycle === "quarterly"
              ? " / qtr"
              : ""}
          </span>
        </p>
        {isNonMonthly && (
          <p className="text-[10px] text-muted-foreground">
            ≈ {targetSymbol}{monthlyNormalized} / mo
          </p>
        )}
      </div>
    );
  }

  function formatRelativeRenewal(date: Date | null) {
    if (!date) return "No date set";
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return "Renews today";
    if (diffDays === 1) return "Renews tomorrow";
    return `In ${diffDays} days`;
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tool, provider, or vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-card border border-border focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-foreground placeholder:text-muted-foreground"
          />
        </form>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Billing Cycle */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60">
            {[
              { id: "all", label: "All Cycles" },
              { id: "monthly", label: "Monthly" },
              { id: "yearly", label: "Yearly" },
              { id: "quarterly", label: "Quarterly" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => updateParam("cycle", tab.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  currentCycle === tab.id
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60">
            {[
              { id: "all", label: "All Types" },
              { id: "subscription", label: "SaaS" },
              { id: "cloud_service", label: "Cloud" },
              { id: "hosting", label: "Hosting" },
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

          {/* Action Buttons */}
          {canEdit && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsImportModalOpen(true)}
                className="rounded-xl border-border/80 shadow-2xs gap-1.5 text-xs font-semibold hover:bg-muted/70 cursor-pointer h-8"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Import Subscriptions</span>
              </Button>

              <Link href="/resources/new?type=subscription">
                <Button
                  size="sm"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5 text-xs font-semibold cursor-pointer h-8"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subscription</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        {initialItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b border-border/60 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">Subscription & Vendor</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Cost & Cadence</th>
                  <th className="py-3 px-4">Next Renewal</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {initialItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    {/* Subscription & Vendor */}
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-3">
                        <VendorLogo
                          name={item.name}
                          type={item.type}
                          domain={item.websiteUrl}
                          className="w-8 h-8 rounded-xl mt-0.5"
                          size={16}
                        />
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
                                title="Open provider portal"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            {item.provider && (
                              <span>Provider: {item.provider}</span>
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

                    {/* Type */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                        {formatTypeLabel(item.type)}
                      </span>
                    </td>

                    {/* Cost & Cadence */}
                    <td className="py-3 px-4">
                      {formatCost(item)}
                    </td>

                    {/* Next Renewal */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span suppressHydrationWarning>
                            {item.renewalDate
                              ? new Date(item.renewalDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "2-digit",
                                  year: "numeric",
                                })
                              : "No renewal date"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span
                            suppressHydrationWarning
                            className="text-muted-foreground text-[11px]"
                          >
                            {formatRelativeRenewal(item.renewalDate)}
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

                    {/* Owner */}
                    <td className="py-3 px-4">
                      {item.ownerName || item.ownerEmail ? (
                        <div className="flex items-center gap-1.5 text-xs text-foreground">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="truncate max-w-[140px]" title={item.ownerEmail || ""}>
                            {item.ownerName || item.ownerEmail}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.websiteUrl && (
                          <a
                            href={item.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Go to vendor account"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Portal</span>
                            </Button>
                          </a>
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
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="p-8 sm:p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-foreground">
                No subscriptions found
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {searchQuery || currentCycle !== "all" || currentType !== "all"
                  ? "No subscriptions match your current filter parameters."
                  : "Track software tools, cloud services, and recurring subscriptions to stay in control of your monthly and annual commitments."}
              </p>
            </div>
            {canEdit && (
              <div className="pt-2">
                <Link href="/resources/new?type=subscription">
                  <Button
                    size="sm"
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Subscription</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              Page <strong className="font-semibold text-foreground">{currentPage}</strong> of{" "}
              <strong className="font-semibold text-foreground">{totalPages}</strong> ({totalCount} total)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => updateParam("page", String(currentPage - 1))}
                className="h-7 px-2.5 text-xs rounded-lg cursor-pointer"
              >
                Previous
              </Button>

              {totalPages <= 7 ? (
                Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => updateParam("page", String(p))}
                    className={`h-7 w-7 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      p === currentPage
                        ? "bg-foreground text-background"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))
              ) : null}

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => updateParam("page", String(currentPage + 1))}
                className="h-7 px-2.5 text-xs rounded-lg cursor-pointer"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Contextual CSV/JSON Importer */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        workspaceId={workspaceId}
        presetType="subscription"
      />
    </div>
  );
}
