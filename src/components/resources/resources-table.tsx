"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Tag as TagIcon,
  User as UserIcon,
  CheckCircle,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  MoreHorizontal,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/tags/tag-badge";
import { VendorLogo } from "@/components/resources/vendor-logo";

export interface ResourceRowItem {
  id: string;
  name: string;
  type: string;
  status: string;
  category?: string | null;
  provider?: string | null;
  websiteUrl?: string | null;
  amountMinor?: number | null;
  currency?: string | null;
  billingCycle?: string | null;
  renewalDate?: Date | string | null;
  autoRenew?: boolean | null;
  owner?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  tags?: Array<{
    id: string;
    name: string;
    colorToken: string;
  }>;
}

export interface TeamMemberSimple {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export interface TagSimple {
  id: string;
  name: string;
  colorToken: string;
}

interface ResourcesTableProps {
  items: ResourceRowItem[];
  workspaceId: string;
  userRole?: string;
  availableTags?: TagSimple[];
  teamMembers?: TeamMemberSimple[];
}

export function ResourcesTable({
  items,
  workspaceId,
  userRole = "viewer",
  availableTags = [],
  teamMembers = [],
}: ResourcesTableProps) {
  const router = useRouter();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modal states
  const [activeModal, setActiveModal] = useState<
    "tag" | "owner" | "status" | "delete" | null
  >(null);

  // Bulk Tag modal inputs
  const [tagMode, setTagMode] = useState<"add" | "remove" | "replace">("add");
  const [chosenTags, setChosenTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");

  // Bulk Owner modal input
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | "none">("none");

  // Bulk Status modal input
  const [selectedStatus, setSelectedStatus] = useState<
    "active" | "inactive" | "expired" | "archived"
  >("active");

  const canEdit =
    userRole === "owner" || userRole === "admin" || userRole === "member";

  const allPageIds = items.map((i) => i.id);
  const isAllSelected =
    items.length > 0 && allPageIds.every((id) => selectedIds.includes(id));
  const isSomeSelected =
    items.some((i) => selectedIds.includes(i.id)) && !isAllSelected;

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allPageIds);
    }
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  async function executeBulkAction(payload: Record<string, unknown>) {
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/resources/bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            resourceIds: selectedIds,
          }),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message || "Failed to perform bulk action");
      }

      setFeedback({
        type: "success",
        message: json.data?.message || "Bulk action completed successfully.",
      });

      setSelectedIds([]);
      setActiveModal(null);
      router.refresh();

      // Auto-clear success message after 4s
      setTimeout(() => {
        setFeedback(null);
      }, 4000);
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to perform bulk action",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleAddCustomTag() {
    const trimmed = customTagInput.trim().replace(/^#/, "");
    if (!trimmed) return;
    if (!chosenTags.includes(trimmed)) {
      setChosenTags([...chosenTags, trimmed]);
    }
    setCustomTagInput("");
  }

  function toggleTagChoice(tagName: string) {
    if (chosenTags.includes(tagName)) {
      setChosenTags(chosenTags.filter((t) => t !== tagName));
    } else {
      setChosenTags([...chosenTags, tagName]);
    }
  }

  function formatTypePill(type: string) {
    if (type === "domain") return "Domain";
    if (type === "subscription") return "Subscription";
    if (type === "ssl_certificate") return "Certificate";
    if (type === "hosting") return "Hosting";
    if (type === "cloud_service") return "Server";
    if (type === "software_license") return "Software";
    return "Other";
  }

  function formatAmount(item: ResourceRowItem) {
    if (item.amountMinor === 0) return "Free";
    if (!item.amountMinor && item.amountMinor !== 0) return "—";

    const symbol =
      item.currency === "INR"
        ? "₹"
        : item.currency === "EUR"
        ? "€"
        : item.currency === "GBP"
        ? "£"
        : "$";

    const amountFormatted = (item.amountMinor / 100).toFixed(2);
    const suffix =
      item.billingCycle === "monthly"
        ? " / mo"
        : item.billingCycle === "quarterly"
        ? " / qtr"
        : item.billingCycle === "yearly"
        ? " / yr"
        : "";
    return `${symbol}${amountFormatted}${suffix}`;
  }

  function formatDate(d?: Date | string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }

  return (
    <div className="relative">
      {/* Toast Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`mb-4 p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
              : "bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b border-border/60 text-xs font-semibold text-muted-foreground">
            <tr>
              {canEdit && (
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    aria-label="Select all resources on this page"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                </th>
              )}
              <th className="py-3.5 px-6">Name</th>
              <th className="py-3.5 px-6">Type</th>
              <th className="py-3.5 px-6">Provider / Owner</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6">Next Renewal</th>
              <th className="py-3.5 px-6">Amount</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {items.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <tr
                  key={item.id}
                  className={`transition-colors ${
                    isSelected
                      ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                      : "hover:bg-muted/20"
                  }`}
                >
                  {/* Row Checkbox */}
                  {canEdit && (
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Select resource ${item.name}`}
                        checked={isSelected}
                        onChange={() => toggleRow(item.id)}
                        className="w-4 h-4 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                      />
                    </td>
                  )}

                  {/* Name & Tags */}
                  <td className="py-4 px-6 font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <VendorLogo
                        name={item.name}
                        type={item.type}
                        domain={item.websiteUrl}
                        className="w-7 h-7 rounded-lg shrink-0"
                        size={15}
                      />
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/resources/${item.id}`}
                            className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors truncate"
                          >
                            {item.name}
                          </Link>
                        {item.category && (
                          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                            {item.category}
                          </span>
                        )}
                      </div>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {item.tags.slice(0, 3).map((t) => (
                            <TagBadge
                              key={t.id}
                              name={t.name}
                              colorToken={t.colorToken}
                              className="text-[10px] px-1.5 py-0"
                            />
                          ))}
                          {item.tags.length > 3 && (
                            <span className="text-[10px] text-muted-foreground font-medium">
                              +{item.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                  {/* Type Pill */}
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {formatTypePill(item.type)}
                    </span>
                  </td>

                  {/* Provider & Owner */}
                  <td className="py-4 px-6 text-foreground font-normal">
                    <div>{item.provider || "—"}</div>
                    {item.owner && (
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {item.owner.name || item.owner.email}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-6">
                    {item.status === "active" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
                        Active
                      </span>
                    ) : item.status === "expired" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100/80 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-300/40">
                        Expired
                      </span>
                    ) : item.status === "archived" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100/80 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300/40">
                        Archived
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/40">
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* Next Renewal */}
                  <td
                    className="py-4 px-6 text-muted-foreground text-xs sm:text-sm"
                    suppressHydrationWarning
                  >
                    {formatDate(item.renewalDate)}
                  </td>

                  {/* Amount */}
                  <td className="py-4 px-6 font-semibold text-foreground">
                    {formatAmount(item)}
                  </td>

                  {/* Actions Menu */}
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/resources/${item.id}`}
                      aria-label={`View details for ${item.name}`}
                      className="inline-flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Floating Bulk Actions Toolbar */}
      {canEdit && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 px-4 py-2.5 rounded-2xl bg-card/95 dark:bg-slate-900/95 backdrop-blur-md border border-border shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2 pr-2 border-r border-border/80">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              {selectedIds.length}
            </span>
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
              selected
            </span>
            <button
              onClick={clearSelection}
              aria-label="Clear selection"
              className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 transition-colors cursor-pointer ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Tag Button */}
            <Button
              id="bulk-action-tag-btn"
              size="sm"
              variant="outline"
              onClick={() => {
                setChosenTags([]);
                setActiveModal("tag");
              }}
              className="rounded-xl h-8 px-2.5 sm:px-3 text-xs font-medium gap-1.5 border-border/80 cursor-pointer"
            >
              <TagIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Tags</span>
            </Button>

            {/* Owner Button */}
            <Button
              id="bulk-action-owner-btn"
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedOwnerId("none");
                setActiveModal("owner");
              }}
              className="rounded-xl h-8 px-2.5 sm:px-3 text-xs font-medium gap-1.5 border-border/80 cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Owner</span>
            </Button>

            {/* Status Button */}
            <Button
              id="bulk-action-status-btn"
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedStatus("active");
                setActiveModal("status");
              }}
              className="rounded-xl h-8 px-2.5 sm:px-3 text-xs font-medium gap-1.5 border-border/80 cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Status</span>
            </Button>

            {/* Delete Button */}
            <Button
              id="bulk-action-delete-btn"
              size="sm"
              variant="destructive"
              onClick={() => setActiveModal("delete")}
              className="rounded-xl h-8 px-2.5 sm:px-3 text-xs font-medium gap-1.5 shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>
      )}

      {/* --- MODAL: Bulk Tag --- */}
      {activeModal === "tag" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-sm text-foreground">
                  Bulk Tag ({selectedIds.length} resources)
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Action Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["add", "replace", "remove"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTagMode(m)}
                    className={`py-1.5 text-xs font-medium rounded-xl border transition-colors capitalize cursor-pointer ${
                      tagMode === m
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Existing Available Tags */}
            {availableTags.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Select existing tags:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 border border-border/60 rounded-xl">
                  {availableTags.map((t) => {
                    const isChosen = chosenTags.includes(t.name);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTagChoice(t.name)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isChosen
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 font-semibold"
                            : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span>{t.name}</span>
                        {isChosen && <Check className="w-3 h-3 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Tag Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Or add custom tag:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. production, compliance"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={handleAddCustomTag}
                  className="rounded-xl text-xs h-8 cursor-pointer"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Selected Tags Preview */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-foreground">
                Tags to apply:
              </div>
              <div className="min-h-8 p-2 rounded-xl bg-muted/30 border border-border/60 flex flex-wrap gap-1.5 items-center">
                {chosenTags.length > 0 ? (
                  chosenTags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => toggleTagChoice(t)}
                        className="hover:opacity-75 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    No tags selected
                  </span>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModal(null)}
                disabled={loading}
                className="rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  executeBulkAction({
                    action: "bulk_tag",
                    tags: chosenTags,
                    mode: tagMode,
                  })
                }
                disabled={loading || chosenTags.length === 0}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Apply Tags</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: Bulk Assign Owner --- */}
      {activeModal === "owner" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="font-semibold text-sm text-foreground">
                  Bulk Assign Owner ({selectedIds.length} resources)
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Select Owner:
              </label>
              <div className="max-h-60 overflow-y-auto space-y-1.5 p-1 border border-border/60 rounded-xl">
                {/* Option: Unassigned */}
                <button
                  type="button"
                  onClick={() => setSelectedOwnerId("none")}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    selectedOwnerId === "none"
                      ? "bg-sky-500/15 border-sky-500/40 text-foreground font-semibold"
                      : "border-border/60 bg-muted/20 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <div>
                    <div className="text-foreground font-medium">
                      Unassigned (None)
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Remove owner from selected resources
                    </div>
                  </div>
                  {selectedOwnerId === "none" && (
                    <Check className="w-4 h-4 text-sky-600" />
                  )}
                </button>

                {/* Team Members List */}
                {teamMembers.map((member) => {
                  const isSelected = selectedOwnerId === member.id;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedOwnerId(member.id)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-sky-500/15 border-sky-500/40 text-foreground font-semibold"
                          : "border-border/60 bg-muted/20 hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <div>
                        <div className="text-foreground font-medium">
                          {member.name || member.email}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {member.email} ({member.role})
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-sky-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModal(null)}
                disabled={loading}
                className="rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  executeBulkAction({
                    action: "bulk_owner",
                    ownerId: selectedOwnerId === "none" ? null : selectedOwnerId,
                  })
                }
                disabled={loading}
                className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold gap-1.5 cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Assign Owner</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: Bulk Status --- */}
      {activeModal === "status" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="font-semibold text-sm text-foreground">
                  Bulk Change Status ({selectedIds.length} resources)
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Select new status:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      id: "active",
                      label: "Active",
                      desc: "Currently active & monitored",
                    },
                    {
                      id: "inactive",
                      label: "Inactive",
                      desc: "Suspended or paused",
                    },
                    {
                      id: "expired",
                      label: "Expired",
                      desc: "Lapsed renewal",
                    },
                    {
                      id: "archived",
                      label: "Archived",
                      desc: "Historical record",
                    },
                  ] as const
                ).map((s) => {
                  const isSelected = selectedStatus === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStatus(s.id)}
                      className={`text-left p-3 rounded-xl border text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-amber-500/15 border-amber-500/40 text-foreground font-semibold"
                          : "border-border/60 bg-muted/20 hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <div className="text-foreground font-semibold">{s.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {s.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModal(null)}
                disabled={loading}
                className="rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  executeBulkAction({
                    action: "bulk_status",
                    status: selectedStatus,
                  })
                }
                disabled={loading}
                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold gap-1.5 cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Update Status</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: Bulk Delete --- */}
      {activeModal === "delete" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-destructive/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">
                  Delete {selectedIds.length} resources?
                </h3>
                <p className="text-xs text-muted-foreground">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              All associated monitoring history, tags, and renewal alerts for the{" "}
              <strong className="text-foreground font-semibold">
                {selectedIds.length} selected items
              </strong>{" "}
              will be permanently removed from this workspace.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModal(null)}
                disabled={loading}
                className="rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  executeBulkAction({
                    action: "bulk_delete",
                  })
                }
                disabled={loading}
                className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Permanently</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
