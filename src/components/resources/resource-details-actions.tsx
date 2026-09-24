"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { TagInput } from "@/components/tags/tag-input";
import { getResourceTypeConfig } from "@/lib/resources/form-config";

function calculatePresetDate(offsetType: "today" | "1m" | "3m" | "6m" | "1y" | "2y"): string {
  const d = new Date();
  if (offsetType === "1m") d.setMonth(d.getMonth() + 1);
  else if (offsetType === "3m") d.setMonth(d.getMonth() + 3);
  else if (offsetType === "6m") d.setMonth(d.getMonth() + 6);
  else if (offsetType === "1y") d.setFullYear(d.getFullYear() + 1);
  else if (offsetType === "2y") d.setFullYear(d.getFullYear() + 2);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRelativeDateLabel(dateStr: string): { text: string; isPast: boolean; isToday: boolean } {
  if (!dateStr) return { text: "No renewal date selected", isPast: false, isToday: false };
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return { text: dateStr, isPast: false, isToday: false };
  const [y, m, d] = parts;
  const target = new Date(y, m - 1, d);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetMidnight = new Date(y, m - 1, d);
  targetMidnight.setHours(0, 0, 0, 0);

  const diffTime = targetMidnight.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formattedDate = `${DAYS[target.getDay()]}, ${MONTHS[target.getMonth()]} ${target.getDate()}, ${target.getFullYear()}`;

  if (diffDays === 0) {
    return { text: `Renews today (${formattedDate})`, isPast: false, isToday: true };
  } else if (diffDays === 1) {
    return { text: `Renews tomorrow (${formattedDate})`, isPast: false, isToday: false };
  } else if (diffDays > 1) {
    return { text: `Renews in ${diffDays} days (${formattedDate})`, isPast: false, isToday: false };
  } else if (diffDays === -1) {
    return { text: `Expired yesterday (${formattedDate})`, isPast: true, isToday: false };
  } else {
    return { text: `Expired ${Math.abs(diffDays)} days ago (${formattedDate})`, isPast: true, isToday: false };
  }
}

interface WorkspaceMember {
  id: string;
  name: string | null;
  email: string;
}

interface ResourceData {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  status: string;
  category?: string | null;
  ownerId?: string | null;
  description: string | null;
  provider: string | null;
  websiteUrl: string | null;
  amountMinor: number | null;
  currency: string;
  billingCycle: string;
  renewalDate: Date | string | null;
  autoRenew: boolean;
  owner?: { id: string; name: string | null; email: string } | null;
  tags?: Array<{ id: string; name: string; colorToken: string }>;
}

interface ResourceDetailsActionsProps {
  resource: ResourceData;
  workspaceId: string;
  canManage?: boolean;
}

export function ResourceDetailsActions({
  resource,
  workspaceId,
  canManage = true,
}: ResourceDetailsActionsProps) {
  const router = useRouter();

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Form states for edit
  const [name, setName] = useState(resource.name);
  const [type, setType] = useState(resource.type);
  const [category, setCategory] = useState(resource.category || "");
  const [ownerId, setOwnerId] = useState<string>(resource.ownerId || "");
  const [tags, setTags] = useState<string[]>(
    resource.tags?.map((t) => t.name) || []
  );
  const [provider, setProvider] = useState(resource.provider || "");
  const [websiteUrl, setWebsiteUrl] = useState(resource.websiteUrl || "");
  const [amount, setAmount] = useState(
    resource.amountMinor !== null ? (resource.amountMinor / 100).toString() : ""
  );
  const [currency, setCurrency] = useState(resource.currency || "USD");
  const [billingCycle, setBillingCycle] = useState(resource.billingCycle || "yearly");
  const [status, setStatus] = useState(resource.status || "active");
  const [renewalDate, setRenewalDate] = useState(
    resource.renewalDate
      ? new Date(resource.renewalDate).toISOString().split("T")[0]
      : ""
  );
  const [autoRenew, setAutoRenew] = useState(resource.autoRenew ?? true);
  const [description, setDescription] = useState(resource.description || "");
  const [changeReason, setChangeReason] = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);
  const config = getResourceTypeConfig(type);

  // Members
  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  useEffect(() => {
    if (!workspaceId) return;
    fetch(`/api/workspaces/${workspaceId}/members`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          const list = Array.isArray(json.data)
            ? json.data
            : Array.isArray(json.data.members)
            ? json.data.members
            : [];
          setMembers(list);
        }
      })
      .catch(() => {});
  }, [workspaceId]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currencySymbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
    EUR: "€",
    GBP: "£",
  };
  const activeCurrencySymbol = currencySymbols[currency] || "$";

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const parsedAmountMinor =
        amount.trim() !== "" ? Math.round(parseFloat(amount) * 100) : null;

      const payload = {
        name,
        type,
        category: category.trim() || null,
        ownerId: ownerId || null,
        tags,
        provider: provider.trim() || null,
        websiteUrl: websiteUrl.trim() || null,
        amountMinor: parsedAmountMinor,
        currency,
        billingCycle,
        status,
        renewalDate: renewalDate ? new Date(renewalDate).toISOString() : null,
        autoRenew,
        description: description.trim() || null,
        changeReason: changeReason.trim() || undefined,
      };

      const res = await fetch(
        `/api/workspaces/${workspaceId}/resources/${resource.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to update resource");
      }

      setEditModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/resources/${resource.id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to delete resource");
      }

      router.push("/resources");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete resource");
      setIsDeleting(false);
    }
  };

  if (!canManage) {
    return null;
  }

  return (
    <>
      {/* Top Action Buttons matching 07_resource_details_page.jpg */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditModalOpen(true)}
          className="rounded-xl border-border/80 shadow-2xs gap-1.5 text-xs font-semibold hover:bg-muted/70 cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Edit</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setDeleteModalOpen(true)}
          className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/60 shadow-2xs gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
          <span>Delete</span>
        </Button>
      </div>

      {/* Edit Resource Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div className="relative w-full max-w-2xl bg-card border border-border/80 rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-foreground">Edit Resource</h3>
                <p className="text-xs text-muted-foreground">
                  Update renewal terms, pricing, or provider details for {resource.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Resource Type */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Resource Type
                    </label>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {config.typeLabel}
                    </span>
                  </div>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer font-medium"
                  >
                    <option value="domain">Domain (DNS, SSL, Registrar)</option>
                    <option value="subscription">Subscription (SaaS, Services)</option>
                    <option value="ssl_certificate">SSL Certificate (TLS/HTTPS)</option>
                    <option value="hosting">Hosting (Servers, VPS)</option>
                    <option value="cloud_service">Cloud Service (AWS, GCP, Azure)</option>
                    <option value="software_license">Software License</option>
                    <option value="custom">Other / Custom</option>
                  </select>
                </div>

                {/* Resource Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {config.nameLabel} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={config.namePlaceholder}
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  {config.nameHelp && (
                    <p className="text-[11px] text-muted-foreground">{config.nameHelp}</p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder={config.categoryPlaceholder}
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                {/* Owner / Assigned To */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Assigned Owner
                  </label>
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {(Array.isArray(members) ? members : []).map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name || member.email} ({member.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Provider */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {config.providerLabel}
                  </label>
                  <input
                    type="text"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder={config.providerPlaceholder}
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">
                    Tags
                  </label>
                  <TagInput
                    workspaceId={workspaceId}
                    value={tags}
                    onChange={setTags}
                    placeholder="Add tags like #prod, #core..."
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {config.costLabel || "Amount"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      {activeCurrencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="12.99"
                      className="w-full pl-8 pr-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="USD">USD - $</option>
                    <option value="INR">INR - ₹</option>
                    <option value="EUR">EUR - €</option>
                    <option value="GBP">GBP - £</option>
                  </select>
                </div>

                {/* Billing Cycle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Billing Cycle
                  </label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="yearly">Yearly / Annual</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="one_time">One-time</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>

                {/* Price Revision / Rate Shift Reason */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">
                    Adjustment Reason <span className="text-muted-foreground font-normal">(Optional — recorded in cost history)</span>
                  </label>
                  <input
                    type="text"
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    placeholder="e.g. Annual renewal increase, Tier upgrade, Plan indexation"
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  />
                </div>

                {/* Next Renewal Date */}
                {(() => {
                  const dateStatus = getRelativeDateLabel(renewalDate);
                  return (
                    <div className="space-y-2 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground">
                          Next Renewal Date
                        </label>
                        {renewalDate && (
                          <span
                            suppressHydrationWarning
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              dateStatus.isPast
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                : dateStatus.isToday
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {dateStatus.text}
                          </span>
                        )}
                      </div>
                      <div className="relative flex items-center">
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              dateInputRef.current?.showPicker();
                            } catch {
                              dateInputRef.current?.focus();
                            }
                          }}
                          className="absolute left-3 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded cursor-pointer z-10"
                          title="Open Calendar Picker"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        <input
                          ref={dateInputRef}
                          type="date"
                          value={renewalDate}
                          onChange={(e) => setRenewalDate(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium text-foreground cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                        />
                      </div>

                      {/* Quick Preset Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[11px] text-muted-foreground mr-1 font-medium">Quick set:</span>
                        <button
                          type="button"
                          onClick={() => setRenewalDate(calculatePresetDate("today"))}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                            renewalDate === calculatePresetDate("today")
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                              : "border-border/60 hover:border-border hover:bg-accent/40 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenewalDate(calculatePresetDate("1m"))}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                            renewalDate === calculatePresetDate("1m")
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                              : "border-border/60 hover:border-border hover:bg-accent/40 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          +1 Month
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenewalDate(calculatePresetDate("3m"))}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                            renewalDate === calculatePresetDate("3m")
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                              : "border-border/60 hover:border-border hover:bg-accent/40 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          +3 Months
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenewalDate(calculatePresetDate("1y"))}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                            renewalDate === calculatePresetDate("1y")
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                              : "border-border/60 hover:border-border hover:bg-accent/40 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          +1 Year
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenewalDate(calculatePresetDate("2y"))}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                            renewalDate === calculatePresetDate("2y")
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                              : "border-border/60 hover:border-border hover:bg-accent/40 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          +2 Years
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Website URL / Target Hostname */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    {config.urlLabel}
                  </label>
                  {config.urlRequiredForHealthChecks && (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Health Check Target
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder={config.urlPlaceholder}
                  className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <p className="text-[11px] text-muted-foreground">
                    {config.urlHelper}
                  </p>
                  {name.trim() && websiteUrl !== name.trim() && (
                    <button
                      type="button"
                      onClick={() => setWebsiteUrl(name.trim())}
                      className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 cursor-pointer"
                    >
                      Use &quot;{name.trim()}&quot;
                    </button>
                  )}
                </div>
              </div>

              {/* Auto Renew Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoRenewEdit"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-border text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="autoRenewEdit" className="text-xs font-medium text-foreground cursor-pointer">
                  Auto-renew enabled for this asset
                </label>
              </div>

              {/* Description / Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Notes / Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add internal notes, purpose or owner details..."
                  className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div className="relative w-full max-w-md bg-card border border-border/80 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-foreground">
                Delete &ldquo;{resource.name}&rdquo;?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to permanently delete this resource from your workspace? This action cannot be undone and will remove all scheduled renewal notifications.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="rounded-xl text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Permanently</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
