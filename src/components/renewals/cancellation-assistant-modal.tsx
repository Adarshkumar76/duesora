"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  FileText,
  Handshake,
  Copy,
  Check,
  Mail,
  Download,
  AlertTriangle,
  Clock,
  Sparkles,
  Sliders,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  calculateCancellationUrgency,
  generateCancellationNoticeLetter,
  generateRenegotiationProposal,
  generateCancellationMailto,
} from "@/lib/renewals/cancellation-letter";

export interface CancellationAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: {
    id: string;
    name: string;
    provider?: string | null;
    renewalDate?: Date | string | null;
    cancellationNoticeDays?: number | null;
    cancellationDeadline?: Date | string | null;
    amountMinor?: number | null;
    currency?: string | null;
    totalSeats?: number | null;
    assignedSeats?: number | null;
    costPerSeatMinor?: number | null;
  };
  defaultTab?: "cancellation" | "renegotiation";
}

export function CancellationAssistantModal({
  isOpen,
  onClose,
  resource,
  defaultTab = "cancellation",
}: CancellationAssistantModalProps) {
  const [activeTab, setActiveTab] = useState<"cancellation" | "renegotiation">(defaultTab);
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Form custom overrides
  const [vendorName, setVendorName] = useState(resource.provider || resource.name);
  const [accountNumber, setAccountNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [includeDataDeletion, setIncludeDataDeletion] = useState(true);
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [customNegotiationNotes, setCustomNegotiationNotes] = useState("");

  // Urgency calculation
  const urgency = useMemo(() => {
    return calculateCancellationUrgency(
      resource.renewalDate,
      resource.cancellationNoticeDays,
      resource.cancellationDeadline
    );
  }, [resource.renewalDate, resource.cancellationNoticeDays, resource.cancellationDeadline]);

  // Seat optimization telemetry
  const seatOptimization = useMemo(() => {
    if (!resource.totalSeats || resource.totalSeats <= 0) return null;
    const total = resource.totalSeats;
    const assigned = resource.assignedSeats || 0;
    const unassigned = Math.max(0, total - assigned);
    const costPerSeat = resource.costPerSeatMinor || 0;
    const potentialSavings = unassigned * costPerSeat;
    return {
      totalSeats: total,
      assignedSeats: assigned,
      unassignedSeats: unassigned,
      costPerSeatMinor: costPerSeat,
      potentialSavingsMinor: potentialSavings > 0 ? potentialSavings : null,
    };
  }, [resource.totalSeats, resource.assignedSeats, resource.costPerSeatMinor]);

  // Generate Letter or Proposal
  const generatedDoc = useMemo(() => {
    const opts = {
      resourceName: resource.name,
      vendorName,
      accountNumber,
      contactName,
      organizationName,
      renewalDate: resource.renewalDate,
      cancellationDeadline: resource.cancellationDeadline,
      cancellationNoticeDays: resource.cancellationNoticeDays,
      amountMinor: resource.amountMinor,
      currency: resource.currency || "USD",
      reason: cancellationReason,
      includeDataDeletionClause: includeDataDeletion,
      renegotiationDiscountPercent: discountPercent,
      seatOptimization,
      customNotes: customNegotiationNotes,
    };

    if (activeTab === "cancellation") {
      return generateCancellationNoticeLetter(opts);
    } else {
      return generateRenegotiationProposal(opts);
    }
  }, [
    activeTab,
    resource,
    vendorName,
    accountNumber,
    contactName,
    organizationName,
    cancellationReason,
    includeDataDeletion,
    discountPercent,
    seatOptimization,
    customNegotiationNotes,
  ]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      const fullText = `Subject: ${generatedDoc.subject}\n\n${generatedDoc.body}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const fullText = `Subject: ${generatedDoc.subject}\n\n${generatedDoc.body}`;
    const element = document.createElement("a");
    const file = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    const slug = resource.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    element.download = `${activeTab === "cancellation" ? "cancellation-notice" : "renegotiation-proposal"}-${slug}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const mailtoUri = generateCancellationMailto(generatedDoc.subject, generatedDoc.body);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-3xl bg-card border border-border/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
                Renewal Assistant
                <span className="text-xs font-normal text-muted-foreground">({resource.name})</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Generate formal non-renewal notices or renegotiation proposals with seat savings data.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Urgency Alert Banner */}
        {urgency.deadlineDate && (
          <div
            className={`px-5 py-2.5 text-xs flex items-center justify-between border-b ${
              urgency.isExpired
                ? "bg-destructive/10 text-destructive border-destructive/20 font-medium"
                : urgency.isUrgent
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium"
                : "bg-muted/40 text-muted-foreground border-border/60"
            }`}
          >
            <div className="flex items-center gap-2">
              {urgency.isExpired ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 shrink-0" />
              )}
              <span>
                {urgency.isExpired
                  ? `Notice window passed ${Math.abs(urgency.daysUntilDeadline || 0)} days ago. Vendor may enforce auto-renewal terms.`
                  : urgency.isUrgent
                  ? `Action Urgent: Only ${urgency.daysUntilDeadline} days remaining before the ${urgency.noticeDays}-day cancellation notice deadline.`
                  : `Notice window active: ${urgency.daysUntilDeadline} days left before the ${urgency.noticeDays}-day cancellation deadline.`}
              </span>
            </div>
            <span className="font-mono text-[11px] opacity-80" suppressHydrationWarning>
              Deadline: {urgency.deadlineDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center justify-between px-5 pt-3 border-b border-border/50 bg-background">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("cancellation")}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === "cancellation"
                  ? "border-emerald-500 text-foreground font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              Formal Cancellation Notice
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("renegotiation")}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === "renegotiation"
                  ? "border-emerald-500 text-foreground font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Handshake className="w-3.5 h-3.5 text-emerald-500" />
              Renegotiation & Rightsizing
            </button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowOptions(!showOptions)}
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground mb-1 cursor-pointer"
          >
            <Sliders className="w-3 h-3" />
            <span>{showOptions ? "Hide Customization" : "Customize Letter"}</span>
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Customization Drawer */}
          {showOptions && (
            <div className="p-4 rounded-2xl border border-border/70 bg-muted/20 space-y-3.5 animate-in fade-in-0 duration-150">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                Customize Parameters & Telemetry
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Vendor Name</label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Datadog, Slack, Figma"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Account / Contract ID</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. ACC-982103"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Authorized Contact</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Your Name (e.g. Jane Doe, VP Eng)"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Organization Name</label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. Pied Piper Inc."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs"
                  />
                </div>
              </div>

              {activeTab === "cancellation" ? (
                <div className="space-y-2 pt-1 border-t border-border/50">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Cancellation Reason (Optional)</label>
                    <input
                      type="text"
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="e.g. Project discontinued / migrating to consolidated platform"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-foreground">
                    <input
                      type="checkbox"
                      checked={includeDataDeletion}
                      onChange={(e) => setIncludeDataDeletion(e.target.checked)}
                      className="rounded border-input text-emerald-600 focus:ring-emerald-500"
                    />
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Include GDPR / CCPA data deletion & backup purge clause</span>
                  </label>
                </div>
              ) : (
                <div className="space-y-2 pt-1 border-t border-border/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Requested Discount (%)</label>
                      <input
                        type="number"
                        min="5"
                        max="70"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Additional Terms</label>
                      <input
                        type="text"
                        value={customNegotiationNotes}
                        onChange={(e) => setCustomNegotiationNotes(e.target.value)}
                        placeholder="e.g. Request 60-day Net payment terms"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Letter / Proposal Monospace Display */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span className="font-semibold text-foreground">Generated Document</span>
              <span className="font-mono text-[11px]">RFC 2822 / Markdown Compatible</span>
            </div>

            <div className="p-4 rounded-2xl border border-border/80 bg-muted/30 font-mono text-xs text-foreground space-y-3 leading-relaxed select-text overflow-x-auto">
              <div className="pb-2 border-b border-border/60">
                <span className="text-muted-foreground font-semibold">Subject: </span>
                <span className="text-foreground">{generatedDoc.subject}</span>
              </div>
              <pre className="whitespace-pre-wrap font-mono text-xs">{generatedDoc.body}</pre>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/60 bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs rounded-xl"
          >
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 text-xs gap-1.5 rounded-xl cursor-pointer"
              title="Download text file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .txt</span>
            </Button>

            <a href={mailtoUri} target="_blank" rel="noopener noreferrer">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 rounded-xl text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                title="Open directly in default email client"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Open in Email</span>
              </Button>
            </a>

            <Button
              type="button"
              size="sm"
              onClick={handleCopy}
              className="h-8 text-xs gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy to Clipboard"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
