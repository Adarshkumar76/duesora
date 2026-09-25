"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Webhook,
  Plus,
  Radio,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Send,
  Loader2,
  Activity,
  History,
  AlertCircle,
  X,
  Clock,
} from "lucide-react";

export interface WebhookEndpointViewItem {
  id: string;
  workspaceId: string;
  url: string;
  description: string | null;
  secret: string;
  maskedSecret?: string;
  events: string[];
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface WebhookDeliveryViewItem {
  id: string;
  webhookEndpointId: string;
  event: string;
  payload: string;
  statusCode: number | null;
  responseBody: string | null;
  durationMs: number | null;
  error: string | null;
  status: string;
  deliveredAt: Date | string;
}

interface WebhooksManagerProps {
  initialEndpoints: WebhookEndpointViewItem[];
  workspaceId: string;
  userRole?: string;
}

const AVAILABLE_EVENTS = [
  { id: "*", label: "All Events (*)" },
  { id: "resource.created", label: "Resource Created" },
  { id: "resource.updated", label: "Resource Updated" },
  { id: "resource.deleted", label: "Resource Deleted" },
  { id: "renewal.approaching", label: "Renewal Approaching (Urgent)" },
  { id: "reminder.dispatched", label: "Renewal Reminder Dispatched" },
  { id: "decision.updated", label: "Renewal Decision Changed" },
  { id: "budget.exceeded", label: "Monthly Budget Threshold Exceeded" },
  { id: "seats.waste_detected", label: "Idle Seat Bloat Detected" },
];

export function WebhooksManager({
  initialEndpoints,
  workspaceId,
  userRole = "member",
}: WebhooksManagerProps) {
  const [endpoints, setEndpoints] = useState<WebhookEndpointViewItem[]>(initialEndpoints);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addUrl, setAddUrl] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addSecret, setAddSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["*"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Ping Test State
  const [testingId, setTestingId] = useState<string | null>(null);
  const [pingResult, setPingResult] = useState<{ id: string; success: boolean; message: string } | null>(null);

  // Delivery History State
  const [historyEndpoint, setHistoryEndpoint] = useState<WebhookEndpointViewItem | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDeliveryViewItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const canManage = userRole === "owner" || userRole === "admin";

  const handleCopySecret = (endpoint: WebhookEndpointViewItem) => {
    navigator.clipboard.writeText(endpoint.secret);
    setCopiedId(endpoint.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSecretReveal = (id: string) => {
    setRevealedSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleEvent = (eventId: string) => {
    if (eventId === "*") {
      setSelectedEvents(["*"]);
      return;
    }

    setSelectedEvents((prev) => {
      const withoutWildcard = prev.filter((e) => e !== "*");
      if (withoutWildcard.includes(eventId)) {
        const next = withoutWildcard.filter((e) => e !== eventId);
        return next.length === 0 ? ["*"] : next;
      } else {
        return [...withoutWildcard, eventId];
      }
    });
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: addUrl,
          description: addDescription || undefined,
          secret: addSecret || undefined,
          events: selectedEvents,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to create webhook endpoint");
      }

      setEndpoints((prev) => [json.data, ...prev]);
      setIsAddOpen(false);
      setAddUrl("");
      setAddDescription("");
      setAddSecret("");
      setSelectedEvents(["*"]);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Error creating webhook");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEndpoint = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook endpoint?")) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/webhooks/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setEndpoints((prev) => prev.filter((ep) => ep.id !== id));
      }
    } catch {
      // ignore
    }
  };

  const handleSendTestPing = async (endpoint: WebhookEndpointViewItem) => {
    setTestingId(endpoint.id);
    setPingResult(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/webhooks/${endpoint.id}/test`, {
        method: "POST",
      });

      const json = await res.json();
      if (res.ok && json.data) {
        const d = json.data;
        setPingResult({
          id: endpoint.id,
          success: d.status === "success",
          message: d.status === "success"
            ? `200 OK (${d.durationMs}ms)`
            : `Failed: ${d.error || `HTTP ${d.statusCode}`} (${d.durationMs}ms)`,
        });
      } else {
        setPingResult({
          id: endpoint.id,
          success: false,
          message: json.error?.message || "Test ping failed",
        });
      }
    } catch (err) {
      setPingResult({
        id: endpoint.id,
        success: false,
        message: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleViewDeliveries = async (endpoint: WebhookEndpointViewItem) => {
    setHistoryEndpoint(endpoint);
    setLoadingHistory(true);
    setDeliveries([]);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/webhooks/${endpoint.id}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setDeliveries(json.data.deliveries || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Outbound Webhooks</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              HMAC-SHA256 Signed
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Deliver real-time JSON payloads to your servers or automation platforms when resource events occur.
          </p>
        </div>

        {canManage && (
          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs text-xs font-medium cursor-pointer gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Webhook</span>
          </Button>
        )}
      </div>

      {/* Endpoints List */}
      <div className="space-y-3">
        {endpoints.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/80 p-10 text-center bg-card">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground mx-auto flex items-center justify-center mb-3">
              <Webhook className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No webhooks registered</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              Add a webhook endpoint to receive automated HTTP alerts for created, updated, or expiring resources.
            </p>
          </div>
        ) : (
          endpoints.map((endpoint) => {
            const isRevealed = revealedSecrets[endpoint.id];
            const isTesting = testingId === endpoint.id;
            const currentPing = pingResult?.id === endpoint.id ? pingResult : null;

            return (
              <div
                key={endpoint.id}
                className="rounded-2xl border border-border/80 bg-card p-5 space-y-3.5 shadow-2xs hover:border-border transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-foreground truncate max-w-md">
                        {endpoint.url}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          endpoint.active
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Radio className="w-2.5 h-2.5" />
                        <span>{endpoint.active ? "Active" : "Disabled"}</span>
                      </span>
                    </div>

                    {endpoint.description && (
                      <p className="text-xs text-muted-foreground">{endpoint.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendTestPing(endpoint)}
                      disabled={isTesting || !canManage}
                      className="rounded-xl border-border/80 text-xs font-medium cursor-pointer gap-1.5 h-8 px-2.5"
                    >
                      {isTesting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>Test Ping</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDeliveries(endpoint)}
                      className="rounded-xl border-border/80 text-xs font-medium cursor-pointer gap-1.5 h-8 px-2.5"
                    >
                      <History className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Deliveries</span>
                    </Button>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleDeleteEndpoint(endpoint.id)}
                        className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Delete Webhook"
                        aria-label="Delete Webhook"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Ping Result Pill */}
                {currentPing && (
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium animate-in fade-in-0 ${
                      currentPing.success
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>{currentPing.message}</span>
                  </div>
                )}

                {/* Event Tags & Secret */}
                <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-muted-foreground font-medium">Events:</span>
                    {endpoint.events.map((evt) => (
                      <span
                        key={evt}
                        className="px-2 py-0.5 rounded-lg text-[11px] font-mono bg-muted text-foreground"
                      >
                        {evt}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] bg-muted/40 px-2.5 py-1 rounded-xl border border-border/60 max-w-full overflow-hidden">
                    <span className="text-muted-foreground">Secret:</span>
                    <span className="text-foreground truncate">
                      {isRevealed
                        ? endpoint.secret
                        : `${endpoint.secret.slice(0, 8)}••••••••••••${endpoint.secret.slice(-4)}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSecretReveal(endpoint.id)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                      title={isRevealed ? "Hide Secret" : "Reveal Secret"}
                      aria-label={isRevealed ? "Hide Secret" : "Reveal Secret"}
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopySecret(endpoint)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer ml-1 shrink-0"
                      title="Copy Secret"
                      aria-label="Copy Secret"
                    >
                      {copiedId === endpoint.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Webhook Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div className="relative w-full max-w-lg bg-card border border-border/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border/60 bg-muted/30">
              <div>
                <h3 className="text-base font-semibold text-foreground">Add Webhook Endpoint</h3>
                <p className="text-xs text-muted-foreground">
                  Receive signed HTTP POST notifications for workspace events.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWebhook} className="p-4 sm:p-6 space-y-4">
              {addError && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-destructive/10 text-destructive text-xs border border-destructive/20 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Endpoint URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://api.yourdomain.com/webhooks/duesora"
                  value={addUrl}
                  onChange={(e) => setAddUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border/80 bg-background text-foreground text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Description (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Production Slack notifier, Internal Zapier workflow"
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border/80 bg-background text-foreground text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Subscribed Events</label>
                <div className="space-y-1.5 bg-muted/20 p-3 rounded-2xl border border-border/60">
                  {AVAILABLE_EVENTS.map((evt) => {
                    const isChecked = selectedEvents.includes(evt.id);
                    return (
                      <label
                        key={evt.id}
                        className="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:opacity-80 select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleEvent(evt.id)}
                          className="rounded border-border text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{evt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Custom Secret (optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave empty to auto-generate a secure random secret"
                  value={addSecret}
                  onChange={(e) => setAddSecret(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border/80 bg-background text-foreground text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-xl border-border/80 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Register Endpoint</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deliveries History Modal */}
      {historyEndpoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div className="relative w-full max-w-2xl bg-card border border-border/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border/60 bg-muted/30">
              <div>
                <h3 className="text-base font-semibold text-foreground">Delivery History</h3>
                <p className="text-xs font-mono text-muted-foreground truncate max-w-xs sm:max-w-lg">
                  {historyEndpoint.url}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryEndpoint(null)}
                className="p-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {loadingHistory ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  <span className="text-xs text-muted-foreground">Loading deliveries...</span>
                </div>
              ) : deliveries.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No delivery logs recorded yet for this webhook.
                </div>
              ) : (
                deliveries.map((del) => (
                  <div
                    key={del.id}
                    className="p-3.5 rounded-2xl border border-border/70 bg-muted/10 space-y-2 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            del.status === "success"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {del.statusCode ? `HTTP ${del.statusCode}` : del.status.toUpperCase()}
                        </span>
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {del.event}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        {del.durationMs !== null && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {del.durationMs}ms
                          </span>
                        )}
                        <span>{new Date(del.deliveredAt).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {del.error && (
                      <p className="text-[11px] text-destructive font-mono bg-destructive/5 p-2 rounded-xl border border-destructive/10">
                        {del.error}
                      </p>
                    )}

                    {del.responseBody && (
                      <details className="text-[11px]">
                        <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
                          Response body preview
                        </summary>
                        <pre className="mt-1 p-2 rounded-xl bg-muted/60 font-mono text-[10px] overflow-x-auto max-h-24">
                          {del.responseBody}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="px-4 sm:px-6 py-3 border-t border-border/60 bg-muted/20 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryEndpoint(null)}
                className="rounded-xl border-border/80 text-xs font-medium cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
