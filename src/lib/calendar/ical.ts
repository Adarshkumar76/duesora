export interface CalendarResourceItem {
  id: string;
  name: string;
  type?: string | null;
  provider?: string | null;
  category?: string | null;
  websiteUrl?: string | null;
  amountMinor?: number | null;
  currency?: string | null;
  billingCycle?: string | null;
  renewalDate: Date | string | null;
  autoRenew?: boolean | null;
  description?: string | null;
}

export interface GenerateIcsOptions {
  workspaceName: string;
  resources: CalendarResourceItem[];
  domainUrl?: string;
}

/**
 * Escapes characters for RFC 5545 text values.
 */
function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Formats a Date object into YYYYMMDD for all-day events.
 */
function formatIcsDate(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Formats a Date object into UTC timestamp YYYYMMDDTHHMMSSZ for DTSTAMP.
 */
function formatIcsDateTime(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  const seconds = String(d.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generates an RFC 5545 compliant iCalendar string for workspace resource renewals.
 */
export function generateIcsCalendar(options: GenerateIcsOptions): string {
  const { workspaceName, resources } = options;
  const now = new Date();
  const dtstamp = formatIcsDateTime(now);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Duesora//Renewals Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(`Duesora - ${workspaceName}`)}`,
    "X-WR-CALDESC:Resource and subscription renewal reminders from Duesora",
    "X-WR-TIMEZONE:UTC",
  ];

  for (const item of resources) {
    if (!item.renewalDate) continue;

    const renewalDate = new Date(item.renewalDate);
    if (isNaN(renewalDate.getTime())) continue;

    // For an all-day event, DTEND is the day after DTSTART
    const nextDay = new Date(renewalDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const dtStart = formatIcsDate(renewalDate);
    const dtEnd = formatIcsDate(nextDay);

    const formattedAmount =
      item.amountMinor !== null && item.amountMinor !== undefined
        ? `${(item.amountMinor / 100).toFixed(2)} ${item.currency || "USD"}`
        : null;

    const summaryParts = [item.name, "Renewal"];
    if (formattedAmount) {
      summaryParts.push(`(${formattedAmount})`);
    }
    const summary = summaryParts.join(" ");

    const descLines: string[] = [
      `Resource: ${item.name}`,
      `Billing Cycle: ${item.billingCycle || "yearly"}`,
    ];
    if (formattedAmount) descLines.push(`Cost: ${formattedAmount}`);
    if (item.provider) descLines.push(`Provider: ${item.provider}`);
    if (item.category) descLines.push(`Category: ${item.category}`);
    if (item.websiteUrl) descLines.push(`URL: ${item.websiteUrl}`);
    if (item.autoRenew !== undefined && item.autoRenew !== null) {
      descLines.push(`Auto-Renew: ${item.autoRenew ? "Enabled" : "Disabled"}`);
    }
    if (item.description) descLines.push(`Notes: ${item.description}`);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:duesora-resource-${item.id}@duesora.com`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
    lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    lines.push(`SUMMARY:${escapeIcsText(summary)}`);
    lines.push(`DESCRIPTION:${escapeIcsText(descLines.join("\n"))}`);

    if (item.websiteUrl) {
      const cleanUrl = item.websiteUrl.startsWith("http")
        ? item.websiteUrl
        : `https://${item.websiteUrl}`;
      lines.push(`URL:${cleanUrl}`);
    }

    // Recurrence rule based on billing cycle
    if (item.billingCycle === "yearly") {
      lines.push("RRULE:FREQ=YEARLY");
    } else if (item.billingCycle === "monthly") {
      lines.push("RRULE:FREQ=MONTHLY");
    } else if (item.billingCycle === "quarterly") {
      lines.push("RRULE:FREQ=MONTHLY;INTERVAL=3");
    }

    // 7-Day Display Alarm
    lines.push("BEGIN:VALARM");
    lines.push("ACTION:DISPLAY");
    lines.push("DESCRIPTION:Renewal in 7 days");
    lines.push("TRIGGER:-P7D");
    lines.push("END:VALARM");

    // 1-Day Display Alarm
    lines.push("BEGIN:VALARM");
    lines.push("ACTION:DISPLAY");
    lines.push("DESCRIPTION:Renewal due tomorrow");
    lines.push("TRIGGER:-P1D");
    lines.push("END:VALARM");

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  // RFC 5545 requires CRLF line endings
  return lines.join("\r\n") + "\r\n";
}
