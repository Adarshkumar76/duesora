import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildTelegramRenewalMessage,
  buildTelegramMonitorMessage,
  buildTelegramTestMessage,
  buildTelegramPriceIncreaseMessage,
  sendTelegramWebhook,
} from "@/lib/integrations/chat/telegram";
import {
  buildTeamsRenewalMessage,
  buildTeamsMonitorMessage,
  buildTeamsTestMessage,
  buildTeamsPriceIncreaseMessage,
  sendTeamsWebhook,
} from "@/lib/integrations/chat/teams";
import {
  isValidTelegramWebhookUrl,
  isValidTeamsWebhookUrl,
  createNotificationChannelSchema,
} from "@/lib/integrations/chat/validation";

describe("Telegram Chat Formatter", () => {
  const sampleRenewal = {
    resourceId: "res-123",
    resourceName: "Acme Cloud Hosting",
    resourceType: "hosting",
    provider: "AWS",
    daysRemaining: 5,
    renewalDate: "2026-10-15T00:00:00.000Z",
    amountMinor: 4999,
    currency: "USD",
    billingCycle: "monthly",
    workspaceName: "Production",
    appUrl: "https://app.duesora.com",
    isEscalated: false,
  };

  it("formats upcoming renewal alert in HTML with link", () => {
    const payload = buildTelegramRenewalMessage(sampleRenewal);
    expect(payload.parse_mode).toBe("HTML");
    expect(payload.disable_web_page_preview).toBe(true);

    const text = payload.text as string;
    expect(text).toContain("Upcoming Renewal: Acme Cloud Hosting");
    expect(text).toContain("Renews in 5 days");
    expect(text).toContain("$49.99 / monthly");
    expect(text).toContain("https://app.duesora.com/resources/res-123");
    expect(text).not.toContain("[ESCALATION]");
  });

  it("formats escalated renewal with warning notice", () => {
    const escalatedPayload = buildTelegramRenewalMessage({
      ...sampleRenewal,
      daysRemaining: 1,
      isEscalated: true,
    });

    const text = escalatedPayload.text as string;
    expect(text).toContain("<b>[ESCALATION]</b>");
    expect(text).toContain("🚨");
    expect(text).toContain("Renews tomorrow");
    expect(text).toContain("escalated to workspace administrators");
  });

  it("formats monitor health degradation and recovery", () => {
    const degraded = buildTelegramMonitorMessage({
      resourceId: "res-tls",
      resourceName: "api.duesora.com",
      hostname: "api.duesora.com",
      status: "critical",
      alertReason: "degraded",
      daysRemaining: 3,
      issuer: "Let's Encrypt",
      latencyMs: 120,
      workspaceName: "Production",
    });

    const degradedText = degraded.text as string;
    expect(degradedText).toContain("🔴");
    expect(degradedText).toContain("CRITICAL");
    expect(degradedText).toContain("api.duesora.com");
    expect(degradedText).toContain("3 days remaining");

    const recovered = buildTelegramMonitorMessage({
      resourceId: "res-tls",
      resourceName: "api.duesora.com",
      hostname: "api.duesora.com",
      status: "healthy",
      alertReason: "recovered",
      workspaceName: "Production",
    });

    const recoveredText = recovered.text as string;
    expect(recoveredText).toContain("🟢");
    expect(recoveredText).toContain("Health Check Recovered");
  });

  it("formats test verification message", () => {
    const testMsg = buildTelegramTestMessage({
      workspaceName: "Acme Corp",
      channelName: "@acme_devops",
      testedBy: "Alice",
      provider: "telegram",
    });

    const text = testMsg.text as string;
    expect(text).toContain("Telegram Alert Integration Verified!");
    expect(text).toContain("Acme Corp");
    expect(text).toContain("@acme_devops");
  });

  it("formats price increase alert in HTML with delta and link", () => {
    const payload = buildTelegramPriceIncreaseMessage({
      resourceId: "res-tg",
      resourceName: "Notion Enterprise",
      previousAmountMinor: 1000,
      newAmountMinor: 1500,
      currency: "USD",
      previousBillingCycle: "monthly",
      newBillingCycle: "monthly",
      changePercentage: 50,
      changeReason: "Tier upgrade",
      changedByName: "Admin User",
      workspaceName: "Engineering",
      appUrl: "https://app.duesora.com",
    });

    expect(payload.parse_mode).toBe("HTML");
    const text = payload.text as string;
    expect(text).toContain("📈");
    expect(text).toContain("Price Increase Alert: Notion Enterprise");
    expect(text).toContain("+50%");
    expect(text).toContain("$10.00 / monthly");
    expect(text).toContain("$15.00 / monthly");
    expect(text).toContain("Tier upgrade");
    expect(text).toContain("Admin User");
    expect(text).toContain("https://app.duesora.com/resources/res-tg");
  });
});

describe("Microsoft Teams MessageCard Formatter", () => {
  const sampleRenewal = {
    resourceId: "res-ms",
    resourceName: "Microsoft 365 Enterprise",
    resourceType: "subscription",
    provider: "Microsoft",
    daysRemaining: 2,
    renewalDate: "2026-10-20T00:00:00.000Z",
    amountMinor: 15000,
    currency: "USD",
    billingCycle: "monthly",
    workspaceName: "Enterprise IT",
    appUrl: "https://app.duesora.com",
    isEscalated: true,
  };

  it("formats escalated renewal as high-priority crimson MessageCard", () => {
    const payload = buildTeamsRenewalMessage(sampleRenewal);

    expect(payload["@type"]).toBe("MessageCard");
    expect(payload.themeColor).toBe("F43F5E"); // Crimson for escalated
    expect(payload.title).toContain("[ESCALATION]");
    expect(payload.title).toContain("Microsoft 365 Enterprise");

    const sections = payload.sections as Array<Record<string, unknown>>;
    expect(sections[0].text).toContain("Urgent Escalation");

    const potentialAction = payload.potentialAction as Array<{
      targets: Array<{ uri: string }>;
    }>;
    expect(potentialAction[0].targets[0].uri).toBe("https://app.duesora.com/resources/res-ms");
  });

  it("formats monitor degradation and recovery with theme colors", () => {
    const degraded = buildTeamsMonitorMessage({
      resourceId: "res-mon",
      resourceName: "portal.example.com",
      hostname: "portal.example.com",
      status: "critical",
      alertReason: "degraded",
      daysRemaining: 2,
      issuer: "DigiCert",
      latencyMs: 95,
      workspaceName: "Core Ops",
    });

    expect(degraded.themeColor).toBe("F43F5E");
    expect(degraded.title).toContain("CRITICAL");

    const recovered = buildTeamsMonitorMessage({
      resourceId: "res-mon",
      resourceName: "portal.example.com",
      hostname: "portal.example.com",
      status: "healthy",
      alertReason: "recovered",
      workspaceName: "Core Ops",
    });

    expect(recovered.themeColor).toBe("10B981");
    expect(recovered.title).toContain("Health Check Recovered");
  });

  it("formats test verification MessageCard", () => {
    const testMsg = buildTeamsTestMessage({
      workspaceName: "Tech Corp",
      channelName: "IT Operations",
      testedBy: "Bob",
      provider: "teams",
    });

    expect(testMsg["@type"]).toBe("MessageCard");
    expect(testMsg.themeColor).toBe("6366F1");
    expect(testMsg.title).toContain("Microsoft Teams Channel Verified");
  });

  it("formats price increase MessageCard with crimson theme and facts", () => {
    const payload = buildTeamsPriceIncreaseMessage({
      resourceId: "res-teams",
      resourceName: "Datadog Pro",
      previousAmountMinor: 5000,
      newAmountMinor: 6500,
      currency: "USD",
      previousBillingCycle: "monthly",
      newBillingCycle: "monthly",
      changePercentage: 30,
      changeReason: "Added hosts",
      changedByName: "Ops Lead",
      workspaceName: "Core Ops",
      appUrl: "https://app.duesora.com",
    });

    expect(payload["@type"]).toBe("MessageCard");
    expect(payload.themeColor).toBe("F43F5E");
    expect(payload.title).toContain("📈 Price Increase Alert: Datadog Pro");

    const sections = payload.sections as Array<Record<string, unknown>>;
    expect(sections[0].activitySubtitle).toContain("shifted by +30%");

    const potentialAction = payload.potentialAction as Array<{
      targets: Array<{ uri: string }>;
    }>;
    expect(potentialAction[0].targets[0].uri).toBe("https://app.duesora.com/resources/res-teams");
  });
});

describe("URL Validation for Telegram & Teams", () => {
  it("validates Telegram bot webhook URLs", () => {
    expect(
      isValidTelegramWebhookUrl("https://api.telegram.org/bot123456:ABC-DEF/sendMessage?chat_id=987654")
    ).toBe(true);
    expect(
      isValidTelegramWebhookUrl("https://custom-telegram-relay.com/webhook")
    ).toBe(true);
    expect(isValidTelegramWebhookUrl("http://api.telegram.org/bot12345/sendMessage")).toBe(false); // must be https
    expect(isValidTelegramWebhookUrl("not-a-url")).toBe(false);
  });

  it("validates Microsoft Teams webhook URLs", () => {
    expect(
      isValidTeamsWebhookUrl("https://outlook.office.com/webhook/xxxx@yyyy/IncomingWebhook/zzzz")
    ).toBe(true);
    expect(
      isValidTeamsWebhookUrl("https://tenant.webhook.office.com/webhookb2/xxxx")
    ).toBe(true);
    expect(
      isValidTeamsWebhookUrl("https://prod-01.logic.azure.com/workflows/xxxx")
    ).toBe(true);
    expect(
      isValidTeamsWebhookUrl("https://untrusted-site.com/webhook")
    ).toBe(false);
    expect(
      isValidTeamsWebhookUrl("http://outlook.office.com/webhook/test")
    ).toBe(false); // http rejected
  });

  it("validates schema parsing for Telegram and Teams channels", () => {
    const validTelegram = createNotificationChannelSchema.safeParse({
      provider: "telegram",
      name: "@my_bot",
      webhookUrl: "https://api.telegram.org/bot12345:TOKEN/sendMessage?chat_id=123",
      events: ["reminder.upcoming"],
      active: true,
    });
    expect(validTelegram.success).toBe(true);

    const validTeams = createNotificationChannelSchema.safeParse({
      provider: "teams",
      name: "DevOps Alerts",
      webhookUrl: "https://outlook.office.com/webhook/123/IncomingWebhook/456",
      events: ["reminder.upcoming", "reminder.overdue"],
      active: true,
    });
    expect(validTeams.success).toBe(true);
  });
});

describe("Webhook Network Dispatchers (Telegram & Teams)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sendTelegramWebhook sends POST with payload and extracted chat_id", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve("ok"),
    } as Response);

    const result = await sendTelegramWebhook(
      "https://api.telegram.org/bot123:TOKEN/sendMessage?chat_id=777888",
      { text: "Hello Telegram" }
    );

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.telegram.org/bot123:TOKEN/sendMessage?chat_id=777888",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ text: "Hello Telegram", chat_id: "777888" }),
      })
    );
  });

  it("sendTeamsWebhook sends POST with MessageCard payload", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve("1"),
    } as Response);

    const result = await sendTeamsWebhook(
      "https://outlook.office.com/webhook/abc/IncomingWebhook/xyz",
      { "@type": "MessageCard", title: "Test" }
    );

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://outlook.office.com/webhook/abc/IncomingWebhook/xyz",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ "@type": "MessageCard", title: "Test" }),
      })
    );
  });
});
