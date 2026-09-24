import type {
  RenewalAlertData,
  MonitorAlertData,
  TestAlertData,
  PriceChangeAlertData,
} from "./types";
import { formatCurrencyMinor } from "@/lib/currency/rates";

export function buildGotifyRenewalPayload(data: RenewalAlertData): Record<string, unknown> {
  const amountStr =
    data.amountMinor !== null && data.amountMinor !== undefined
      ? formatCurrencyMinor(data.amountMinor, data.currency || "USD")
      : null;

  const isOverdue = data.daysRemaining <= 0;
  const isUrgent = data.daysRemaining <= 3;

  const title = isOverdue
    ? `🚨 OVERDUE Renewal: ${data.resourceName}`
    : isUrgent
    ? `⚠️ Urgent Renewal: ${data.resourceName} (${data.daysRemaining}d left)`
    : `Renewal Due: ${data.resourceName} (${data.daysRemaining}d left)`;

  let message = `### Resource Renewal Notification\n\n**Resource:** \`${data.resourceName}\`\n**Workspace:** ${data.workspaceName || "Duesora"}`;
  if (data.renewalDate) {
    const d = new Date(data.renewalDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    message += `\n**Renewal Date:** ${d}`;
  }
  if (amountStr) message += `\n**Renewal Cost:** ${amountStr}`;

  return {
    title,
    message,
    priority: isOverdue ? 9 : isUrgent ? 8 : 5,
    extras: {
      "client::display": {
        contentType: "text/markdown",
      },
      ...(data.appUrl
        ? {
            "client::notification": {
              click: { url: `${data.appUrl}/resources/${data.resourceId}` },
            },
          }
        : {}),
    },
  };
}
export const buildGotifyRenewalMessage = buildGotifyRenewalPayload;

export function buildGotifyMonitorPayload(data: MonitorAlertData): Record<string, unknown> {
  const isRecovered = data.alertReason === "recovered";
  const title = isRecovered
    ? `✅ Monitor Recovered: ${data.resourceName}`
    : `⚠️ Service Degraded: ${data.resourceName}`;

  let message = isRecovered
    ? `### Service Recovered\n\nService \`${data.resourceName}\` (${data.hostname || ""}) has recovered and is healthy.`
    : `### Service Degraded\n\nService \`${data.resourceName}\` reported status **${data.status}**. Attention required.`;

  if (data.latencyMs) {
    message += `\n**Latency:** ${data.latencyMs}ms`;
  }

  return {
    title,
    message,
    priority: isRecovered ? 4 : 8,
    extras: {
      "client::display": {
        contentType: "text/markdown",
      },
      ...(data.appUrl
        ? {
            "client::notification": {
              click: { url: `${data.appUrl}/resources/${data.resourceId}` },
            },
          }
        : {}),
    },
  };
}
export const buildGotifyMonitorMessage = buildGotifyMonitorPayload;

export function buildGotifyPriceIncreasePayload(data: PriceChangeAlertData): Record<string, unknown> {
  const oldStr =
    data.previousAmountMinor !== null && data.previousAmountMinor !== undefined
      ? formatCurrencyMinor(data.previousAmountMinor, data.currency)
      : "—";
  const newStr = formatCurrencyMinor(data.newAmountMinor, data.currency);

  return {
    title: `Price Increase: ${data.resourceName} (+${data.changePercentage}%)`,
    message: `### Price Increase Alert\n\nRecurring rate for \`${data.resourceName}\` changed from **${oldStr}** to **${newStr}** (+${data.changePercentage}%).`,
    priority: 5,
    extras: {
      "client::display": {
        contentType: "text/markdown",
      },
      ...(data.appUrl
        ? {
            "client::notification": {
              click: { url: `${data.appUrl}/resources/${data.resourceId}` },
            },
          }
        : {}),
    },
  };
}
export const buildGotifyPriceIncreaseMessage = buildGotifyPriceIncreasePayload;

export function buildGotifyTestPayload(data: TestAlertData): Record<string, unknown> {
  return {
    title: `Gotify Alert Integration Connected: ${data.workspaceName}`,
    message: `Test notification sent successfully to channel "${data.channelName}" in workspace "${data.workspaceName}".`,
    priority: 5,
    extras: {
      "client::display": {
        contentType: "text/markdown",
      },
    },
  };
}
export const buildGotifyTestMessage = buildGotifyTestPayload;

export async function sendGotifyNotification(
  url: string,
  payload: Record<string, unknown>
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        success: false,
        statusCode: response.status,
        error: `Gotify rejected message (${response.status}): ${errorText.slice(0, 150)}`,
      };
    }

    return {
      success: true,
      statusCode: response.status,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error contacting Gotify server",
    };
  }
}
