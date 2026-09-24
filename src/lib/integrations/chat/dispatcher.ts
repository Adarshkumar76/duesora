import { listActiveChannelsForEvent } from "./repository";
import {
  buildSlackRenewalMessage,
  buildSlackMonitorMessage,
  buildSlackTestMessage,
  buildSlackPriceIncreaseMessage,
  sendSlackWebhook,
} from "./slack";
import {
  buildDiscordRenewalEmbed,
  buildDiscordMonitorEmbed,
  buildDiscordTestEmbed,
  buildDiscordPriceIncreaseEmbed,
  sendDiscordWebhook,
} from "./discord";
import {
  buildTelegramRenewalMessage,
  buildTelegramMonitorMessage,
  buildTelegramTestMessage,
  buildTelegramPriceIncreaseMessage,
  sendTelegramWebhook,
} from "./telegram";
import {
  buildTeamsRenewalMessage,
  buildTeamsMonitorMessage,
  buildTeamsTestMessage,
  buildTeamsPriceIncreaseMessage,
  sendTeamsWebhook,
} from "./teams";
import type {
  ChatProvider,
  ChatEventType,
  RenewalAlertData,
  MonitorAlertData,
  TestAlertData,
  PriceChangeAlertData,
  NotificationChannelItem,
} from "./types";

export interface DispatchReport {
  channelId: string;
  provider: ChatProvider;
  name: string;
  success: boolean;
  error?: string;
}

/**
 * Builds the provider-specific payload for a renewal alert.
 */
function buildRenewalPayload(
  provider: ChatProvider,
  data: RenewalAlertData
): Record<string, unknown> {
  switch (provider) {
    case "slack":
      return buildSlackRenewalMessage(data);
    case "discord":
      return buildDiscordRenewalEmbed(data);
    case "telegram":
      return buildTelegramRenewalMessage(data);
    case "teams":
      return buildTeamsRenewalMessage(data);
  }
}

/**
 * Builds the provider-specific payload for a monitor health alert.
 */
function buildMonitorPayload(
  provider: ChatProvider,
  data: MonitorAlertData
): Record<string, unknown> {
  switch (provider) {
    case "slack":
      return buildSlackMonitorMessage(data);
    case "discord":
      return buildDiscordMonitorEmbed(data);
    case "telegram":
      return buildTelegramMonitorMessage(data);
    case "teams":
      return buildTeamsMonitorMessage(data);
  }
}

/**
 * Builds the provider-specific payload for a verification test alert.
 */
function buildTestPayload(
  provider: ChatProvider,
  data: TestAlertData
): Record<string, unknown> {
  switch (provider) {
    case "slack":
      return buildSlackTestMessage(data);
    case "discord":
      return buildDiscordTestEmbed(data);
    case "telegram":
      return buildTelegramTestMessage(data);
    case "teams":
      return buildTeamsTestMessage(data);
  }
}

/**
 * Builds the provider-specific payload for a price increase / rate shift alert.
 */
function buildPriceChangePayload(
  provider: ChatProvider,
  data: PriceChangeAlertData
): Record<string, unknown> {
  switch (provider) {
    case "slack":
      return buildSlackPriceIncreaseMessage(data);
    case "discord":
      return buildDiscordPriceIncreaseEmbed(data);
    case "telegram":
      return buildTelegramPriceIncreaseMessage(data);
    case "teams":
      return buildTeamsPriceIncreaseMessage(data);
  }
}

/**
 * Dispatches an alert to a single channel based on its provider.
 */
async function dispatchToChannel(
  channel: NotificationChannelItem,
  payload: Record<string, unknown>
): Promise<DispatchReport> {
  let result: { success: boolean; error?: string };

  switch (channel.provider) {
    case "slack":
      result = await sendSlackWebhook(channel.webhookUrl, payload);
      break;
    case "discord":
      result = await sendDiscordWebhook(channel.webhookUrl, payload);
      break;
    case "telegram":
      result = await sendTelegramWebhook(channel.webhookUrl, payload);
      break;
    case "teams":
      result = await sendTeamsWebhook(channel.webhookUrl, payload);
      break;
    default:
      result = { success: false, error: `Unsupported chat provider: ${channel.provider}` };
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
 * Dispatches renewal alerts to all subscribed chat channels in a workspace.
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
    const payload = buildRenewalPayload(channel.provider, data);
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
 * Dispatches SSL/TLS & DNS monitor status alerts to all subscribed chat channels.
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
    const payload = buildMonitorPayload(channel.provider, data);
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
 * Dispatches price increase / rate shift alerts to all subscribed chat channels.
 */
export async function dispatchPriceIncreaseChatAlert(
  workspaceId: string,
  data: PriceChangeAlertData
): Promise<DispatchReport[]> {
  const channels = await listActiveChannelsForEvent(workspaceId, "resource.price_changed");

  if (channels.length === 0) return [];

  const promises = channels.map((channel) => {
    const payload = buildPriceChangePayload(channel.provider, data);
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
  const payload = buildTestPayload(channel.provider, data);

  switch (channel.provider) {
    case "slack":
      return sendSlackWebhook(channel.webhookUrl, payload);
    case "discord":
      return sendDiscordWebhook(channel.webhookUrl, payload);
    case "telegram":
      return sendTelegramWebhook(channel.webhookUrl, payload);
    case "teams":
      return sendTeamsWebhook(channel.webhookUrl, payload);
    default:
      return { success: false, error: `Unsupported provider: ${channel.provider}` };
  }
}
