import type {
  RenewalAlertData,
  MonitorAlertData,
  TestAlertData,
  PriceChangeAlertData,
} from "./types";
import { formatCurrencyMinor } from "@/lib/currency/rates";
import { getAppBaseUrl } from "@/lib/url";

export function buildNtfyRenewalPayload(data: RenewalAlertData): Record<string, unknown> {
  const amountStr =
    data.amountMinor !== null && data.amountMinor !== undefined
      ? formatCurrencyMinor(data.amountMinor, data.currency || "USD")
      : null;

  const dateStr = data.renewalDate
    ? new Date(data.renewalDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const title = `Renewal Alert: ${data.resourceName} (${data.daysRemaining}d left)`;
  let message = `Resource "${data.resourceName}" in workspace "${data.workspaceName || "Duesora"}" is due for renewal.`;
  if (dateStr) message += `\nRenews: ${dateStr}`;
  if (amountStr) message += `\nCost: ${amountStr}`;

  const isUrgent = data.daysRemaining <= 3;
  const appUrl = getAppBaseUrl(data.appUrl);
  const actions = [
    {
      action: "view",
      label: "View in Duesora",
      url: `${appUrl}/resources/${data.resourceId}`,
    },
  ];

  return {
    title,
    message,
    priority: isUrgent ? 5 : 3,
    tags: isUrgent ? ["rotating_light", "warning"] : ["calendar", "hourglass_flowing_sand"],
    actions,
    click: `${appUrl}/resources/${data.resourceId}`,
  };
}
export const buildNtfyRenewalMessage = buildNtfyRenewalPayload;

export function buildNtfyMonitorPayload(data: MonitorAlertData): Record<string, unknown> {
  const isRecovered = data.alertReason === "recovered";
  const isCritical = data.status === "critical";

  const title = isRecovered
    ? `Health Recovered: ${data.resourceName}`
    : isCritical
    ? `CRITICAL SSL Degradation: ${data.resourceName}`
    : `SSL Health Warning: ${data.resourceName}`;

  const message = isRecovered
    ? `Service "${data.resourceName}" (${data.hostname || ""}) has returned to a healthy state.`
    : `Service "${data.resourceName}" reported status "${data.status}". Attention required.`;

  return {
    title,
    message,
    priority: isRecovered ? 2 : isCritical ? 5 : 4,
    tags: isRecovered ? ["white_check_mark", "shield"] : isCritical ? ["rotating_light", "x"] : ["warning"],
    click: data.appUrl ? `${data.appUrl}/resources/${data.resourceId}` : undefined,
  };
}
export const buildNtfyMonitorMessage = buildNtfyMonitorPayload;

export function buildNtfyPriceIncreasePayload(data: PriceChangeAlertData): Record<string, unknown> {
  const oldStr =
    data.previousAmountMinor !== null && data.previousAmountMinor !== undefined
      ? formatCurrencyMinor(data.previousAmountMinor, data.currency)
      : "—";
  const newStr = formatCurrencyMinor(data.newAmountMinor, data.currency);

  return {
    title: `Price Increase: ${data.resourceName} (+${data.changePercentage}%)`,
    message: `Recurring rate for "${data.resourceName}" changed from ${oldStr} to ${newStr}.`,
    priority: 3,
    tags: ["chart_with_upwards_trend", "moneybag"],
    click: data.appUrl ? `${data.appUrl}/resources/${data.resourceId}` : undefined,
  };
}
export const buildNtfyPriceIncreaseMessage = buildNtfyPriceIncreasePayload;

export function buildNtfyTestPayload(data: TestAlertData): Record<string, unknown> {
  return {
    title: `ntfy Alert Integration Connected: ${data.workspaceName}`,
    message: `Test alert dispatched successfully to topic "${data.channelName}" by ${data.testedBy || "Administrator"}.`,
    priority: 3,
    tags: ["bell", "tada"],
  };
}
export const buildNtfyTestMessage = buildNtfyTestPayload;

export async function sendNtfyNotification(
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
        error: `ntfy rejected notification (${response.status}): ${errorText.slice(0, 150)}`,
      };
    }

    return {
      success: true,
      statusCode: response.status,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error contacting ntfy server",
    };
  }
}
