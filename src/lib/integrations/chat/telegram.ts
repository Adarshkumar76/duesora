import type { RenewalAlertData, MonitorAlertData, TestAlertData, PriceChangeAlertData } from "./types";
import { CURRENCY_SYMBOLS } from "@/lib/currency/rates";

const TIMEOUT_MS = 5000;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Builds a Telegram HTML formatted message for resource renewal reminders.
 */
export function buildTelegramRenewalMessage(data: RenewalAlertData): Record<string, unknown> {
  const isOverdue = data.daysRemaining <= 0;
  const isEscalated = Boolean(data.isEscalated);
  const statusEmoji = isEscalated || isOverdue ? "🚨" : data.daysRemaining <= 7 ? "⚠️" : "🔔";
  const statusLabel = isOverdue
    ? "EXPIRED / OVERDUE"
    : data.daysRemaining === 1
    ? "Renews tomorrow"
    : `Renews in ${data.daysRemaining} days`;

  const curr = (data.currency || "USD").toUpperCase();
  const symbol = CURRENCY_SYMBOLS[curr] || curr;
  const amountStr =
    data.amountMinor !== null && data.amountMinor !== undefined
      ? `${symbol}${(data.amountMinor / 100).toFixed(2)}${
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
  const titlePrefix = isEscalated ? "<b>[ESCALATION]</b> " : "";

  const lines = [
    `${statusEmoji} ${titlePrefix}<b>${isOverdue ? "Renewal Overdue" : "Upcoming Renewal"}: ${escapeHtml(data.resourceName)}</b>`,
    "",
    `<b>Status:</b> ${escapeHtml(statusLabel)}`,
    `<b>Type:</b> ${escapeHtml(data.resourceType || "Asset")}`,
    `<b>Due Date:</b> ${escapeHtml(dateStr)}`,
    `<b>Commitment:</b> ${escapeHtml(amountStr)}`,
    data.provider ? `<b>Provider:</b> ${escapeHtml(data.provider)}` : null,
    data.workspaceName ? `<b>Workspace:</b> ${escapeHtml(data.workspaceName)}` : null,
    "",
    isEscalated
      ? "⚠️ <i>This renewal was escalated to workspace administrators because action is urgently required.</i>\n"
      : null,
    `🔗 <a href="${resourceLink}">Open Resource in Duesora</a>`,
  ].filter(Boolean);

  return {
    text: lines.join("\n"),
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
}

/**
 * Builds a Telegram HTML formatted message for SSL/TLS and monitor health alerts.
 */
export function buildTelegramMonitorMessage(data: MonitorAlertData): Record<string, unknown> {
  const isRecovered = data.alertReason === "recovered";
  const statusEmoji = isRecovered
    ? "🟢"
    : data.status === "critical" || data.status === "error"
    ? "🔴"
    : "🟡";

  const statusTitle = isRecovered
    ? "Health Check Recovered"
    : `Monitor Degradation: ${data.status.toUpperCase()}`;

  const appUrl = data.appUrl || "http://localhost:3000";
  const monitorLink = `${appUrl}/resources/${data.resourceId}`;

  const lines = [
    `${statusEmoji} <b>${statusTitle}: ${escapeHtml(data.resourceName)}</b>`,
    "",
    data.hostname ? `<b>Hostname:</b> <code>${escapeHtml(data.hostname)}</code>` : null,
    `<b>Status:</b> ${escapeHtml(data.status)}`,
    data.daysRemaining !== null && data.daysRemaining !== undefined
      ? `<b>TLS Validity:</b> ${data.daysRemaining} days remaining`
      : null,
    data.issuer ? `<b>Certificate Issuer:</b> ${escapeHtml(data.issuer)}` : null,
    data.latencyMs !== null && data.latencyMs !== undefined
      ? `<b>Latency:</b> ${data.latencyMs}ms`
      : null,
    data.workspaceName ? `<b>Workspace:</b> ${escapeHtml(data.workspaceName)}` : null,
    "",
    `🔗 <a href="${monitorLink}">View Health Probes in Duesora</a>`,
  ].filter(Boolean);

  return {
    text: lines.join("\n"),
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
}

/**
 * Builds a Telegram HTML verification test alert.
 */
export function buildTelegramTestMessage(data: TestAlertData): Record<string, unknown> {
  const lines = [
    "✅ <b>Telegram Alert Integration Verified!</b>",
    "",
    `Your Telegram notification channel for <b>${escapeHtml(data.workspaceName)}</b> (<code>${escapeHtml(data.channelName)}</code>) is successfully connected and verified.`,
    "",
    `<i>Sent by ${escapeHtml(data.testedBy || "Workspace Administrator")} • Duesora Team Alerts</i>`,
  ];

  return {
    text: lines.join("\n"),
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
}

/**
 * Builds a Telegram HTML formatted message for price increases and cost shifts.
 */
export function buildTelegramPriceIncreaseMessage(
  data: PriceChangeAlertData
): Record<string, unknown> {
  const isHike = data.changePercentage > 0;
  const statusEmoji = isHike ? "📈" : "📉";
  const titleLabel = isHike ? "Price Increase Alert" : "Price Adjustment";
  const deltaLabel = isHike ? `+${data.changePercentage}%` : `${data.changePercentage}%`;

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

  const lines = [
    `${statusEmoji} <b>${titleLabel}: ${escapeHtml(data.resourceName)}</b>`,
    "",
    `<b>Rate Shift:</b> ${escapeHtml(deltaLabel)}`,
    `<b>Previous Cost:</b> ${escapeHtml(prevStr)}`,
    `<b>New Cost:</b> ${escapeHtml(newStr)}`,
    `<b>Type:</b> ${escapeHtml(data.resourceType || "Asset")}`,
    data.provider ? `<b>Provider:</b> ${escapeHtml(data.provider)}` : null,
    data.changeReason ? `<b>Reason:</b> ${escapeHtml(data.changeReason)}` : null,
    data.changedByName ? `<b>Updated By:</b> ${escapeHtml(data.changedByName)}` : null,
    data.workspaceName ? `<b>Workspace:</b> ${escapeHtml(data.workspaceName)}` : null,
    "",
    `🔗 <a href="${resourceLink}">View Cost History in Duesora</a>`,
  ].filter(Boolean);

  return {
    text: lines.join("\n"),
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
}

/**
 * Dispatches payload to Telegram Bot API or webhook relay.
 */
export async function sendTelegramWebhook(
  webhookUrl: string,
  payload: Record<string, unknown>
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // Extract chat_id from query params if specified (e.g. ?chat_id=123456)
    let targetUrl = webhookUrl;
    const bodyPayload = { ...payload };

    try {
      const parsed = new URL(webhookUrl);
      const chatIdParam = parsed.searchParams.get("chat_id");
      if (chatIdParam && !bodyPayload.chat_id) {
        bodyPayload.chat_id = chatIdParam;
      }
    } catch {
      // ignore URL parsing errors, fetch will handle invalid url
    }

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return {
        success: false,
        statusCode: response.status,
        error: `Telegram delivery rejected (${response.status}): ${errText || response.statusText}`,
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
            ? "Telegram delivery timed out (5s limit)"
            : err.message
          : "Network request to Telegram failed",
    };
  }
}
