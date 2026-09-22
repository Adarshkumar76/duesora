import { listActiveChannelsForEvent } from "./repository";
import {
  buildSlackRenewalMessage,
  buildSlackMonitorMessage,
  buildSlackTestMessage,
  sendSlackWebhook,
} from "./slack";
import {
  buildDiscordRenewalEmbed,
  buildDiscordMonitorEmbed,
  buildDiscordTestEmbed,
  sendDiscordWebhook,
} from "./discord";
import type {
  ChatEventType,
  RenewalAlertData,
  MonitorAlertData,
  TestAlertData,
  NotificationChannelItem,
} from "./types";

export interface DispatchReport {
  channelId: string;
  provider: "slack" | "discord";
  name: string;
  success: boolean;
  error?: string;
}

/**
 * Dispatches an alert to a single channel based on its provider.
 */
async function dispatchToChannel(
  channel: NotificationChannelItem,
  payload: Record<string, unknown>
): Promise<DispatchReport> {
  let result: { success: boolean; error?: string };

  if (channel.provider === "slack") {
    result = await sendSlackWebhook(channel.webhookUrl, payload);
  } else {
    result = await sendDiscordWebhook(channel.webhookUrl, payload);
  }

  return {
    channelId: channel.id,
    provider: channel.provider,
    name: channel.name,
    success: result.success,
    error: result.error,
  };
}

/**
 * Dispatches renewal alerts to all subscribed Slack & Discord channels in a workspace.
 */
export async function dispatchRenewalChatAlert(
  workspaceId: string,
  data: RenewalAlertData
): Promise<DispatchReport[]> {
  const event: ChatEventType =
    data.daysRemaining <= 0 ? "reminder.overdue" : "reminder.upcoming";
  const channels = await listActiveChannelsForEvent(workspaceId, event);

  if (channels.length === 0) return [];

  const promises = channels.map((channel) => {
    const payload =
      channel.provider === "slack"
        ? buildSlackRenewalMessage(data)
        : buildDiscordRenewalEmbed(data);
    return dispatchToChannel(channel, payload);
  });

  const settled = await Promise.allSettled(promises);
  return settled.map((s, idx) =>
    s.status === "fulfilled"
      ? s.value
      : {
          channelId: channels[idx].id,
          provider: channels[idx].provider,
          name: channels[idx].name,
          success: false,
          error: s.reason instanceof Error ? s.reason.message : "Dispatch rejected",
        }
  );
}

/**
 * Dispatches SSL/TLS & DNS monitor status alerts to all subscribed Slack & Discord channels.
 */
export async function dispatchMonitorChatAlert(
  workspaceId: string,
  data: MonitorAlertData
): Promise<DispatchReport[]> {
  const event: ChatEventType =
    data.alertReason === "recovered" ? "monitor.recovered" : "monitor.degraded";
  const channels = await listActiveChannelsForEvent(workspaceId, event);

  if (channels.length === 0) return [];

  const promises = channels.map((channel) => {
    const payload =
      channel.provider === "slack"
        ? buildSlackMonitorMessage(data)
        : buildDiscordMonitorEmbed(data);
    return dispatchToChannel(channel, payload);
  });

  const settled = await Promise.allSettled(promises);
  return settled.map((s, idx) =>
    s.status === "fulfilled"
      ? s.value
      : {
          channelId: channels[idx].id,
          provider: channels[idx].provider,
          name: channels[idx].name,
          success: false,
          error: s.reason instanceof Error ? s.reason.message : "Dispatch rejected",
        }
  );
}

/**
 * Sends a live verification test alert to a specific channel.
 */
export async function sendTestChatAlert(
  channel: NotificationChannelItem,
  data: TestAlertData
): Promise<{ success: boolean; error?: string }> {
  const payload =
    channel.provider === "slack"
      ? buildSlackTestMessage(data)
      : buildDiscordTestEmbed(data);

  if (channel.provider === "slack") {
    return sendSlackWebhook(channel.webhookUrl, payload);
  } else {
    return sendDiscordWebhook(channel.webhookUrl, payload);
  }
}
