/**
 * Contract Cancellation & Renegotiation Assistant
 * Generates formal contract termination notices, renegotiation proposals,
 * and tracks cancellation notice deadlines.
 */

export interface SeatOptimizationData {
  totalSeats: number;
  assignedSeats: number;
  unassignedSeats: number;
  costPerSeatMinor?: number | null;
  potentialSavingsMinor?: number | null;
}

export interface CancellationLetterOptions {
  resourceName: string;
  vendorName?: string | null;
  accountNumber?: string | null;
  contactName?: string | null;
  organizationName?: string | null;
  renewalDate?: Date | string | null;
  cancellationDeadline?: Date | string | null;
  cancellationNoticeDays?: number | null;
  amountMinor?: number | null;
  currency?: string | null;
  reason?: string | null;
  includeDataDeletionClause?: boolean;
  renegotiationDiscountPercent?: number | null;
  seatOptimization?: SeatOptimizationData | null;
  customNotes?: string | null;
}

export interface CancellationUrgency {
  deadlineDate: Date | null;
  daysUntilDeadline: number | null;
  isExpired: boolean;
  isUrgent: boolean; // <= 14 days
  noticeDays: number | null;
}

/**
 * Calculates deadline urgency from renewal date and notice days.
 */
export function calculateCancellationUrgency(
  renewalDateInput?: Date | string | null,
  cancellationNoticeDaysInput?: number | null,
  cancellationDeadlineInput?: Date | string | null
): CancellationUrgency {
  const noticeDays =
    cancellationNoticeDaysInput !== null && cancellationNoticeDaysInput !== undefined
      ? Number(cancellationNoticeDaysInput)
      : null;

  let deadline: Date | null = null;

  if (cancellationDeadlineInput) {
    deadline = new Date(cancellationDeadlineInput);
  } else if (renewalDateInput && noticeDays !== null && noticeDays >= 0) {
    const renDate = new Date(renewalDateInput);
    if (!isNaN(renDate.getTime())) {
      deadline = new Date(renDate.getTime() - noticeDays * 24 * 60 * 60 * 1000);
    }
  }

  if (!deadline || isNaN(deadline.getTime())) {
    return {
      deadlineDate: null,
      daysUntilDeadline: null,
      isExpired: false,
      isUrgent: false,
      noticeDays,
    };
  }

  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const daysUntilDeadline = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

  return {
    deadlineDate: deadline,
    daysUntilDeadline,
    isExpired: daysUntilDeadline < 0,
    isUrgent: daysUntilDeadline >= 0 && daysUntilDeadline <= 14,
    noticeDays,
  };
}

/**
 * Formats a currency amount in minor units to standard string
 */
function formatCurrency(amountMinor?: number | null, currency: string = "USD"): string {
  if (amountMinor === null || amountMinor === undefined) return "N/A";
  const major = (amountMinor / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency.toUpperCase()} ${major}`;
}

/**
 * Formats a Date to readable string
 */
function formatDate(d?: Date | string | null): string {
  if (!d) return "[Date]";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return "[Date]";
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Generates a formal, legally structured contract cancellation letter.
 */
export function generateCancellationNoticeLetter(options: CancellationLetterOptions): {
  subject: string;
  body: string;
} {
  const vendor = options.vendorName?.trim() || options.resourceName;
  const accountRef = options.accountNumber?.trim() ? ` (Account/Subscription ID: ${options.accountNumber.trim()})` : "";
  const orgName = options.organizationName?.trim() || "[Our Organization / Company Name]";
  const contactName = options.contactName?.trim() || "[Authorized Representative]";
  const formattedRenewal = formatDate(options.renewalDate);
  const formattedDeadline = options.cancellationDeadline ? formatDate(options.cancellationDeadline) : null;
  const todayStr = formatDate(new Date());

  const subject = `Formal Notice of Non-Renewal / Cancellation: ${options.resourceName}${options.accountNumber ? ` - ${options.accountNumber.trim()}` : ""}`;

  const noticeClause = options.cancellationNoticeDays
    ? `Pursuant to the contract terms requiring a ${options.cancellationNoticeDays}-day written notice period${formattedDeadline ? ` (notice deadline: ${formattedDeadline})` : ""}, this notice is submitted well in advance of the upcoming renewal date of ${formattedRenewal}.`
    : `Please consider this formal written notice in advance of our upcoming renewal date on ${formattedRenewal}.`;

  const reasonBlock = options.reason?.trim()
    ? `\nReason for Non-Renewal:\n${options.reason.trim()}\n`
    : "";

  const dataDeletionBlock = options.includeDataDeletionClause !== false
    ? `
Data Deletion & Privacy Compliance:
In accordance with applicable data privacy regulations (including GDPR, CCPA, and SOC 2 requirements) and our master services agreement:
1. Please cease all recurring billing and automated credit card charges immediately upon the conclusion of the current term.
2. Provide our team with instructions or assistance for exporting all tenant data prior to account termination.
3. Upon conclusion of the current term, securely delete all confidential data, credentials, and backups stored within your systems and furnish written certification of destruction upon request.`
    : `
Billing Termination:
Please confirm in writing that all automated recurring charges, invoices, and credit card debits for this account are halted effective upon the conclusion of the current term.`;

  const body = `Date: ${todayStr}

To: ${vendor} Accounts / Cancellation Department
From: ${orgName}
Subject: ${subject}

Dear ${vendor} Team,

This letter serves as formal written notification that ${orgName} will not be renewing our subscription/contract for "${options.resourceName}"${accountRef}.

Effective Cancellation Date: ${formattedRenewal}
${noticeClause}
${reasonBlock}${dataDeletionBlock}

Please acknowledge receipt of this cancellation notice via reply email within three (3) business days, confirming that:
- The contract will terminate on ${formattedRenewal} without further financial liability or penalty;
- No further automated renewals or invoices will be issued; and
- All access and account transition procedures have been recorded.

Thank you for your service and support during our tenure.

Sincerely,

${contactName}
${orgName}
`;

  return { subject, body };
}

/**
 * Generates an executive vendor renegotiation & downsize proposal letter.
 */
export function generateRenegotiationProposal(options: CancellationLetterOptions): {
  subject: string;
  body: string;
} {
  const vendor = options.vendorName?.trim() || options.resourceName;
  const accountRef = options.accountNumber?.trim() ? ` (Account/Contract ID: ${options.accountNumber.trim()})` : "";
  const orgName = options.organizationName?.trim() || "[Our Organization / Company Name]";
  const contactName = options.contactName?.trim() || "[Authorized Representative]";
  const formattedRenewal = formatDate(options.renewalDate);
  const discount = options.renegotiationDiscountPercent || 20;
  const todayStr = formatDate(new Date());

  const subject = `Upcoming Contract Renewal & Terms Review: ${options.resourceName}${options.accountNumber ? ` - ${options.accountNumber.trim()}` : ""}`;

  let seatTelemetryBlock = "";
  if (options.seatOptimization && options.seatOptimization.totalSeats > 0) {
    const { totalSeats, assignedSeats, unassignedSeats, potentialSavingsMinor } = options.seatOptimization;
    const savingsStr = potentialSavingsMinor ? ` (representing ~${formatCurrency(potentialSavingsMinor, options.currency || "USD")} in unutilized spend)` : "";
    seatTelemetryBlock = `
License Utilization Audit:
According to our internal software governance audit for "${options.resourceName}":
- Total Contracted Licenses: ${totalSeats}
- Actively Assigned Seats: ${assignedSeats}
- Inactive / Unassigned Seats: ${unassignedSeats}${savingsStr}

To align our renewal with our actual enterprise operational consumption, we request adjusting our contracted seat tier down to ${assignedSeats} seats, or adjusting our per-seat pricing accordingly.`;
  }

  const customNotesBlock = options.customNotes?.trim()
    ? `\nAdditional Context:\n${options.customNotes.trim()}\n`
    : "";

  const urgencyNotice = options.cancellationNoticeDays
    ? `As our contract requires a ${options.cancellationNoticeDays}-day cancellation notice window before ${formattedRenewal}, we would appreciate connecting prior to this cutoff to finalize terms.`
    : `With our renewal coming up on ${formattedRenewal}, we would appreciate discussing this promptly to arrive at mutually agreeable terms.`;

  const body = `Date: ${todayStr}

To: ${vendor} Enterprise Accounts & Customer Success
From: ${orgName}
Subject: ${subject}

Dear ${vendor} Account Team,

As our team approaches our upcoming renewal for "${options.resourceName}" on ${formattedRenewal}${accountRef}, we are conducting an executive review of our active tooling and vendor commitments.

We value the capabilities provided by ${vendor} and would welcome continuing our partnership under updated commercial terms that reflect our current organizational requirements.
${seatTelemetryBlock}

Proposed Terms for Renewal:
1. Target Pricing: A revised structure providing a ${discount}% discount off standard renewal rates or a competitive multi-year agreement.
2. License Rightsizing: Alignment of invoiced tiers with active consumption.
3. Enhanced Support / Enterprise Features: Inclusion of priority support SLAs or advanced admin tooling at current rate levels.
${customNotesBlock}
${urgencyNotice}

If we are unable to reach aligned terms prior to our notice deadline, our finance team will be mandated to initiate formal non-renewal and explore alternative providers.

Please let us know your availability for a brief call this week or provide an updated commercial proposal.

Best regards,

${contactName}
${orgName}
`;

  return { subject, body };
}

/**
 * Builds an RFC-compliant mailto URI with pre-encoded subject and body.
 */
export function generateCancellationMailto(
  subject: string,
  body: string,
  recipientEmail?: string | null
): string {
  const recipient = (recipientEmail || "").trim();
  const query = new URLSearchParams();
  query.set("subject", subject);
  query.set("body", body);
  return `mailto:${recipient}?${query.toString().replace(/\+/g, "%20")}`;
}
