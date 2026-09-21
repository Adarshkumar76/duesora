import { describe, expect, it } from "vitest";
import { normalizeRawRow, importRowSchema } from "@/lib/import-export/validation";

describe("Import Data Normalization and Validation", () => {
  describe("normalizeRawRow", () => {
    it("normalizes CSV row with standard header casing and amount parsing", () => {
      const raw = {
        Name: " Figma Professional ",
        Type: "Subscription",
        Category: "Design",
        Provider: "Figma Inc",
        "Website URL": "https://figma.com",
        Amount: "15.00",
        Currency: "USD",
        "Billing Cycle": "Monthly",
        "Next Renewal": "2026-10-15",
        "Auto Renew": "true",
        Tags: "design; ui; tooling",
      };

      const normalized = normalizeRawRow(raw);

      expect(normalized.name).toBe("Figma Professional");
      expect(normalized.type).toBe("subscription");
      expect(normalized.category).toBe("Design");
      expect(normalized.provider).toBe("Figma Inc");
      expect(normalized.websiteUrl).toBe("https://figma.com");
      expect(normalized.amountMinor).toBe(1500);
      expect(normalized.currency).toBe("USD");
      expect(normalized.billingCycle).toBe("monthly");
      expect(String(normalized.renewalDate)).toContain("2026-10-15");
      expect(normalized.autoRenew).toBe(true);
      expect(normalized.tags).toEqual(["design", "ui", "tooling"]);
    });

    it("parses comma-separated tags and strips extra whitespace", () => {
      const raw = {
        name: "Slack",
        type: "subscription",
        tags: "chat, team, productivity",
      };

      const normalized = normalizeRawRow(raw);
      expect(normalized.tags).toEqual(["chat", "team", "productivity"]);
    });

    it("handles falsy autoRenew flags", () => {
      const raw = {
        name: "GoDaddy Domain",
        type: "domain",
        autoRenew: "no",
      };

      const normalized = normalizeRawRow(raw);
      expect(normalized.autoRenew).toBe(false);
    });
  });

  describe("importRowSchema", () => {
    it("accepts valid normalized row", () => {
      const row = {
        name: "Datadog APM",
        type: "cloud_service",
        category: "Monitoring",
        provider: "Datadog",
        websiteUrl: "https://datadoghq.com",
        amountMinor: 6500,
        currency: "USD",
        billingCycle: "monthly",
        renewalDate: "2026-12-01",
        autoRenew: true,
        tags: ["monitoring", "production"],
      };

      const result = importRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Datadog APM");
        expect(result.data.type).toBe("cloud_service");
      }
    });

    it("rejects missing resource name", () => {
      const row = {
        name: "",
        type: "subscription",
      };

      const result = importRowSchema.safeParse(row);
      expect(result.success).toBe(false);
    });

    it("rejects invalid resource type", () => {
      const row = {
        name: "Test Resource",
        type: "nonexistent_type",
      };

      const result = importRowSchema.safeParse(row);
      expect(result.success).toBe(false);
    });

    it("sanitizes HTML injections in name and provider", () => {
      const row = {
        name: "<script>alert(1)</script>Clean Name",
        type: "custom",
        provider: "<b>Provider</b>",
      };

      const result = importRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Clean Name");
        expect(result.data.provider).toBe("Provider");
      }
    });

    it("rejects malformed website URL", () => {
      const row = {
        name: "Test Resource",
        type: "hosting",
        websiteUrl: "not-a-valid-url",
      };

      const result = importRowSchema.safeParse(row);
      expect(result.success).toBe(false);
    });
  });
});
