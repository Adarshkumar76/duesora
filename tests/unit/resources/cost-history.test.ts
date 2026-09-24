import { describe, it, expect } from "vitest";
import { calculateCostChangeBps } from "@/lib/resources/cost-history";
import { buildSlackPriceIncreaseMessage } from "@/lib/integrations/chat/slack";
import { buildDiscordPriceIncreaseEmbed } from "@/lib/integrations/chat/discord";

describe("Cost History & Shift Calculations", () => {
  describe("calculateCostChangeBps", () => {
    it("calculates positive rate shift for same cadence increase", () => {
      // $100/mo to $125/mo = +25% = +2500 bps
      const bps = calculateCostChangeBps(10000, "monthly", 12500, "monthly");
      expect(bps).toBe(2500);
    });

    it("calculates negative rate shift for same cadence decrease", () => {
      // $100/mo to $80/mo = -20% = -2000 bps
      const bps = calculateCostChangeBps(10000, "monthly", 8000, "monthly");
      expect(bps).toBe(-2000);
    });

    it("accurately handles cadence normalization (monthly to yearly)", () => {
      // $10/mo to $120/yr is identical monthly cost ($10) = 0 bps
      const sameCostBps = calculateCostChangeBps(1000, "monthly", 12000, "yearly");
      expect(sameCostBps).toBe(0);

      // $10/mo to $150/yr: prev monthly is $10.00, new monthly is $12.50 = +25% = +2500 bps
      const increaseBps = calculateCostChangeBps(1000, "monthly", 15000, "yearly");
      expect(increaseBps).toBe(2500);

      // $120/yr to $10/mo is 0 bps
      const reverseBps = calculateCostChangeBps(12000, "yearly", 1000, "monthly");
      expect(reverseBps).toBe(0);
    });

    it("handles transition from free / zero to paid", () => {
      // Free ($0) to $25/mo = 100% initial addition = 10000 bps
      const bpsNull = calculateCostChangeBps(null, null, 2500, "monthly");
      expect(bpsNull).toBe(10000);

      const bpsZero = calculateCostChangeBps(0, "monthly", 2500, "monthly");
      expect(bpsZero).toBe(10000);
    });

    it("handles transition from paid to free / zero", () => {
      // $50/mo to $0 = -100% = -10000 bps
      const bps = calculateCostChangeBps(5000, "monthly", 0, "monthly");
      expect(bps).toBe(-10000);
    });

    it("returns 0 bps when both previous and new are zero/free", () => {
      const bps = calculateCostChangeBps(0, "monthly", 0, "monthly");
      expect(bps).toBe(0);
    });
  });

  describe("Slack Price Increase Formatter", () => {
    it("builds Slack message with danger button for price hikes", () => {
      const payload = buildSlackPriceIncreaseMessage({
        resourceId: "res-slack-1",
        resourceName: "GitHub Enterprise",
        previousAmountMinor: 2100,
        newAmountMinor: 2500,
        currency: "USD",
        previousBillingCycle: "monthly",
        newBillingCycle: "monthly",
        changePercentage: 19.05,
        changeReason: "Seat license increase",
        changedByName: "Security Admin",
        workspaceName: "DevOps Core",
        appUrl: "https://duesora.test",
      });

      expect(payload.text).toContain("📈 Price Increase Alert: GitHub Enterprise (+19.05%)");
      const blocks = payload.blocks as Array<Record<string, unknown>>;
      expect(blocks[0].type).toBe("header");

      // Verify actions button has danger style for hike
      const actionsBlock = blocks.find((b) => b.type === "actions");
      const elements = actionsBlock?.elements as Array<Record<string, unknown>>;
      expect(elements[0].style).toBe("danger");
      expect(elements[0].url).toBe("https://duesora.test/resources/res-slack-1");
    });

    it("builds Slack message with primary button for price reductions", () => {
      const payload = buildSlackPriceIncreaseMessage({
        resourceId: "res-slack-2",
        resourceName: "AWS Reserved Instance",
        previousAmountMinor: 10000,
        newAmountMinor: 7500,
        currency: "USD",
        previousBillingCycle: "monthly",
        newBillingCycle: "monthly",
        changePercentage: -25,
        appUrl: "https://duesora.test",
      });

      expect(payload.text).toContain("📉 Price Adjustment: AWS Reserved Instance (-25%)");
      const blocks = payload.blocks as Array<Record<string, unknown>>;
      const actionsBlock = blocks.find((b) => b.type === "actions");
      const elements = actionsBlock?.elements as Array<Record<string, unknown>>;
      expect(elements[0].style).toBe("primary");
    });
  });

  describe("Discord Price Increase Formatter", () => {
    it("builds Discord embed with crimson color and fields for price hike", () => {
      const payload = buildDiscordPriceIncreaseEmbed({
        resourceId: "res-discord-1",
        resourceName: "Datadog APM",
        resourceType: "subscription",
        previousAmountMinor: 4000,
        newAmountMinor: 5200,
        currency: "USD",
        previousBillingCycle: "monthly",
        newBillingCycle: "monthly",
        changePercentage: 30,
        changeReason: "Additional cluster telemetry",
        changedByName: "Lead Architect",
        workspaceName: "Platform Workspace",
        appUrl: "https://duesora.test",
      });

      expect(payload.username).toBe("Duesora Cost Intelligence");
      const embeds = payload.embeds as Array<Record<string, unknown>>;
      expect(embeds[0].color).toBe(0xef4444); // Crimson
      expect(embeds[0].title).toContain("📈 Price Increase Alert: Datadog APM (+30%)");
      expect(embeds[0].url).toBe("https://duesora.test/resources/res-discord-1");
    });

    it("builds Discord embed with emerald color for price decrease", () => {
      const payload = buildDiscordPriceIncreaseEmbed({
        resourceId: "res-discord-2",
        resourceName: "Heroku Dyno",
        previousAmountMinor: 5000,
        newAmountMinor: 2500,
        currency: "USD",
        previousBillingCycle: "monthly",
        newBillingCycle: "monthly",
        changePercentage: -50,
        appUrl: "https://duesora.test",
      });

      const embeds = payload.embeds as Array<Record<string, unknown>>;
      expect(embeds[0].color).toBe(0x10b981); // Emerald
      expect(embeds[0].title).toContain("📉 Price Adjustment: Heroku Dyno (-50%)");
    });
  });
});
