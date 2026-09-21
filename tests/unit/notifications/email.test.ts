import { describe, expect, it } from "vitest";
import {
  formatReminderSubject,
  renderRenewalEmailHtml,
  renderRenewalEmailText,
  sendRenewalReminderEmail,
  isEmailConfigured,
} from "@/lib/notifications/email";

describe("Email Notifications and Templates", () => {
  const sampleOptions = {
    to: "user@example.com",
    recipientName: "Alex",
    resourceName: "Production Cluster AWS",
    resourceType: "cloud_service",
    provider: "Amazon Web Services",
    daysRemaining: 7,
    renewalDate: new Date("2026-10-15T00:00:00Z"),
    amountMinor: 25000,
    currency: "USD",
    billingCycle: "monthly",
    resourceId: "res-12345",
  };

  describe("formatReminderSubject", () => {
    it("formats subject for overdue resource", () => {
      expect(formatReminderSubject("Domain.com", 0)).toContain("[URGENT]");
      expect(formatReminderSubject("Domain.com", -2)).toContain("[URGENT]");
    });

    it("formats subject for urgent resource (<= 3 days)", () => {
      const subject = formatReminderSubject("SSL Cert", 2);
      expect(subject).toContain("[Action Required]");
      expect(subject).toContain("2 days");
    });

    it("formats subject for standard reminder", () => {
      const subject = formatReminderSubject("Figma", 14);
      expect(subject).toContain("Upcoming: Figma renews in 14 days");
    });
  });

  describe("renderRenewalEmailHtml", () => {
    it("generates valid HTML document with resource details", () => {
      const html = renderRenewalEmailHtml(sampleOptions);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Production Cluster AWS");
      expect(html).toContain("Amazon Web Services");
      expect(html).toContain("250.00 USD");
      expect(html).toContain("/resources/res-12345");
      expect(html).toContain("Alex");
    });
  });

  describe("renderRenewalEmailText", () => {
    it("generates plain-text version with resource link", () => {
      const text = renderRenewalEmailText(sampleOptions);

      expect(text).toContain("DUESORA RENEWAL ALERT");
      expect(text).toContain("Production Cluster AWS");
      expect(text).toContain("/resources/res-12345");
      expect(text).toContain("250.00 USD (monthly)");
    });
  });

  describe("sendRenewalReminderEmail", () => {
    it("operates in simulation mode when SMTP environment is unset", async () => {
      // In testing environment, SMTP is typically unset
      if (!isEmailConfigured()) {
        const result = await sendRenewalReminderEmail(sampleOptions);
        expect(result.success).toBe(true);
        expect(result.simulated).toBe(true);
      }
    });
  });
});
