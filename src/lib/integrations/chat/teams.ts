import type { RenewalAlertData, MonitorAlertData, TestAlertData, PriceChangeAlertData } from "./types";
import { CURRENCY_SYMBOLS } from "@/lib/currency/rates";
import { getAppBaseUrl } from "@/lib/url";

const TIMEOUT_MS = 5000;

/**
 * Builds a Microsoft Teams MessageCard for renewal alerts.
 */
export function buildTeamsRenewalMessage(data: RenewalAlertData): Record<string, unknown> {
  const isOverdue = data.daysRemaining <= 0;
  const isEscalated = Boolean(data.isEscalated);

  const themeColor = isEscalated || isOverdue ? "F43F5E" : data.daysRemaining <= 7 ? "F59E0B" : "10B981";
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

  const appUrl = getAppBaseUrl(data.appUrl);
  const resourceLink = `${appUrl}/resources/${data.resourceId}`;
  const titlePrefix = isEscalated ? "[ESCALATION] " : "";

  const facts: Array<{ name: string; value: string }> = [
    { name: "Status:", value: statusLabel },
    { name: "Type:", value: data.resourceType || "Asset" },
    { name: "Due Date:", value: dateStr },
    { name: "Commitment:", value: amountStr },
  ];

  if (data.provider) {
    facts.push({ name: "Provider:", value: data.provider });
  }

  const sections: Array<Record<string, unknown>> = [
    {
      activityTitle: `${statusEmoji} ${titlePrefix}${isOverdue ? "Renewal Overdue" : "Upcoming Renewal"}: ${data.resourceName}`,
      activitySubtitle: data.workspaceName ? `Workspace: ${data.workspaceName}` : "Duesora Notification",
      facts,
      text: isEscalated
        ? "⚠️ **Urgent Escalation:** This renewal requires immediate attention from workspace administrators."
        : undefined,
      markdown: true,
    },
  ];

  return {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor,
    summary: `${titlePrefix}Renewal Alert: ${data.resourceName}`,
    title: `${statusEmoji} ${titlePrefix}Renewal Alert: ${data.resourceName}`,
    sections,
    potentialAction: [
      {
        "@type": "OpenUri",
        name: "View in Duesora",
        targets: [{ os: "default", uri: resourceLink }],
      },
    ],
  };
}

/**
 * Builds a Microsoft Teams MessageCard for SSL/TLS and monitor health alerts.
 */
export function buildTeamsMonitorMessage(data: MonitorAlertData): Record<string, unknown> {
  const isRecovered = data.alertReason === "recovered";
  const themeColor = isRecovered
    ? "10B981"
    : data.status === "critical" || data.status === "error"
    ? "F43F5E"
    : "F59E0B";

  const statusEmoji = isRecovered
    ? "🟢"
    : data.status === "critical" || data.status === "error"
    ? "🔴"
    : "🟡";

  const statusTitle = isRecovered
    ? "Health Check Recovered"
    : `Monitor Degradation: ${data.status.toUpperCase()}`;

  const appUrl = getAppBaseUrl(data.appUrl);
  const monitorLink = `${appUrl}/resources/${data.resourceId}`;

  const facts: Array<{ name: string; value: string }> = [
    { name: "Status:", value: data.status.toUpperCase() },
  ];

  if (data.hostname) facts.push({ name: "Hostname:", value: data.hostname });
  if (data.daysRemaining !== null && data.daysRemaining !== undefined) {
    facts.push({ name: "TLS Validity:", value: `${data.daysRemaining} days remaining` });
  }
  if (data.issuer) facts.push({ name: "Certificate Issuer:", value: data.issuer });
  if (data.latencyMs !== null && data.latencyMs !== undefined) {
    facts.push({ name: "Latency Ping:", value: `${data.latencyMs}ms` });
  }

  return {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor,
    summary: `${statusTitle}: ${data.resourceName}`,
    title: `${statusEmoji} ${statusTitle}: ${data.resourceName}`,
    sections: [
      {
        activityTitle: `SSL & Health Monitor: ${data.resourceName}`,
        activitySubtitle: data.workspaceName ? `Workspace: ${data.workspaceName}` : "Duesora Health Telemetry",
        facts,
        markdown: true,
      },
    ],
    potentialAction: [
      {
        "@type": "OpenUri",
        name: "View Health Probes",
        targets: [{ os: "default", uri: monitorLink }],
      },
    ],
  };
}

/**
 * Builds a Microsoft Teams verification test alert.
 */
export function buildTeamsTestMessage(data: TestAlertData): Record<string, unknown> {
  return {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor: "6366F1",
    summary: `Microsoft Teams Integration Verified: ${data.workspaceName}`,
    title: "✅ Microsoft Teams Channel Verified!",
    sections: [
      {
        activityTitle: "Duesora Webhook Connected",
        activitySubtitle: `Channel: ${data.channelName} • Workspace: ${data.workspaceName}`,
        text: `Your Microsoft Teams webhook is successfully verified and ready to receive renewal and SSL health alerts!`,
        facts: [
          { name: "Workspace:", value: data.workspaceName },
          { name: "Channel:", value: data.channelName },
          { name: "Verified By:", value: data.testedBy || "Workspace Administrator" },
        ],
        markdown: true,
      },
    ],
  };
}

/**
 * Builds a Microsoft Teams MessageCard for price change / rate shift alerts.
 */
export function buildTeamsPriceIncreaseMessage(data: PriceChangeAlertData): Record<string, unknown> {
  const isHike = data.changePercentage > 0;
  const themeColor = isHike ? "F43F5E" : "10B981";
  const emoji = isHike ? "📈" : "📉";
  const directionLabel = isHike ? "Price Increase Alert" : "Price Adjustment";
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

  const appUrl = getAppBaseUrl(data.appUrl);
  const resourceLink = `${appUrl}/resources/${data.resourceId}`;

  const facts: Array<{ name: string; value: string }> = [
    { name: "Resource:", value: data.resourceName },
    { name: "Rate Shift:", value: deltaLabel },
    { name: "Previous Cost:", value: prevStr },
    { name: "New Cost:", value: newStr },
  ];

  if (data.changeReason) {
    facts.push({ name: "Reason:", value: data.changeReason });
  }
  if (data.changedByName) {
    facts.push({ name: "Updated By:", value: data.changedByName });
  }

  return {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor,
    summary: `${emoji} ${directionLabel}: ${data.resourceName} (${deltaLabel})`,
    title: `${emoji} ${directionLabel}: ${data.resourceName}`,
    sections: [
      {
        activityTitle: `Cost Rate Change Detected`,
        activitySubtitle: `${data.resourceName} shifted by ${deltaLabel}`,
        text: `A price change was recorded for **${data.resourceName}**. Review the details and impact below.`,
        facts,
        markdown: true,
      },
    ],
    potentialAction: [
      {
        "@type": "OpenUri",
        name: "View Cost History",
        targets: [{ os: "default", uri: resourceLink }],
      },
    ],
  };
}

/**
 * Dispatches payload to Microsoft Teams incoming webhook.
 */
export async function sendTeamsWebhook(
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

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return {
        success: false,
        statusCode: response.status,
        error: `Microsoft Teams rejected delivery (${response.status}): ${errText || response.statusText}`,
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
            ? "Microsoft Teams delivery timed out (5s limit)"
            : err.message
          : "Network request to Microsoft Teams failed",
    };
  }
}
