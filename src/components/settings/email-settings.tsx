"use client";

import { useState, useEffect } from "react";
import { Mail, CheckCircle2, AlertTriangle, Send, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmailSettingsProps {
  workspaceId: string;
  userRole?: string;
  currentUserEmail?: string | null;
}

interface EmailStatusData {
  isConfigured: boolean;
  sender: string;
  host: string | null;
  recipientEmail: string | null;
  mode: "smtp" | "simulated";
}

export function EmailSettings({
  workspaceId,
  userRole,
  currentUserEmail,
}: EmailSettingsProps) {
  const [statusData, setStatusData] = useState<EmailStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const canSend = userRole === "owner" || userRole === "admin" || userRole === "member";

  useEffect(() => {
    let mounted = true;
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/notifications/test-email`);
        if (res.ok) {
          const json = await res.json();
          if (mounted && json.data) {
            setStatusData(json.data);
          }
        }
      } catch {
        // Fallback defaults
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchStatus();
    return () => {
      mounted = false;
    };
  }, [workspaceId]);

  async function handleSendTest() {
    setSending(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/notifications/test-email`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to dispatch test email");
      }

      const isSimulated = json.data?.simulated;
      const recipient = json.data?.recipient || currentUserEmail;

      setFeedback({
        type: "success",
        message: isSimulated
          ? `Test alert generated for ${recipient} (Simulated mode: logged to server console).`
          : `Live test alert successfully delivered via SMTP to ${recipient}.`,
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error sending test alert",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-[8px] border border-border bg-card p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[6px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Email Alert Delivery</h2>
            <p className="text-xs text-muted-foreground">
              Automated renewal notifications, monitor health warnings, and budget alerts
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {!loading && (
          <div className="flex items-center gap-2">
            {statusData?.isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Live SMTP Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-3.5 h-3.5" />
                Simulated Dev Mode
              </span>
            )}
          </div>
        )}
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-3.5 rounded-[6px] bg-muted/40 border border-border/50 space-y-1">
          <span className="text-muted-foreground font-medium">Sender Address</span>
          <p className="font-semibold text-foreground truncate">
            {statusData?.sender || "notifications@duesora.com"}
          </p>
        </div>

        <div className="p-3.5 rounded-[6px] bg-muted/40 border border-border/50 space-y-1">
          <span className="text-muted-foreground font-medium">Delivery Mode</span>
          <p className="font-semibold text-foreground">
            {statusData?.isConfigured
              ? `SMTP Relay (${statusData.host || "Active"})`
              : "Local Console (Simulated)"}
          </p>
        </div>

        <div className="p-3.5 rounded-[6px] bg-muted/40 border border-border/50 space-y-1">
          <span className="text-muted-foreground font-medium">Test Recipient</span>
          <p className="font-semibold text-foreground truncate">
            {currentUserEmail || statusData?.recipientEmail || "Current User"}
          </p>
        </div>
      </div>

      {/* Helper Tip */}
      <div className="p-3.5 rounded-[6px] bg-muted/20 border border-border/40 text-xs text-muted-foreground flex items-start gap-2.5">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          When SMTP environment variables (<code className="text-foreground font-mono">SMTP_HOST</code>,{" "}
          <code className="text-foreground font-mono">SMTP_USER</code>,{" "}
          <code className="text-foreground font-mono">SMTP_PASSWORD</code>) are configured, Duesora sends rich HTML renewal
          reminders directly to team inboxes. In local development without SMTP, notifications are cleanly logged to the console.
        </p>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-[6px] text-xs flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-primary/10 border-primary/20 text-primary"
              : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-muted-foreground hover:text-foreground ml-2 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          Send a sample 7-day renewal reminder email to verify formatting and dispatch.
        </p>
        {canSend && (
          <Button
            type="button"
            size="sm"
            disabled={sending}
            onClick={handleSendTest}
            className="rounded-[6px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs gap-1.5 text-xs font-semibold cursor-pointer"
          >
            {sending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Test Alert Email</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
