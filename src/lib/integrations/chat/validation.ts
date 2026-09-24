import { z } from "zod";

export const ALLOWED_CHAT_EVENTS = [
  "reminder.upcoming",
  "reminder.overdue",
  "monitor.degraded",
  "monitor.recovered",
  "resource.price_changed",
] as const;

export function isValidSlackWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "hooks.slack.com" &&
      parsed.pathname.startsWith("/services/")
    );
  } catch {
    return false;
  }
}

export function isValidDiscordWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "discord.com" || parsed.hostname === "discordapp.com") &&
      parsed.pathname.startsWith("/api/webhooks/")
    );
  } catch {
    return false;
  }
}

export function isValidTelegramWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (parsed.hostname === "api.telegram.org") {
      return parsed.pathname.startsWith("/bot");
    }
    // Allow custom secure webhook relays/proxies
    return true;
  } catch {
    return false;
  }
}

export function isValidTeamsWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host.endsWith(".office.com") ||
      host.endsWith(".office365.com") ||
      host.endsWith(".logic.azure.com") ||
      host.endsWith(".microsoft.com")
    );
  } catch {
    return false;
  }
}

export const createNotificationChannelSchema = z
  .object({
    provider: z.enum(["slack", "discord", "telegram", "teams"], {
      message: "Provider must be 'slack', 'discord', 'telegram', or 'teams'",
    }),
    name: z.string().trim().min(1, "Name is required").max(100, "Name must be <= 100 characters"),
    webhookUrl: z.string().trim().url("Must be a valid URL"),
    events: z
      .array(z.string())
      .min(1, "At least one event must be selected")
      .default([...ALLOWED_CHAT_EVENTS]),
    active: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.provider === "slack" && !isValidSlackWebhookUrl(data.webhookUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["webhookUrl"],
        message: "Invalid Slack Webhook URL. It must start with https://hooks.slack.com/services/",
      });
    }

    if (data.provider === "discord" && !isValidDiscordWebhookUrl(data.webhookUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["webhookUrl"],
        message: "Invalid Discord Webhook URL. It must start with https://discord.com/api/webhooks/",
      });
    }

    if (data.provider === "telegram" && !isValidTelegramWebhookUrl(data.webhookUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["webhookUrl"],
        message:
          "Invalid Telegram Webhook URL. It must be an HTTPS URL (e.g. https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<ID>)",
      });
    }

    if (data.provider === "teams" && !isValidTeamsWebhookUrl(data.webhookUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["webhookUrl"],
        message:
          "Invalid Microsoft Teams Webhook URL. It must be a valid HTTPS webhook ending in .office.com, .logic.azure.com, or .microsoft.com",
      });
    }
  });

export const updateNotificationChannelSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  events: z.array(z.string()).min(1).optional(),
  active: z.boolean().optional(),
});
