"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, Globe, Shield, CreditCard, Server, Cloud, KeyRound, HelpCircle, Check } from "lucide-react";
import { TagInput } from "@/components/tags/tag-input";
import { getResourceTypeConfig } from "@/lib/resources/form-config";

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

interface ResourceFormProps {
  workspaceId: string;
}

export function ResourceForm({ workspaceId }: ResourceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [type, setType] = useState("domain");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isUrlCustomized, setIsUrlCustomized] = useState(false);
  const [category, setCategory] = useState("");
  const [ownerId, setOwnerId] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [provider, setProvider] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("14.99");
  const [currency, setCurrency] = useState("USD");
  const [billingCycle, setBillingCycle] = useState("yearly");
  const [renewalDate, setRenewalDate] = useState(() => getTodayDateString());
  const [autoRenew, setAutoRenew] = useState(true);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const parsedAmount = parseFloat(amount);
      const amountMinor = !isNaN(parsedAmount) ? Math.round(parsedAmount * 100) : null;

      const payload = {
        name: name.trim(),
        type,
        category: category.trim() || null,
        ownerId: ownerId || null,
        tags,
        provider: provider.trim() || null,
        websiteUrl: websiteUrl.trim() || null,
        description: description.trim() || null,
        amountMinor,
        currency,
        billingCycle,
        renewalDate: renewalDate ? new Date(renewalDate).toISOString() : null,
        autoRenew,
      };

      const res = await fetch(`/api/workspaces/${workspaceId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to create resource");
      }

      router.push("/resources");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  const currencySymbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
    EUR: "€",
    GBP: "£",
  };
  const activeCurrencySymbol = currencySymbols[currency] || "$";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
          {error}
        </div>
      )}

      {/* Two-Column Grid matching mockup 06_add_resource_page.jpg */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Resource Information */}
        <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground">
                Resource Information
              </CardTitle>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {config.typeLabel}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resource Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Resource Type
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setType(newType);
                  const newConfig = getResourceTypeConfig(newType);
                  if (newConfig.isDomainOrCert && !isUrlCustomized && name.trim()) {
                    setWebsiteUrl(name.trim());
                  }
                }}
                className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-foreground cursor-pointer font-medium"
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  {config.nameLabel} <span className="text-rose-500">*</span>
                </label>
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setName(newName);
                  if (config.isDomainOrCert && !isUrlCustomized) {
                    setWebsiteUrl(newName.trim());
                  }
                }}
                placeholder={config.namePlaceholder}
                className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
              {config.nameHelp && (
                <p className="text-[11px] text-muted-foreground">{config.nameHelp}</p>
              )}
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
                onChange={(e) => {
                  setIsUrlCustomized(true);
                  setWebsiteUrl(e.target.value);
                }}
                placeholder={config.urlPlaceholder}
                className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <p className="text-[11px] text-muted-foreground">
                  {config.urlHelper}
                </p>
                {name.trim() && websiteUrl !== name.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setWebsiteUrl(name.trim());
                      setIsUrlCustomized(true);
                    }}
                    className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 cursor-pointer"
                  >
                    Use &quot;{name.trim()}&quot;
                  </button>
                )}
              </div>
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
                className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
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
                className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
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
                className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-foreground cursor-pointer"
              >
                <option value="">Unassigned</option>
                {(Array.isArray(members) ? members : []).map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name || member.email} ({member.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Tags
              </label>
              <TagInput
                workspaceId={workspaceId}
                value={tags}
                onChange={setTags}
                placeholder="Add tags like #prod, #core, #urgent..."
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Description / Notes
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add internal notes, purpose or details..."
                className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Column 2: Pricing & Renewal */}
        <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-foreground">
              Pricing & Renewal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Amount & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    placeholder="14.99"
                    className="w-full pl-8 pr-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-foreground cursor-pointer"
                >
                  <option value="USD">USD - $</option>
                  <option value="INR">INR - ₹</option>
                  <option value="EUR">EUR - €</option>
                  <option value="GBP">GBP - £</option>
                </select>
              </div>
            </div>

            {/* Billing Cycle */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Billing Cycle
              </label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-foreground cursor-pointer"
              >
                <option value="yearly">Yearly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="one_time">One-time</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </div>

            {/* Next Renewal Date */}
            {(() => {
              const dateStatus = getRelativeDateLabel(renewalDate);
              return (
                <div className="space-y-2">
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
                      className="w-full pl-9 pr-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium text-foreground cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
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

            {/* Auto Renew Toggle */}
            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Auto Renew</p>
                <p className="text-xs text-muted-foreground">
                  Automatically renew this service when due
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoRenew}
                onClick={() => setAutoRenew((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoRenew ? "bg-emerald-600" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoRenew ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Actions matching mockup */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href="/resources">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            className="rounded-xl border-border/80 px-6 font-medium text-xs sm:text-sm"
          >
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 font-medium text-xs sm:text-sm shadow-xs"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Resource
        </Button>
      </div>
    </form>
  );
}
