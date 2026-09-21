import { describe, it, expect } from "vitest";
import { generateIcsCalendar } from "@/lib/calendar/ical";

describe("Calendar Feed: generateIcsCalendar (RFC 5545)", () => {
  it("generates a valid empty VCALENDAR when no resources are provided", () => {
    const ics = generateIcsCalendar({
      workspaceName: "My Workspace",
      resources: [],
    });

    expect(ics).toContain("BEGIN:VCALENDAR\r\n");
    expect(ics).toContain("VERSION:2.0\r\n");
    expect(ics).toContain("X-WR-CALNAME:Duesora - My Workspace\r\n");
    expect(ics).toContain("END:VCALENDAR\r\n");
  });

  it("generates VEVENT blocks for resources with renewal dates and proper alarms", () => {
    const ics = generateIcsCalendar({
      workspaceName: "Acme Corp",
      resources: [
        {
          id: "res-1",
          name: "example.com",
          type: "domain",
          provider: "Cloudflare",
          category: "Infrastructure",
          websiteUrl: "https://example.com",
          amountMinor: 1499,
          currency: "USD",
          billingCycle: "yearly",
          renewalDate: "2026-10-15T00:00:00Z",
          autoRenew: true,
          description: "Primary domain",
        },
      ],
    });

    expect(ics).toContain("BEGIN:VEVENT\r\n");
    expect(ics).toContain("UID:duesora-resource-res-1@duesora.com\r\n");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261015\r\n");
    expect(ics).toContain("DTEND;VALUE=DATE:20261016\r\n");
    expect(ics).toContain("SUMMARY:example.com Renewal (14.99 USD)\r\n");
    expect(ics).toContain("RRULE:FREQ=YEARLY\r\n");
    expect(ics).toContain("URL:https://example.com\r\n");
    expect(ics).toContain("BEGIN:VALARM\r\n");
    expect(ics).toContain("TRIGGER:-P7D\r\n");
    expect(ics).toContain("TRIGGER:-P1D\r\n");
    expect(ics).toContain("END:VEVENT\r\n");
  });

  it("skips resources without a renewal date", () => {
    const ics = generateIcsCalendar({
      workspaceName: "Acme Corp",
      resources: [
        {
          id: "res-2",
          name: "One-off License",
          renewalDate: null,
        },
      ],
    });

    expect(ics).not.toContain("BEGIN:VEVENT");
  });
});
