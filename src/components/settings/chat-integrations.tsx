"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MessageSquare,
  Plus,
  Trash2,
  Send,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
  Power,
  X,
} from "lucide-react";
import type { NotificationChannelItem, ChatProvider } from "@/lib/integrations/chat/types";

interface ChatIntegrationsProps {
  workspaceId: string;
  initialChannels: NotificationChannelItem[];
  currentUserRole: string;
}

function SlackIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

function DiscordIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

const EVENT_OPTIONS = [
  { id: "reminder.upcoming", label: "Upcoming Renewals", description: "30d, 14d, 7d, 3d, 1d reminder alerts" },
  { id: "reminder.overdue", label: "Overdue Renewals", description: "Expired domains, licenses, or contracts" },
  { id: "monitor.degraded", label: "SSL / Health Degradation", description: "Certificate expiring in <=14d, critical, or error" },
  { id: "monitor.recovered", label: "Health Recovery", description: "Certificate renewed or returned to healthy" },
];

export function ChatIntegrations({
  workspaceId,
  initialChannels = [],
  currentUserRole,
}: ChatIntegrationsProps) {
  const [channels, setChannels] = useState<NotificationChannelItem[]>(initialChannels);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProvider, setModalProvider] = useState<ChatProvider>("slack");

  // Form states
  const [name, setName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "reminder.upcoming",
    "reminder.overdue",
    "monitor.degraded",
    "monitor.recovered",
  ]);

  // Loading & feedback states
  const [creating, setCreating] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [modalTesting, setModalTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isAdmin = currentUserRole === "owner" || currentUserRole === "admin";

  const openAddModal = (provider: ChatProvider) => {
    setModalProvider(provider);
    setName(provider === "slack" ? "#alerts" : "#devops");
    setWebhookUrl("");
    setSelectedEvents([
      "reminder.upcoming",
      "reminder.overdue",
      "monitor.degraded",
      "monitor.recovered",
    ]);
    setFeedback(null);
    setModalOpen(true);
  };

  const handleToggleEvent = (eventId: string) => {
    if (selectedEvents.includes(eventId)) {
      if (selectedEvents.length > 1) {
        setSelectedEvents(selectedEvents.filter((e) => e !== eventId));
      }
    } else {
      setSelectedEvents([...selectedEvents, eventId]);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setCreating(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: modalProvider,
          name,
          webhookUrl,
          events: selectedEvents,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to create channel");
      }

      setChannels([json.data, ...channels]);
      setModalOpen(false);
      setFeedback({
        type: "success",
        message: `${modalProvider === "slack" ? "Slack" : "Discord"} channel added successfully!`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to add integration",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleTestModalWebhook = async () => {
    if (!webhookUrl) {
      setFeedback({ type: "error", message: "Please enter a webhook URL to test" });
      return;
    }

    setModalTesting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/integrations/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: modalProvider,
          webhookUrl,
          name,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Delivery failed");
      }

      setFeedback({
        type: "success",
        message: `Test alert received by ${modalProvider === "slack" ? "Slack" : "Discord"}! Check your channel.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Test alert failed",
      });
    } finally {
      setModalTesting(false);
    }
  };

  const handleTestExistingChannel = async (channelId: string) => {
    setTestingId(channelId);
    setFeedback(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/integrations/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Test alert failed");
      }

      setFeedback({
        type: "success",
        message: json.data?.message || "Test alert delivered successfully!",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed sending test alert",
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleActive = async (channel: NotificationChannelItem) => {
    if (!isAdmin) return;

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/integrations/${channel.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !channel.active }),
        }
      );

      if (res.ok) {
        setChannels(
          channels.map((c) =>
            c.id === channel.id ? { ...c, active: !c.active } : c
          )
        );
      }
    } catch (err) {
      console.error("Failed toggling channel active:", err);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!isAdmin) return;
    if (!window.confirm("Are you sure you want to remove this alert integration?")) {
      return;
    }

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/integrations/${channelId}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        setChannels(channels.filter((c) => c.id !== channelId));
        setFeedback({
          type: "success",
          message: "Integration channel removed successfully",
        });
      }
    } catch (err) {
      console.error("Failed deleting channel:", err);
    }
  };

  const slackCount = channels.filter((c) => c.provider === "slack").length;
  const discordCount = channels.filter((c) => c.provider === "discord").length;

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Team Chat Alerts & Webhooks</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Post rich notifications directly to Slack or Discord when renewals approach or SSL certificates degrade.
          </p>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-medium border animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Provider Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Slack Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-2xs hover:border-border transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4A154B]/10 dark:bg-[#4A154B]/25 text-[#4A154B] dark:text-[#E01E5A] flex items-center justify-center shrink-0">
                <SlackIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Slack</h3>
                <p className="text-xs text-muted-foreground">
                  {slackCount > 0 ? `${slackCount} webhook${slackCount > 1 ? "s" : ""} connected` : "Not connected"}
                </p>
              </div>
            </div>
            {slackCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Active
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Posts native Slack Block Kit cards with due dates, spend values, and 1-click management buttons.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => openAddModal("slack")}
            disabled={!isAdmin}
            className="w-full rounded-xl bg-[#4A154B] hover:bg-[#3d113e] text-white shadow-xs gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect Slack Channel</span>
          </Button>
        </div>

        {/* Discord Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-2xs hover:border-border transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5865F2]/10 dark:bg-[#5865F2]/25 text-[#5865F2] flex items-center justify-center shrink-0">
                <DiscordIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Discord</h3>
                <p className="text-xs text-muted-foreground">
                  {discordCount > 0 ? `${discordCount} webhook${discordCount > 1 ? "s" : ""} connected` : "Not connected"}
                </p>
              </div>
            </div>
            {discordCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Active
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sends rich Discord Embeds with color-coded severity (green, amber, red) and direct links.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => openAddModal("discord")}
            disabled={!isAdmin}
            className="w-full rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white shadow-xs gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect Discord Webhook</span>
          </Button>
        </div>
      </div>

      {/* Configured Channels Table */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Active Webhook Channels</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configured chat alert destinations for this workspace.
            </p>
          </div>
        </div>

        {channels.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto stroke-1 opacity-50" />
            <p className="text-sm font-medium text-foreground">No chat webhooks connected</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Add a Slack or Discord webhook to receive automatic alerts when renewal dates approach or SSL certificates need attention.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Events</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {channels.map((channel) => {
                  const isSlack = channel.provider === "slack";
                  return (
                    <tr key={channel.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{channel.name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                            isSlack
                              ? "bg-[#4A154B]/10 text-[#4A154B] dark:text-[#E01E5A] border border-[#4A154B]/20"
                              : "bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20"
                          }`}
                        >
                          {isSlack ? <SlackIcon className="w-3 h-3" /> : <DiscordIcon className="w-3 h-3" />}
                          <span className="capitalize">{channel.provider}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {channel.events.includes("*") ? (
                            <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium">
                              All Events
                            </span>
                          ) : (
                            channel.events.map((e) => (
                              <span
                                key={e}
                                className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium"
                              >
                                {e.replace("reminder.", "").replace("monitor.", "")}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          disabled={!isAdmin}
                          onClick={() => handleToggleActive(channel)}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer transition-colors ${
                            channel.active
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-muted text-muted-foreground border border-border/80"
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{channel.active ? "Active" : "Paused"}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={testingId === channel.id}
                            onClick={() => handleTestExistingChannel(channel.id)}
                            className="h-8 rounded-lg text-xs font-semibold gap-1.5 border-border/80 cursor-pointer"
                          >
                            {testingId === channel.id ? (
                              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                            ) : (
                              <Send className="w-3 h-3 text-muted-foreground" />
                            )}
                            <span>Send Test</span>
                          </Button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteChannel(channel.id)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                              title="Delete Integration"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Integration Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    modalProvider === "slack"
                      ? "bg-[#4A154B]/10 text-[#4A154B] dark:text-[#E01E5A]"
                      : "bg-[#5865F2]/10 text-[#5865F2]"
                  }`}
                >
                  {modalProvider === "slack" ? (
                    <SlackIcon className="w-4 h-4" />
                  ) : (
                    <DiscordIcon className="w-4 h-4" />
                  )}
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Connect {modalProvider === "slack" ? "Slack" : "Discord"} Alerts
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateChannel} className="space-y-4">
              {/* Channel Label */}
              <div className="space-y-1.5">
                <Label htmlFor="channelName" className="text-xs font-semibold">
                  Channel Name / Label
                </Label>
                <Input
                  id="channelName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={modalProvider === "slack" ? "#alerts" : "#devops-feed"}
                  required
                  className="h-10 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Friendly label for identifying this channel in Duesora settings.
                </p>
              </div>

              {/* Webhook URL */}
              <div className="space-y-1.5">
                <Label htmlFor="webhookUrl" className="text-xs font-semibold">
                  Webhook URL
                </Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder={
                    modalProvider === "slack"
                      ? "https://hooks.slack.com/services/T00/B00/XXXX"
                      : "https://discord.com/api/webhooks/0000/XXXX"
                  }
                  required
                  className="h-10 text-xs font-mono"
                />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {modalProvider === "slack" ? (
                    <>
                      Create an Incoming Webhook in your Slack App or Integrations directory.{" "}
                      <a
                        href="https://api.slack.com/messaging/webhooks"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-0.5"
                      >
                        Slack Webhook Guide <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </>
                  ) : (
                    <>
                      In Discord channel settings, go to <strong>Integrations &gt; Webhooks &gt; New Webhook</strong>.{" "}
                      <a
                        href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-0.5"
                      >
                        Discord Webhook Guide <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </>
                  )}
                </p>
              </div>

              {/* Event Subscriptions */}
              <div className="space-y-2 pt-1">
                <Label className="text-xs font-semibold">Event Triggers</Label>
                <div className="space-y-2 border border-border/70 rounded-xl p-3 bg-muted/20">
                  {EVENT_OPTIONS.map((opt) => {
                    const isChecked = selectedEvents.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        className="flex items-start gap-2.5 cursor-pointer text-xs select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleEvent(opt.id)}
                          className="mt-0.5 rounded border-border/80 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                        />
                        <div>
                          <p className="font-semibold text-foreground">{opt.label}</p>
                          <p className="text-[11px] text-muted-foreground">{opt.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={modalTesting || !webhookUrl}
                  onClick={handleTestModalWebhook}
                  className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  {modalTesting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Test Webhook</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={creating}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
                  >
                    {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Channel</span>
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
