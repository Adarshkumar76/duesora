import nodemailer from "nodemailer";

export interface SendRenewalReminderEmailOptions {
  to: string;
  recipientName?: string | null;
  resourceName: string;
  resourceType: string;
  provider?: string | null;
  daysRemaining: number;
  renewalDate: Date;
  amountMinor: number | null;
  currency: string;
  billingCycle: string;
  resourceId: string;
  workspaceName?: string;
  appUrl?: string;
}

export interface SendEmailResult {
  success: boolean;
  simulated?: boolean;
  messageId?: string;
  error?: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD
  );
}

export function getEmailTransporter() {
  if (!isEmailConfigured()) return null;

  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export function formatReminderSubject(resourceName: string, daysRemaining: number): string {
  if (daysRemaining <= 0) {
    return `[URGENT] ${resourceName} renewal is due today or overdue`;
  }
  if (daysRemaining <= 3) {
    return `[Action Required] ${resourceName} renews in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`;
  }
  if (daysRemaining <= 7) {
    return `Reminder: ${resourceName} renews in ${daysRemaining} days`;
  }
  return `Upcoming: ${resourceName} renews in ${daysRemaining} days`;
}

export function renderRenewalEmailHtml(opts: SendRenewalReminderEmailOptions): string {
  const appBaseUrl = opts.appUrl || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resourceUrl = `${appBaseUrl}/resources/${opts.resourceId}`;

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(opts.renewalDate));

  const amountStr =
    opts.amountMinor !== null
      ? `${(opts.amountMinor / 100).toFixed(2)} ${opts.currency} (${opts.billingCycle})`
      : "Not specified";

  const urgencyColor =
    opts.daysRemaining <= 1
      ? "#e11d48"
      : opts.daysRemaining <= 7
      ? "#d97706"
      : "#10b981";

  const urgencyText =
    opts.daysRemaining <= 0
      ? "Expires Today / Overdue"
      : `Renews in ${opts.daysRemaining} day${opts.daysRemaining === 1 ? "" : "s"}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${formatReminderSubject(opts.resourceName, opts.daysRemaining)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; line-height: 1.5; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; padding: 24px 32px; color: #ffffff; }
    .logo { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: #10b981; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; background-color: ${urgencyColor}20; color: ${urgencyColor}; border: 1px solid ${urgencyColor}40; margin-top: 12px; }
    .content { padding: 32px; }
    .title { font-size: 20px; font-weight: 700; margin: 0 0 8px 0; color: #0f172a; }
    .subtitle { font-size: 14px; color: #64748b; margin: 0 0 24px 0; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf2f7; font-size: 13px; }
    .row:last-child { border-bottom: none; }
    .row-label { color: #64748b; font-weight: 500; }
    .row-value { color: #0f172a; font-weight: 600; text-align: right; }
    .button-container { text-align: center; margin: 32px 0 16px 0; }
    .button { display: inline-block; padding: 12px 28px; background-color: #10b981; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; }
    .footer { background: #f1f5f9; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Duesora</div>
      <div class="badge">${urgencyText}</div>
    </div>
    <div class="content">
      <h1 class="title">${opts.resourceName}</h1>
      <p class="subtitle">
        Hi ${opts.recipientName || "there"}, this is an automated renewal alert for your workspace resource.
      </p>

      <div class="card">
        <div class="row">
          <span class="row-label">Resource Type</span>
          <span class="row-value">${opts.resourceType}</span>
        </div>
        ${
          opts.provider
            ? `<div class="row">
                <span class="row-label">Provider</span>
                <span class="row-value">${opts.provider}</span>
              </div>`
            : ""
        }
        <div class="row">
          <span class="row-label">Renewal Date</span>
          <span class="row-value" style="color: ${urgencyColor};">${formattedDate}</span>
        </div>
        <div class="row">
          <span class="row-label">Cost</span>
          <span class="row-value">${amountStr}</span>
        </div>
      </div>

      <div class="button-container">
        <a href="${resourceUrl}" class="button" target="_blank" rel="noopener noreferrer">
          View Resource Details &rarr;
        </a>
      </div>
    </div>
    <div class="footer">
      Sent by Duesora &bull; Your self-hosted renewals & subscription command center.<br />
      Manage your notification settings in your workspace dashboard.
    </div>
  </div>
</body>
</html>`;
}

export function renderRenewalEmailText(opts: SendRenewalReminderEmailOptions): string {
  const appBaseUrl = opts.appUrl || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resourceUrl = `${appBaseUrl}/resources/${opts.resourceId}`;
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(opts.renewalDate));

  const amountStr =
    opts.amountMinor !== null
      ? `${(opts.amountMinor / 100).toFixed(2)} ${opts.currency} (${opts.billingCycle})`
      : "Not specified";

  return `DUESORA RENEWAL ALERT
----------------------------------------
${opts.resourceName}
Status: Renews in ${opts.daysRemaining} days (${formattedDate})

Type: ${opts.resourceType}
${opts.provider ? `Provider: ${opts.provider}\n` : ""}Cost: ${amountStr}

View resource details:
${resourceUrl}

----------------------------------------
Sent by Duesora.
`;
}

export async function sendRenewalReminderEmail(
  opts: SendRenewalReminderEmailOptions
): Promise<SendEmailResult> {
  const subject = formatReminderSubject(opts.resourceName, opts.daysRemaining);
  const html = renderRenewalEmailHtml(opts);
  const text = renderRenewalEmailText(opts);

  if (!isEmailConfigured()) {
    // In dev or without SMTP, simulate delivery cleanly
    return {
      success: true,
      simulated: true,
      messageId: `simulated-${Date.now()}`,
    };
  }

  try {
    const transporter = getEmailTransporter();
    if (!transporter) {
      return { success: false, error: "Transporter unavailable" };
    }

    const fromAddress =
      process.env.SMTP_FROM || "Duesora Alerts <notifications@duesora.com>";

    const info = await transporter.sendMail({
      from: fromAddress,
      to: opts.to,
      subject,
      text,
      html,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown SMTP failure";
    return {
      success: false,
      error: errorMessage,
    };
  }
}
