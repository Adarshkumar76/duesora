import type { RenewalAlertData, MonitorAlertData, TestAlertData, PriceChangeAlertData } from "./types";
import { CURRENCY_SYMBOLS } from "@/lib/currency/rates";

const TIMEOUT_MS = 5000;

export function buildDiscordRenewalEmbed(data: RenewalAlertData): Record<string, unknown> {
  const isOverdue = data.daysRemaining <= 0;
  const isEscalated = Boolean(data.isEscalated);
  const color = isEscalated || isOverdue ? 0xef4444 : data.daysRemaining <= 7 ? 0xf59e0b : 0x10b981;
  const statusLabel = isOverdue
    ? "EXPIRED / OVERDUE"
    : data.daysRemaining === 1
    ? "Renews tomorrow"
    : `Renews in ${data.daysRemaining} days`;

  const amountStr =
    data.amountMinor !== null && data.amountMinor !== undefined
      ? `${data.currency || "$"}${(data.amountMinor / 100).toFixed(2)}${
          data.billingCycle ? ` / ${data.billingCycle}` : ""
        }`
      : "Free / Unset";

  const dateStr = data.renewalDate
    ? new Date(data.renewalDate).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "Not specified";

  const appUrl = data.appUrl || "http://localhost:3000";
  const resourceLink = `${appUrl}/resources/${data.resourceId}`;
  const titlePrefix = isEscalated ? "🚨 [ESCALATION] " : isOverdue ? "🚨 " : "🔔 ";

  return {
    username: "Duesora Alerts",
    embeds: [
      {
        title: `${titlePrefix}${isOverdue ? "Renewal Overdue" : "Upcoming Renewal"}: ${data.resourceName}`,
        url: resourceLink,
        color,
        fields: [
          { name: "Status", value: `**${statusLabel}**`, inline: true },
          { name: "Due Date", value: dateStr, inline: true },
          { name: "Amount", value: amountStr, inline: true },
          { name: "Asset Type", value: data.resourceType || "Asset", inline: true },
          ...(data.provider ? [{ name: "Provider", value: data.provider, inline: true }] : []),
          { name: "Workspace", value: data.workspaceName || "Personal Workspace", inline: true },
        ],
        footer: {
          text: `Duesora Asset Tracker • ${data.workspaceName || "Workspace"}`,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export function buildDiscordMonitorEmbed(data: MonitorAlertData): Record<string, unknown> {
  const isRecovery = data.alertReason === "recovered";
  const color = isRecovery ? 0x10b981 : data.status === "critical" || data.status === "error" ? 0xef4444 : 0xf59e0b;
  const statusTitle = isRecovery ? "🟢 SSL Certificate Recovered" : "🚨 SSL Certificate Health Alert";

  const appUrl = data.appUrl || "http://localhost:3000";
  const resourceLink = `${appUrl}/resources/${data.resourceId}`;

  return {
    username: "Duesora Alerts",
    embeds: [
      {
        title: `${statusTitle}: ${data.hostname || data.resourceName}`,
        url: resourceLink,
        color,
        fields: [
          { name: "Status", value: `**${data.status.toUpperCase()}**`, inline: true },
          {
            name: "Days Remaining",
            value: data.daysRemaining !== null && data.daysRemaining !== undefined ? `${data.daysRemaining} days` : "Unknown",
            inline: true,
          },
          { name: "Issuer", value: data.issuer || "Unknown", inline: true },
          { name: "Latency", value: data.latencyMs ? `${data.latencyMs}ms` : "—", inline: true },
        ],
        footer: {
          text: `Duesora Health Monitor • ${data.workspaceName || "Workspace"}`,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export function buildDiscordTestEmbed(data: TestAlertData): Record<string, unknown> {
  return {
    username: "Duesora Alerts",
    embeds: [
      {
        title: "✅ Discord Alert Integration Connected",
        description: `Your Discord webhook for **${data.workspaceName}** (**${data.channelName}**) is successfully connected and ready to receive renewal and SSL health alerts!`,
        color: 0x10b981,
        fields: [
          { name: "Integration", value: "Discord Webhook", inline: true },
          { name: "Status", value: "Verified & Active", inline: true },
          { name: "Sent By", value: data.testedBy || "Workspace Admin", inline: true },
        ],
        footer: {
          text: "Duesora Team Alerts",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export function buildDiscordPriceIncreaseEmbed(data: PriceChangeAlertData): Record<string, unknown> {
  const isHike = data.changePercentage > 0;
  const color = isHike ? 0xef4444 : 0x10b981;
  const deltaLabel = isHike ? `+${data.changePercentage}%` : `${data.changePercentage}%`;
  const directionTitle = isHike ? "📈 Price Increase Alert" : "📉 Price Adjustment";

  const curr = (data.currency || "USD").toUpperCase();
  const symbol = CURRENCY_SYMBOLS[curr] || curr;

  const prevStr =
    data.previousAmountMinor !== null && data.previousAmountMinor !== undefined
      ? `${symbol}${(data.previousAmountMinor / 100).toFixed(2)}${
          data.previousBillingCycle ? ` / ${data.previousBillingCycle}` : ""
        }`
      : "Free / Unset";
  const newStr = `${symbol}${(data.newAmountMinor / 100).toFixed(2)}${
    data.newBillingCycle ? ` / ${data.newBillingCycle}` : ""
  }`;

  const appUrl = data.appUrl || "http://localhost:3000";
  const resourceLink = `${appUrl}/resources/${data.resourceId}`;

  return {
    username: "Duesora Cost Intelligence",
    embeds: [
      {
        title: `${directionTitle}: ${data.resourceName} (${deltaLabel})`,
        url: resourceLink,
        color,
        description: data.changeReason
          ? `**Reason:** ${data.changeReason}`
          : "A price shift was recorded on this resource.",
        fields: [
          { name: "Resource", value: data.resourceName, inline: true },
          { name: "Rate Shift", value: `**${deltaLabel}**`, inline: true },
          { name: "Asset Type", value: data.resourceType || "Asset", inline: true },
          { name: "Previous Cost", value: prevStr, inline: true },
          { name: "New Cost", value: `**${newStr}**`, inline: true },
          {
            name: "Updated By",
            value: data.changedByName || "Workspace Administrator",
            inline: true,
          },
        ],
        footer: {
          text: `Duesora Cost Alerts • ${data.workspaceName || "Workspace"}`,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export async function sendDiscordWebhook(
  webhookUrl: string,
  payload: Record<string, unknown>
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Discord returns 204 No Content on successful webhook dispatch
    if (!response.ok && response.status !== 204) {
      const errText = await response.text().catch(() => "");
      return {
        success: false,
        statusCode: response.status,
        error: `Discord rejected delivery (${response.status}): ${errText || response.statusText}`,
      };
    }

    return {
      success: true,
      statusCode: response.status,
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.name === "AbortError"
            ? "Discord delivery timed out (5s limit)"
            : err.message
          : "Network request to Discord failed",
    };
  }
}
