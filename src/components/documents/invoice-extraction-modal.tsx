"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Check,
  AlertTriangle,
  ArrowRight,
  Loader2,
  X,
  FileText,
  DollarSign,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExtractedInvoiceMetadata } from "@/lib/invoices/extractor";

interface InvoiceExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  resourceId: string;
  resourceName: string;
  extractedMetadata: ExtractedInvoiceMetadata | null;
  documentName?: string;
  onApplied: () => void;
}

export function InvoiceExtractionModal({
  isOpen,
  onClose,
  workspaceId,
  resourceId,
  resourceName,
  extractedMetadata,
  documentName,
  onApplied,
}: InvoiceExtractionModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("USD");
  const [billingCycle, setBillingCycle] = useState<string>("monthly");
  const [renewalDate, setRenewalDate] = useState<string>("");
  const [vendorName, setVendorName] = useState<string>("");
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (extractedMetadata) {
      if (extractedMetadata.amountMinor !== null) {
        setAmount((extractedMetadata.amountMinor / 100).toFixed(2));
      }
      if (extractedMetadata.currency) {
        setCurrency(extractedMetadata.currency);
      }
      if (extractedMetadata.billingCycle) {
        setBillingCycle(extractedMetadata.billingCycle);
      }
      if (extractedMetadata.renewalDate) {
        setRenewalDate(extractedMetadata.renewalDate);
      }
      if (extractedMetadata.vendorName) {
        setVendorName(extractedMetadata.vendorName);
      }
      setError(null);
      setSuccess(false);
    }
  }, [extractedMetadata]);

  if (!isOpen || !extractedMetadata) return null;

  async function handleApply() {
    setIsApplying(true);
    setError(null);

    try {
      const parsedAmount = parseFloat(amount);
      const amountMinor = !isNaN(parsedAmount) && parsedAmount >= 0 ? Math.round(parsedAmount * 100) : undefined;

      const res = await fetch(
        `/api/workspaces/${workspaceId}/resources/${resourceId}/documents/apply-extraction`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amountMinor,
            currency,
            billingCycle,
            renewalDate: renewalDate || undefined,
            vendorName: vendorName || undefined,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to update resource with extracted data");
      }

      setSuccess(true);
      setTimeout(() => {
        onApplied();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsApplying(false);
    }
  }

  function renderConfidenceBadge(level: "high" | "medium" | "low") {
    switch (level) {
      case "high":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Check className="w-3 h-3" /> High Confidence
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            Medium Confidence
          </span>
        );
      case "low":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-3 h-3" /> Needs Review
          </span>
        );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Extracted Invoice Metadata
              </h3>
              <p className="text-xs text-muted-foreground">
                Review and confirm details extracted from{" "}
                <span className="font-semibold text-foreground">{documentName || "uploaded file"}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Subscription details updated successfully!</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                  Amount
                </label>
                {renderConfidenceBadge(extractedMetadata.confidence.amount)}
              </div>
              <div className="flex rounded-xl border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/20">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-2.5 py-2 text-xs font-semibold bg-muted/40 border-r border-input text-foreground outline-hidden"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm text-foreground bg-transparent outline-hidden"
                />
              </div>
            </div>

            {/* Billing Cycle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                  Billing Cycle
                </label>
                {renderConfidenceBadge(extractedMetadata.confidence.billingCycle)}
              </div>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                className="w-full px-3 py-2 text-sm font-medium rounded-xl border border-input bg-background text-foreground outline-hidden focus:ring-2 focus:ring-primary/20"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly / Annual</option>
              </select>
            </div>

            {/* Next Renewal Date */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  Renewal / Due Date
                </label>
                {renderConfidenceBadge(extractedMetadata.confidence.date)}
              </div>
              <input
                type="date"
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-medium rounded-xl border border-input bg-background text-foreground outline-hidden focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Vendor / Seller */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  Detected Vendor
                </label>
                {renderConfidenceBadge(extractedMetadata.confidence.vendor)}
              </div>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Vendor Name"
                className="w-full px-3 py-2 text-sm font-medium rounded-xl border border-input bg-background text-foreground outline-hidden focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Target Resource Reminder */}
          <div className="p-3.5 bg-muted/40 rounded-xl border border-border/60 text-xs text-muted-foreground flex items-center justify-between">
            <div>
              <span>Target Resource: </span>
              <span className="font-semibold text-foreground">{resourceName}</span>
            </div>
            {extractedMetadata.invoiceNumber && (
              <span className="font-mono text-[11px] text-muted-foreground">
                Invoice #{extractedMetadata.invoiceNumber}
              </span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={onClose} disabled={isApplying}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isApplying || success}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Applying...
              </>
            ) : success ? (
              <>
                <Check className="w-4 h-4" />
                Applied!
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                Apply to Subscription
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
