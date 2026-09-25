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

export function isValidNtfyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    // Must contain a topic name in pathname (e.g. /my_topic)
    const topic = parsed.pathname.replace(/^\/+|\/+$/g, "");
    return topic.length > 0;
  } catch {
    return false;
  }
}

export function isValidGotifyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    return parsed.searchParams.has("token") && parsed.pathname.includes("/message");
  } catch {
    return false;
  }
}

export const createNotificationChannelSchema = z
  .object({
    provider: z.enum(["slack", "discord", "telegram", "teams", "ntfy", "gotify"], {
      message: "Provider must be 'slack', 'discord', 'telegram', 'teams', 'ntfy', or 'gotify'",
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

    if (data.provider === "ntfy" && !isValidNtfyUrl(data.webhookUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["webhookUrl"],
        message:
          "Invalid ntfy URL. It must be an HTTP/HTTPS URL with a target topic path (e.g. https://ntfy.sh/my_topic)",
      });
    }

    if (data.provider === "gotify" && !isValidGotifyUrl(data.webhookUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["webhookUrl"],
        message:
          "Invalid Gotify URL. It must be an HTTP/HTTPS message URL with an app token (e.g. https://gotify.example.com/message?token=XYZ)",
      });
    }
  });

export const updateNotificationChannelSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  events: z.array(z.string()).min(1).optional(),
  active: z.boolean().optional(),
});
