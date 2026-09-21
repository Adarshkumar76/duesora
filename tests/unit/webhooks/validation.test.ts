import { describe, expect, it } from "vitest";
import { createWebhookSchema, updateWebhookSchema } from "@/lib/webhooks/validation";

describe("Webhook Validation Schemas", () => {
  describe("createWebhookSchema", () => {
    it("accepts valid webhook endpoint configuration", () => {
      const result = createWebhookSchema.safeParse({
        url: "https://example.com/api/webhooks",
        description: "Production notifier",
        events: ["resource.created", "reminder.dispatched"],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toBe("https://example.com/api/webhooks");
        expect(result.data.events).toEqual(["resource.created", "reminder.dispatched"]);
        expect(result.data.active).toBe(true);
      }
    });

    it("defaults events to wildcard ['*'] when not provided", () => {
      const result = createWebhookSchema.safeParse({
        url: "https://example.com/api/webhooks",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events).toEqual(["*"]);
      }
    });

    it("rejects invalid or unsafe URL protocol", () => {
      const result = createWebhookSchema.safeParse({
        url: "javascript:alert(1)",
      });

      expect(result.success).toBe(false);
    });

    it("rejects empty URL", () => {
      const result = createWebhookSchema.safeParse({
        url: "",
      });

      expect(result.success).toBe(false);
    });

    it("rejects short custom secret (minimum 16 chars)", () => {
      const result = createWebhookSchema.safeParse({
        url: "https://example.com/api/webhooks",
        secret: "too-short",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateWebhookSchema", () => {
    it("allows partial updates to url and active state", () => {
      const result = updateWebhookSchema.safeParse({
        active: false,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
      }
    });
  });
});
