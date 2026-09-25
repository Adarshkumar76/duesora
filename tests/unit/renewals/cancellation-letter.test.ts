import { describe, it, expect } from "vitest";
import {
  calculateCancellationUrgency,
  generateCancellationNoticeLetter,
  generateRenegotiationProposal,
  generateCancellationMailto,
} from "@/lib/renewals/cancellation-letter";

describe("Cancellation & Renegotiation Assistant", () => {
  describe("calculateCancellationUrgency", () => {
    it("should return null deadline if no renewal date or notice days provided", () => {
      const res = calculateCancellationUrgency(null, null, null);
      expect(res.deadlineDate).toBeNull();
      expect(res.daysUntilDeadline).toBeNull();
      expect(res.isExpired).toBe(false);
      expect(res.isUrgent).toBe(false);
    });

    it("should compute deadline from renewalDate and cancellationNoticeDays", () => {
      const renewalDate = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000);
      const res = calculateCancellationUrgency(renewalDate, 30);
      expect(res.deadlineDate).toBeDefined();
      expect(res.daysUntilDeadline).toBeGreaterThan(0);
      expect(res.isExpired).toBe(false);
      // 40 - 30 = 10 days away -> should be urgent (<= 14 days)
      expect(res.isUrgent).toBe(true);
    });

    it("should correctly flag expired notice deadline", () => {
      const renewalDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const res = calculateCancellationUrgency(renewalDate, 30); // 10 - 30 = -20 days
      expect(res.isExpired).toBe(true);
      expect(res.daysUntilDeadline).toBeLessThan(0);
    });

    it("should prioritize explicit cancellationDeadline if supplied", () => {
      const explicitDeadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const res = calculateCancellationUrgency(null, null, explicitDeadline);
      expect(res.deadlineDate).toEqual(explicitDeadline);
      expect(res.daysUntilDeadline).toBeGreaterThanOrEqual(4);
      expect(res.isUrgent).toBe(true);
    });
  });

  describe("generateCancellationNoticeLetter", () => {
    it("should generate a formal cancellation letter with account and vendor details", () => {
      const letter = generateCancellationNoticeLetter({
        resourceName: "Datadog APM Pro",
        vendorName: "Datadog, Inc.",
        accountNumber: "SUB-882910",
        renewalDate: new Date("2026-11-15T00:00:00Z"),
        cancellationNoticeDays: 30,
        contactName: "Alex Mercer",
        organizationName: "Acme Corp",
        reason: "Migrating to open-source self-hosted telemetry.",
        includeDataDeletionClause: true,
      });

      expect(letter.subject).toContain("Formal Notice of Non-Renewal / Cancellation: Datadog APM Pro");
      expect(letter.subject).toContain("SUB-882910");
      expect(letter.body).toContain("To: Datadog, Inc.");
      expect(letter.body).toContain("SUB-882910");
      expect(letter.body).toContain("Acme Corp");
      expect(letter.body).toContain("Alex Mercer");
      expect(letter.body).toContain("30-day written notice period");
      expect(letter.body).toContain("Migrating to open-source self-hosted telemetry.");
      expect(letter.body).toContain("Data Deletion & Privacy Compliance");
      expect(letter.body).toContain("GDPR, CCPA, and SOC 2");
    });

    it("should fallback gracefully when optional fields are omitted", () => {
      const letter = generateCancellationNoticeLetter({
        resourceName: "Figma Enterprise",
        includeDataDeletionClause: false,
      });

      expect(letter.subject).toContain("Figma Enterprise");
      expect(letter.body).toContain("Billing Termination");
      expect(letter.body).not.toContain("Data Deletion & Privacy Compliance");
    });
  });

  describe("generateRenegotiationProposal", () => {
    it("should generate a renegotiation proposal with seat waste telemetry and requested discount", () => {
      const proposal = generateRenegotiationProposal({
        resourceName: "Zoom Enterprise",
        vendorName: "Zoom Video Communications",
        accountNumber: "ZM-10294",
        renewalDate: new Date("2026-12-01T00:00:00Z"),
        cancellationNoticeDays: 30,
        renegotiationDiscountPercent: 25,
        currency: "USD",
        seatOptimization: {
          totalSeats: 100,
          assignedSeats: 65,
          unassignedSeats: 35,
          potentialSavingsMinor: 70000,
        },
      });

      expect(proposal.subject).toContain("Upcoming Contract Renewal & Terms Review: Zoom Enterprise");
      expect(proposal.body).toContain("Total Contracted Licenses: 100");
      expect(proposal.body).toContain("Actively Assigned Seats: 65");
      expect(proposal.body).toContain("Inactive / Unassigned Seats: 35");
      expect(proposal.body).toContain("USD 700.00 in unutilized spend");
      expect(proposal.body).toContain("25% discount");
      expect(proposal.body).toContain("30-day cancellation notice window");
    });
  });

  describe("generateCancellationMailto", () => {
    it("should properly format a mailto URL with encoded parameters", () => {
      const mailto = generateCancellationMailto(
        "Notice for Acme Corp",
        "Hello World & Special Chars?",
        "billing@vendor.com"
      );

      expect(mailto.startsWith("mailto:billing@vendor.com?")).toBe(true);
      expect(mailto).toContain("subject=Notice%20for%20Acme%20Corp");
      expect(mailto).toContain("body=Hello%20World%20%26%20Special%20Chars%3F");
    });
  });
});
