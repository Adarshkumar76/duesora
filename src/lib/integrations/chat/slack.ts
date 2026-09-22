import type { RenewalAlertData, MonitorAlertData, TestAlertData } from "./types";

const TIMEOUT_MS = 5000;

export function buildSlackRenewalMessage(data: RenewalAlertData): Record<string, unknown> {
  const isOverdue = data.daysRemaining <= 0;
  const statusEmoji = isOverdue ? "🚨" : data.daysRemaining <= 7 ? "⚠️" : "🔔";
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

  return {
    text: `${statusEmoji} Renewal Alert: ${data.resourceName} (${statusLabel})`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${statusEmoji} ${isOverdue ? "Renewal Overdue" : "Upcoming Renewal"}: ${data.resourceName}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Type:*\n${data.resourceType || "Asset"}`,
          },
          {
            type: "mrkdwn",
            text: `*Status:*\n*${statusLabel}*`,
          },
          {
            type: "mrkdwn",
            text: `*Due Date:*\n${dateStr}`,
          },
          {
            type: "mrkdwn",
            text: `*Amount:*\n${amountStr}`,
          },
        ],
      },
      ...(data.provider
        ? [
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Provider / Registrar:*\n${data.provider}`,
                },
                {
                  type: "mrkdwn",
                  text: `*Workspace:*\n${data.workspaceName || "Duesora"}`,
                },
              ],
            },
          ]
        : []),
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Manage Resource in Duesora",
              emoji: true,
            },
            url: resourceLink,
            style: isOverdue ? "danger" : "primary",
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Duesora Asset Tracker • ${data.workspaceName || "Personal Workspace"}`,
          },
        ],
      },
    ],
  };
}

export function buildSlackMonitorMessage(data: MonitorAlertData): Record<string, unknown> {
  const isRecovery = data.alertReason === "recovered";
  const statusEmoji = isRecovery ? "🟢" : data.status === "critical" || data.status === "error" ? "🔴" : "⚠️";
  const statusTitle = isRecovery ? "SSL Certificate Recovered" : "SSL Health Alert";

  const appUrl = data.appUrl || "http://localhost:3000";
  const resourceLink = `${appUrl}/resources/${data.resourceId}`;

  return {
    text: `${statusEmoji} ${statusTitle}: ${data.resourceName} is ${data.status.toUpperCase()}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${statusEmoji} ${statusTitle}: ${data.hostname || data.resourceName}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Status:*\n*${data.status.toUpperCase()}*`,
          },
          {
            type: "mrkdwn",
            text: `*Days Remaining:*\n${data.daysRemaining !== null && data.daysRemaining !== undefined ? `${data.daysRemaining} days` : "Unknown"}`,
          },
          {
            type: "mrkdwn",
            text: `*Issuer:*\n${data.issuer || "Unknown"}`,
          },
          {
            type: "mrkdwn",
            text: `*Latency:*\n${data.latencyMs ? `${data.latencyMs}ms` : "—"}`,
          },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Certificate Monitor",
              emoji: true,
            },
            url: resourceLink,
            style: isRecovery ? "primary" : "danger",
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Duesora Health Monitor • ${data.workspaceName || "Duesora"}`,
          },
        ],
      },
    ],
  };
}

export function buildSlackTestMessage(data: TestAlertData): Record<string, unknown> {
  return {
    text: "✅ Duesora Test Notification: Slack webhook is connected successfully!",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "✅ Slack Alert Integration Connected",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Your Slack webhook for *${data.workspaceName}* (*${data.channelName}*) is successfully verified and ready to receive renewal and SSL health alerts!`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Sent by ${data.testedBy || "Workspace Administrator"} • Duesora Team Alerts`,
          },
        ],
      },
    ],
  };
}

export async function sendSlackWebhook(
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
        error: `Slack rejected delivery (${response.status}): ${errText || response.statusText}`,
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
            ? "Slack delivery timed out (5s limit)"
            : err.message
          : "Network request to Slack failed",
    };
  }
}
