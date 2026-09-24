"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Ban,
  Handshake,
  Clock,
  Calendar,
  User,
  Edit3,
  Loader2,
  FileText,
  BellRing,
} from "lucide-react";
import { type RenewalDecision } from "@/lib/renewals/types";

interface RenewalDecisionCardProps {
  resourceId: string;
  workspaceId: string;
  initialDecision?: RenewalDecision | string | null;
  initialNotes?: string | null;
  initialNoticeDays?: number | null;
  initialDeadline?: Date | string | null;
  decidedByName?: string | null;
  decidedAt?: Date | string | null;
  renewalDate?: Date | string | null;
  userRole?: string;
}

export function RenewalDecisionCard({
  resourceId,
  workspaceId,
  initialDecision = "none",
  initialNotes = null,
  initialNoticeDays = null,
  initialDeadline = null,
  decidedByName = null,
  decidedAt = null,
  renewalDate = null,
  userRole,
}: RenewalDecisionCardProps) {
  const [decision, setDecision] = useState<RenewalDecision>(
    (initialDecision as RenewalDecision) || "none"
  );
  const [notes, setNotes] = useState<string>(initialNotes || "");
  const [noticeDays, setNoticeDays] = useState<string>(
    initialNoticeDays !== null && initialNoticeDays !== undefined ? String(initialNoticeDays) : ""
  );
  const [deadline, setDeadline] = useState<Date | null>(
    initialDeadline ? new Date(initialDeadline) : null
  );
  const [decidedUser, setDecidedUser] = useState<string | null>(decidedByName);
  const [decidedTime, setDecidedTime] = useState<Date | null>(
    decidedAt ? new Date(decidedAt) : null
  );

  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canEdit = userRole === "owner" || userRole === "admin" || userRole === "member";

  // Form temporary editing state
  const [formDecision, setFormDecision] = useState<RenewalDecision>(decision);
  const [formNotes, setFormNotes] = useState<string>(notes);
  const [formNoticeDays, setFormNoticeDays] = useState<string>(noticeDays);

  const startEditing = () => {
    setFormDecision(decision);
    setFormNotes(notes);
    setFormNoticeDays(noticeDays);
    setError(null);
    setSuccess(false);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const parsedNoticeDays = formNoticeDays.trim() !== "" ? parseInt(formNoticeDays, 10) : null;
      if (parsedNoticeDays !== null && (isNaN(parsedNoticeDays) || parsedNoticeDays < 0 || parsedNoticeDays > 365)) {
        throw new Error("Notice days must be an integer between 0 and 365.");
      }

      const res = await fetch(
        `/api/workspaces/${workspaceId}/resources/${resourceId}/renewal-decision`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision: formDecision,
            notes: formNotes.trim() || null,
            cancellationNoticeDays: parsedNoticeDays,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to save renewal decision");
      }

      const updated = json.data?.resource;
      setDecision(updated?.renewalDecision || formDecision);
      setNotes(updated?.decisionNotes || "");
      setNoticeDays(
        updated?.cancellationNoticeDays !== null && updated?.cancellationNoticeDays !== undefined
          ? String(updated.cancellationNoticeDays)
          : ""
      );
      setDeadline(updated?.cancellationDeadline ? new Date(updated.cancellationDeadline) : null);
      setDecidedTime(new Date());
      setDecidedUser("You");
      setSuccess(true);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving renewal decision");
    } finally {
      setSubmitting(false);
    }
  };

  // Badge rendering helper
  const renderDecisionBadge = (d: RenewalDecision) => {
    switch (d) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved to Renew
          </span>
        );
      case "cancel":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
            <Ban className="w-3.5 h-3.5" />
            Marked to Cancel
          </span>
        );
      case "needs_review":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            Needs Review
          </span>
        );
      case "negotiate":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Handshake className="w-3.5 h-3.5" />
            In Negotiation
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border/60">
            <Clock className="w-3.5 h-3.5" />
            Unreviewed
          </span>
        );
    }
  };

  // Cancellation notice calculation
  const now = new Date();
  let noticeDaysDiff: number | null = null;
  if (deadline) {
    noticeDaysDiff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Renewal Governance & Decision</span>
          </CardTitle>

          {canEdit && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={startEditing}
              className="h-8 gap-1.5 text-xs rounded-xl border-border"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Update Decision</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Success or Error alert */}
        {success && (
          <div className="p-3 rounded-xl border text-xs flex items-center gap-2 bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Renewal decision updated successfully.</span>
          </div>
        )}
        {error && (
          <div className="p-3 rounded-xl border text-xs flex items-center gap-2 bg-destructive/10 border-destructive/20 text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Read View */}
        {!isEditing ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/60 bg-muted/20">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium">Current Status</span>
                <div className="pt-0.5">{renderDecisionBadge(decision)}</div>
              </div>

              {decidedTime && (
                <div className="text-left sm:text-right space-y-0.5">
                  <span className="text-[11px] text-muted-foreground flex items-center sm:justify-end gap-1" suppressHydrationWarning>
                    <User className="w-3 h-3" />
                    <span>Decided by: <strong>{decidedUser || "Team Member"}</strong></span>
                  </span>
                  <span className="text-[11px] text-muted-foreground block" suppressHydrationWarning>
                    {decidedTime.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Cancellation Notice Deadline Window */}
            {(noticeDays || deadline) && (
              <div className="p-3.5 rounded-xl border border-border/60 bg-muted/15 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <BellRing className="w-3.5 h-3.5 text-amber-500" />
                    <span>Cancellation Notice Window</span>
                  </div>
                  {noticeDaysDiff !== null && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-medium border ${
                        noticeDaysDiff < 0
                          ? "bg-destructive/10 border-destructive/20 text-destructive"
                          : noticeDaysDiff <= 7
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                          : "bg-muted border-border/60 text-muted-foreground"
                      }`}
                    >
                      {noticeDaysDiff < 0
                        ? `Notice Window Expired (${Math.abs(noticeDaysDiff)}d ago)`
                        : noticeDaysDiff === 0
                        ? "Notice Due Today!"
                        : `Notice Due in ${noticeDaysDiff}d`}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-muted-foreground">
                  <div>
                    <span>Required Notice: </span>
                    <strong className="text-foreground">{noticeDays ? `${noticeDays} days prior` : "Custom"}</strong>
                  </div>
                  {deadline && (
                    <div suppressHydrationWarning>
                      <span>Notice Deadline: </span>
                      <strong className="text-foreground font-mono" suppressHydrationWarning>
                        {deadline.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Decision Notes */}
            {notes && (
              <div className="p-3.5 rounded-xl border border-border/60 bg-muted/15 space-y-1">
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Decision Notes & Reasoning
                </span>
                <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{notes}</p>
              </div>
            )}

            {!notes && !noticeDays && !deadline && decision === "none" && (
              <p className="text-xs text-muted-foreground italic">
                No formal renewal governance decision recorded. Click "Update Decision" to review, approve, or mark to cancel.
              </p>
            )}
          </div>
        ) : (
          /* Edit Form */
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Renewal Decision</label>
              <select
                value={formDecision}
                onChange={(e) => setFormDecision(e.target.value as RenewalDecision)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="none">Unreviewed (Default)</option>
                <option value="needs_review">Needs Review (Flag for team discussion)</option>
                <option value="approved">Approved to Renew (Sign-off on next cycle)</option>
                <option value="cancel">Marked to Cancel (Do not renew / stop charges)</option>
                <option value="negotiate">In Negotiation (Request vendor discount or tier change)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Cancellation Notice (Days Prior)
                </label>
                {renewalDate && (
                  <span className="text-[11px] text-muted-foreground" suppressHydrationWarning>
                    Renewal: {new Date(renewalDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <input
                type="number"
                min="0"
                max="365"
                placeholder="e.g. 30 (contract requires 30 days notice)"
                value={formNoticeDays}
                onChange={(e) => setFormNoticeDays(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="text-[11px] text-muted-foreground">
                Duesora automatically computes the cancellation cutoff date from the upcoming renewal date.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Decision Notes & Rationale</label>
              <textarea
                rows={3}
                maxLength={1000}
                placeholder="e.g. Approved for 15 seats. Downsizing next quarter, contract negotiated with rep."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={submitting}
                className="h-8 text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="h-8 gap-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {submitting ? "Saving..." : "Save Decision"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
