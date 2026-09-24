import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isValidSlackWebhookUrl,
  isValidDiscordWebhookUrl,
  isValidNtfyUrl,
  isValidGotifyUrl,
  createNotificationChannelSchema,
} from "@/lib/integrations/chat/validation";
import {
  buildSlackRenewalMessage,
  buildSlackMonitorMessage,
  buildSlackTestMessage,
  sendSlackWebhook,
} from "@/lib/integrations/chat/slack";
import {
  buildDiscordRenewalEmbed,
  buildDiscordMonitorEmbed,
  buildDiscordTestEmbed,
  sendDiscordWebhook,
} from "@/lib/integrations/chat/discord";
import {
  buildNtfyRenewalPayload,
  buildNtfyMonitorPayload,
  buildNtfyTestPayload,
  sendNtfyNotification,
} from "@/lib/integrations/chat/ntfy";
import {
  buildGotifyRenewalPayload,
  buildGotifyMonitorPayload,
  buildGotifyTestPayload,
  sendGotifyNotification,
} from "@/lib/integrations/chat/gotify";

describe("Chat Integrations Formatters & Webhook Delivery", () => {
  describe("URL Validation Helpers", () => {
    it("validates Slack webhook URLs correctly", () => {
      expect(isValidSlackWebhookUrl("https://hooks.slack.com/services/T0123/B0123/XYZ789")).toBe(true);
      expect(isValidSlackWebhookUrl("http://hooks.slack.com/services/T0123/B0123/XYZ789")).toBe(false);
      expect(isValidSlackWebhookUrl("https://evil.slack.com/services/T0123/B0123/XYZ789")).toBe(false);
      expect(isValidSlackWebhookUrl("https://hooks.slack.com/other/path")).toBe(false);
      expect(isValidSlackWebhookUrl("invalid-url")).toBe(false);
    });

    it("validates Discord webhook URLs correctly", () => {
      expect(isValidDiscordWebhookUrl("https://discord.com/api/webhooks/123456789/abcdef")).toBe(true);
      expect(isValidDiscordWebhookUrl("https://discordapp.com/api/webhooks/123456789/abcdef")).toBe(true);
      expect(isValidDiscordWebhookUrl("http://discord.com/api/webhooks/123456789/abcdef")).toBe(false);
      expect(isValidDiscordWebhookUrl("https://evil.com/api/webhooks/123456789/abcdef")).toBe(false);
      expect(isValidDiscordWebhookUrl("invalid-url")).toBe(false);
    });

    it("validates ntfy URLs correctly", () => {
      expect(isValidNtfyUrl("https://ntfy.sh/my_topic")).toBe(true);
      expect(isValidNtfyUrl("http://ntfy.sh/my_topic")).toBe(true);
      expect(isValidNtfyUrl("https://ntfy.internal.company.com/alerts")).toBe(true);
      expect(isValidNtfyUrl("https://ntfy.sh/")).toBe(false);
      expect(isValidNtfyUrl("not-a-url")).toBe(false);
    });

    it("validates Gotify URLs correctly", () => {
      expect(isValidGotifyUrl("https://gotify.example.com/message?token=A1B2C3D4")).toBe(true);
      expect(isValidGotifyUrl("http://localhost:8080/message?token=xyz")).toBe(true);
      expect(isValidGotifyUrl("https://gotify.example.com/message")).toBe(false);
      expect(isValidGotifyUrl("not-a-url")).toBe(false);
    });

    it("enforces valid provider URL in createNotificationChannelSchema", () => {
      const validSlack = createNotificationChannelSchema.safeParse({
        provider: "slack",
        name: "#alerts",
        webhookUrl: "https://hooks.slack.com/services/T00/B00/ABC",
      });
      expect(validSlack.success).toBe(true);

      const invalidSlack = createNotificationChannelSchema.safeParse({
        provider: "slack",
        name: "#alerts",
        webhookUrl: "https://discord.com/api/webhooks/123/abc",
      });
      expect(invalidSlack.success).toBe(false);

      const validDiscord = createNotificationChannelSchema.safeParse({
        provider: "discord",
        name: "#devops",
        webhookUrl: "https://discord.com/api/webhooks/12345/abcdef",
      });
      expect(validDiscord.success).toBe(true);

      const invalidDiscord = createNotificationChannelSchema.safeParse({
        provider: "discord",
        name: "#devops",
        webhookUrl: "https://hooks.slack.com/services/T00/B00/ABC",
      });
      expect(invalidDiscord.success).toBe(false);
    });
  });

  describe("Slack Block Kit Formatters", () => {
    it("builds a rich Slack renewal message with blocks", () => {
      const msg = buildSlackRenewalMessage({
        resourceId: "res-123",
        resourceName: "api.duesora.com",
        resourceType: "domain",
        provider: "Cloudflare",
        daysRemaining: 7,
        renewalDate: new Date("2026-10-01"),
        amountMinor: 1400,
        currency: "USD",
        billingCycle: "yearly",
        workspaceName: "Acme Corp",
      });

      expect(msg.text).toContain("Renewal Alert: api.duesora.com");
      expect(Array.isArray(msg.blocks)).toBe(true);
      const blocks = msg.blocks as Array<{ type: string; [key: string]: unknown }>;
      expect(blocks.some((b) => b.type === "header")).toBe(true);
      expect(blocks.some((b) => b.type === "actions")).toBe(true);
    });

    it("builds a Slack monitor degradation message", () => {
      const msg = buildSlackMonitorMessage({
        resourceId: "res-123",
        resourceName: "api.duesora.com",
        hostname: "api.duesora.com",
        status: "critical",
        alertReason: "degraded",
        daysRemaining: 5,
        issuer: "Let's Encrypt",
        latencyMs: 142,
        workspaceName: "Acme Corp",
      });

      expect(msg.text).toContain("SSL Health Alert");
      expect(msg.text).toContain("CRITICAL");
    });

    it("builds a Slack test message", () => {
      const msg = buildSlackTestMessage({
        workspaceName: "Acme Corp",
        channelName: "#alerts",
        provider: "slack",
        testedBy: "Admin",
      });

      expect(msg.text).toContain("Test Notification");
    });
  });

  describe("Discord Embed Formatters", () => {
    it("builds a rich Discord renewal embed with color coding", () => {
      const embedPayload = buildDiscordRenewalEmbed({
        resourceId: "res-123",
        resourceName: "github.com",
        resourceType: "subscription",
        provider: "GitHub Inc",
        daysRemaining: 1,
        renewalDate: new Date("2026-10-02"),
        amountMinor: 2100,
        currency: "USD",
        billingCycle: "monthly",
        workspaceName: "Acme Corp",
      });

      expect(embedPayload.username).toBe("Duesora Alerts");
      const embeds = embedPayload.embeds as Array<{ title: string; color: number; fields: unknown[] }>;
      expect(embeds).toHaveLength(1);
      expect(embeds[0].color).toBe(0xf59e0b); // amber warning for 1 day
      expect(embeds[0].title).toContain("github.com");
    });

    it("builds a Discord monitor recovery embed", () => {
      const embedPayload = buildDiscordMonitorEmbed({
        resourceId: "res-123",
        resourceName: "duesora.com",
        hostname: "duesora.com",
        status: "healthy",
        alertReason: "recovered",
        daysRemaining: 90,
        issuer: "Cloudflare Inc",
        latencyMs: 38,
      });

      const embeds = embedPayload.embeds as Array<{ title: string; color: number }>;
      expect(embeds[0].color).toBe(0x10b981); // green for recovery
      expect(embeds[0].title).toContain("SSL Certificate Recovered");
    });

    it("builds a Discord test embed", () => {
      const embedPayload = buildDiscordTestEmbed({
        workspaceName: "Acme Corp",
        channelName: "#devops",
        provider: "discord",
      });

      const embeds = embedPayload.embeds as Array<{ title: string; color: number }>;
      expect(embeds[0].title).toContain("Discord Alert Integration Connected");
      expect(embeds[0].color).toBe(0x10b981);
    });
  });

  describe("ntfy Payload Formatters", () => {
    it("builds a rich ntfy renewal message with priority and tags", () => {
      const payload = buildNtfyRenewalPayload({
        resourceId: "res-123",
        resourceName: "api.duesora.com",
        resourceType: "domain",
        provider: "Cloudflare",
        daysRemaining: 1,
        renewalDate: new Date("2026-10-01"),
        amountMinor: 1400,
        currency: "USD",
        billingCycle: "yearly",
        workspaceName: "Acme Corp",
      });

      expect(payload.title).toContain("Renewal Alert: api.duesora.com");
      expect(payload.priority).toBe(5);
      expect(payload.tags).toContain("rotating_light");
      expect(payload.message).toContain("Renews: Oct 1, 2026");
      expect(payload.actions).toHaveLength(1);
    });

    it("builds a ntfy monitor degraded payload", () => {
      const payload = buildNtfyMonitorPayload({
        resourceId: "res-123",
        resourceName: "api.duesora.com",
        hostname: "api.duesora.com",
        status: "critical",
        alertReason: "degraded",
        daysRemaining: 5,
        issuer: "Let's Encrypt",
        latencyMs: 142,
        workspaceName: "Acme Corp",
      });

      expect(payload.title).toContain("CRITICAL SSL Degradation");
      expect(payload.priority).toBe(5);
      expect(payload.tags).toContain("x");
    });

    it("builds a ntfy test message", () => {
      const payload = buildNtfyTestPayload({
        workspaceName: "Acme Corp",
        channelName: "duesora-alerts",
        provider: "ntfy",
        testedBy: "Admin",
      });

      expect(payload.title).toContain("ntfy Alert Integration Connected");
      expect(payload.priority).toBe(3);
    });
  });

  describe("Gotify Payload Formatters", () => {
    it("builds a Gotify renewal payload with markdown formatting", () => {
      const payload = buildGotifyRenewalPayload({
        resourceId: "res-123",
        resourceName: "duesora-prod-cluster",
        resourceType: "server",
        provider: "AWS",
        daysRemaining: 0,
        renewalDate: new Date("2026-10-01"),
        amountMinor: 12000,
        currency: "USD",
        billingCycle: "monthly",
        workspaceName: "Acme Corp",
      });

      expect(payload.title).toContain("OVERDUE Renewal");
      expect(payload.priority).toBe(9);
      const extras = payload.extras as Record<string, Record<string, unknown>> | undefined;
      expect(extras?.["client::display"]?.contentType).toBe("text/markdown");
    });

    it("builds a Gotify monitor degraded payload", () => {
      const payload = buildGotifyMonitorPayload({
        resourceId: "res-123",
        resourceName: "api.duesora.com",
        hostname: "api.duesora.com",
        status: "critical",
        alertReason: "degraded",
        daysRemaining: 3,
        latencyMs: 120,
      });

      expect(payload.title).toContain("Service Degraded");
      expect(payload.priority).toBe(8);
      expect(payload.message).toContain("120ms");
    });

    it("builds a Gotify test payload", () => {
      const payload = buildGotifyTestPayload({
        workspaceName: "Acme Corp",
        channelName: "gotify-server",
        provider: "gotify",
      });

      expect(payload.title).toContain("Gotify Alert Integration Connected");
      expect(payload.priority).toBe(5);
    });
  });

  describe("Webhook Dispatch Network Delivery", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("delivers Slack webhook successfully on 200 OK", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve("ok"),
      } as unknown as Response);

      const res = await sendSlackWebhook("https://hooks.slack.com/services/T00/B00/XYZ", { text: "hello" });
      expect(res.success).toBe(true);
      expect(res.statusCode).toBe(200);
    });

    it("handles Slack rejection gracefully", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve("channel_not_found"),
      } as unknown as Response);

      const res = await sendSlackWebhook("https://hooks.slack.com/services/T00/B00/XYZ", { text: "hello" });
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(404);
      expect(res.error).toContain("Slack rejected delivery");
    });

    it("delivers Discord webhook successfully on 204 No Content", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        text: () => Promise.resolve(""),
      } as unknown as Response);

      const res = await sendDiscordWebhook("https://discord.com/api/webhooks/123/xyz", { content: "hello" });
      expect(res.success).toBe(true);
      expect(res.statusCode).toBe(204);
    });

    it("delivers ntfy notification successfully on 200 OK", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"id":"123"}'),
      } as unknown as Response);

      const res = await sendNtfyNotification("https://ntfy.sh/test_topic", {
        message: "test message",
        title: "Test",
      });
      expect(res.success).toBe(true);
      expect(res.statusCode).toBe(200);
    });

    it("delivers Gotify notification successfully on 200 OK", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"id":1}'),
      } as unknown as Response);

      const res = await sendGotifyNotification("https://gotify.example.com/message?token=abc", {
        title: "Test",
        message: "Hello Gotify",
      });
      expect(res.success).toBe(true);
      expect(res.statusCode).toBe(200);
    });
  });
});
