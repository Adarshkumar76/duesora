"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2 } from "lucide-react";

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
  const [provider, setProvider] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("14.99");
  const [currency, setCurrency] = useState("USD");
  const [billingCycle, setBillingCycle] = useState("yearly");
  const [renewalDate, setRenewalDate] = useState("2025-05-20");
  const [autoRenew, setAutoRenew] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const parsedAmount = parseFloat(amount);
      const amountMinor = !isNaN(parsedAmount) ? Math.round(parsedAmount * 100) : null;

      const payload = {
        name,
        type,
        provider: provider || null,
        description: description || null,
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
            <CardTitle className="text-base font-bold text-foreground">
              Resource Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resource Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Resource Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. duesora.com or AWS Production"
                className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
            </div>

            {/* Resource Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-foreground cursor-pointer"
              >
                <option value="domain">Domain</option>
                <option value="subscription">Subscription</option>
                <option value="ssl_certificate">SSL Certificate</option>
                <option value="hosting">Hosting</option>
                <option value="cloud_service">Cloud Service</option>
                <option value="software_license">Software License</option>
                <option value="custom">Other</option>
              </select>
            </div>

            {/* Provider */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Provider
              </label>
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. GoDaddy, AWS, Stripe"
                className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add internal notes, purpose or owner details..."
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
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
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
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Next Renewal Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-foreground"
                />
              </div>
            </div>

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
