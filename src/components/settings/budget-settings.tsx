"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Coins,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BellRing,
} from "lucide-react";
import type { WorkspaceBudget, WorkspaceBudgetStatus } from "@/lib/budgets/types";
import { CURRENCY_SYMBOLS } from "@/lib/currency/rates";

interface BudgetSettingsProps {
  workspaceId: string;
  initialBudget: WorkspaceBudget | null;
  initialStatus: WorkspaceBudgetStatus | null;
  currentUserRole: string;
  defaultCurrency: string;
}

export function BudgetSettings({
  workspaceId,
  initialBudget,
  initialStatus,
  currentUserRole,
  defaultCurrency,
}: BudgetSettingsProps) {
  const router = useRouter();
  const canEdit = currentUserRole === "owner" || currentUserRole === "admin";

  const currentCurrency = initialBudget?.currency || defaultCurrency || "USD";
  const currencySymbol = CURRENCY_SYMBOLS[currentCurrency] || "$";

  // Form states (expressed in major units for the user, e.g. 1000 for $1000)
  const initialMonthly = initialBudget?.monthlyBudgetMinor
    ? (initialBudget.monthlyBudgetMinor / 100).toString()
    : "";
  const initialAnnual = initialBudget?.annualBudgetMinor
    ? (initialBudget.annualBudgetMinor / 100).toString()
    : "";

  const [monthlyBudget, setMonthlyBudget] = useState(initialMonthly);
  const [annualBudget, setAnnualBudget] = useState(initialAnnual);
  const [currency, setCurrency] = useState(currentCurrency);
  const [thresholdPct, setThresholdPct] = useState(
    initialBudget?.alertThresholdPct ?? 80
  );
  const [alertEmails, setAlertEmails] = useState(
    initialBudget?.alertEmailsEnabled ?? true
  );

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const parsedMonthly =
        monthlyBudget.trim() === ""
          ? null
          : Math.round(parseFloat(monthlyBudget) * 100);
      const parsedAnnual =
        annualBudget.trim() === ""
          ? null
          : Math.round(parseFloat(annualBudget) * 100);

      if (parsedMonthly !== null && isNaN(parsedMonthly)) {
        throw new Error("Please enter a valid monthly budget amount.");
      }
      if (parsedAnnual !== null && isNaN(parsedAnnual)) {
        throw new Error("Please enter a valid annual budget amount.");
      }

      const res = await fetch(`/api/workspaces/${workspaceId}/budgets`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyBudgetMinor: parsedMonthly,
          annualBudgetMinor: parsedAnnual,
          currency,
          alertThresholdPct: Number(thresholdPct),
          alertEmailsEnabled: alertEmails,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to update budget settings");
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const monthlyStatus = initialStatus?.monthly;
  const annualStatus = initialStatus?.annual;

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Workspace Budget & Spend Warnings</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set spending ceilings, monitor burn velocity, and configure proactive threshold breach alerts.
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Live Velocity Overview */}
        {initialStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monthly Burn Gauge */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Monthly Burn Rate
                </span>
                {monthlyStatus?.isExceeded ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/50">
                    <AlertTriangle className="w-3 h-3" /> Exceeded (
                    {monthlyStatus.burnPercentage}%)
                  </span>
                ) : monthlyStatus?.isWarning ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/50">
                    <AlertTriangle className="w-3 h-3" /> Warning (
                    {monthlyStatus.burnPercentage}%)
                  </span>
                ) : monthlyStatus?.burnPercentage !== null ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/50">
                    <CheckCircle2 className="w-3 h-3" /> Healthy (
                    {monthlyStatus?.burnPercentage}%)
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">No cap set</span>
                )}
              </div>

              <div className="flex items-baseline justify-between text-sm">
                <div>
                  <span className="text-xl font-bold text-foreground">
                    {currencySymbol}
                    {((monthlyStatus?.spendMinor || 0) / 100).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">/ month</span>
                </div>
                {monthlyStatus?.budgetMinor ? (
                  <span className="text-xs text-muted-foreground">
                    Cap: {currencySymbol}
                    {(monthlyStatus.budgetMinor / 100).toLocaleString()}
                  </span>
                ) : null}
              </div>

              {/* Progress Bar */}
              {monthlyStatus?.budgetMinor ? (
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      monthlyStatus.isExceeded
                        ? "bg-rose-500"
                        : monthlyStatus.isWarning
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${Math.min(100, monthlyStatus.burnPercentage || 0)}%`,
                    }}
                  />
                </div>
              ) : null}
            </div>

            {/* Annual Burn Gauge */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Annual Run-Rate (ARR)
                </span>
                {annualStatus?.isExceeded ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/50">
                    <AlertTriangle className="w-3 h-3" /> Exceeded (
                    {annualStatus.burnPercentage}%)
                  </span>
                ) : annualStatus?.isWarning ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/50">
                    <AlertTriangle className="w-3 h-3" /> Warning (
                    {annualStatus.burnPercentage}%)
                  </span>
                ) : annualStatus?.burnPercentage !== null ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/50">
                    <CheckCircle2 className="w-3 h-3" /> Healthy (
                    {annualStatus?.burnPercentage}%)
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">No cap set</span>
                )}
              </div>

              <div className="flex items-baseline justify-between text-sm">
                <div>
                  <span className="text-xl font-bold text-foreground">
                    {currencySymbol}
                    {((annualStatus?.spendMinor || 0) / 100).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">/ year</span>
                </div>
                {annualStatus?.budgetMinor ? (
                  <span className="text-xs text-muted-foreground">
                    Cap: {currencySymbol}
                    {(annualStatus.budgetMinor / 100).toLocaleString()}
                  </span>
                ) : null}
              </div>

              {/* Progress Bar */}
              {annualStatus?.budgetMinor ? (
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      annualStatus.isExceeded
                        ? "bg-rose-500"
                        : annualStatus.isWarning
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${Math.min(100, annualStatus.burnPercentage || 0)}%`,
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Configuration Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monthly Budget Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Monthly Spending Ceiling ({currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 500.00 (leave blank for none)"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  disabled={!canEdit || loading}
                  className="w-full pl-8 pr-3 py-2 bg-background border border-border/80 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Annual Budget Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Annual Spending Ceiling ({currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 6000.00 (leave blank for none)"
                  value={annualBudget}
                  onChange={(e) => setAnnualBudget(e.target.value)}
                  disabled={!canEdit || loading}
                  className="w-full pl-8 pr-3 py-2 bg-background border border-border/80 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Currency Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Budget Currency
              </label>
              <div className="relative">
                <Coins className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={!canEdit || loading}
                  className="w-full pl-9 pr-3 py-2 bg-background border border-border/80 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50"
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="INR">INR (₹) - Indian Rupee</option>
                </select>
              </div>
            </div>

            {/* Alert Threshold Slider / Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">
                  Warning Alert Threshold
                </label>
                <span className="text-xs font-bold text-foreground">
                  {thresholdPct}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={thresholdPct}
                  onChange={(e) => setThresholdPct(Number(e.target.value))}
                  disabled={!canEdit || loading}
                  className="w-full accent-emerald-600 h-2 bg-muted rounded-lg cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Trigger visual warnings when spend exceeds {thresholdPct}% of budget.
              </p>
            </div>
          </div>

          {/* Alert Emails Toggle */}
          <div className="pt-2 flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <BellRing className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-foreground">
                  Threshold Warning Notifications
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Send high-priority alerts to workspace Admins when spend approaches or exceeds limits.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={alertEmails}
              onChange={(e) => setAlertEmails(e.target.checked)}
              disabled={!canEdit || loading}
              className="w-4 h-4 rounded-sm border-border text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Feedback & Actions */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Budget preferences saved successfully!</span>
            </div>
          )}

          {canEdit && (
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Budget Settings</span>
                )}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
