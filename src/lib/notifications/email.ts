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
  isEscalated?: boolean;
  escalatedReason?: string;
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

export function formatReminderSubject(
  resourceName: string,
  daysRemaining: number,
  isEscalated?: boolean
): string {
  const prefix = isEscalated ? "[ESCALATED] " : "";
  if (daysRemaining <= 0) {
    return `${prefix}[URGENT] ${resourceName} renewal is due today or overdue`;
  }
  if (daysRemaining <= 3) {
    return `${prefix}[Action Required] ${resourceName} renews in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`;
  }
  if (daysRemaining <= 7) {
    return `${prefix}Reminder: ${resourceName} renews in ${daysRemaining} days`;
  }
  return `${prefix}Upcoming: ${resourceName} renews in ${daysRemaining} days`;
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
      ${
        opts.isEscalated
          ? `<div style="background-color: #fef2f2; border: 1px solid #f87171; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
              <strong style="color: #991b1b; font-size: 13px; display: block; margin-bottom: 3px;">🚨 ESCALATION NOTICE</strong>
              <span style="color: #b91c1c; font-size: 12px; line-height: 1.4;">${
                opts.escalatedReason ||
                `This renewal deadline is critical (${opts.daysRemaining <= 0 ? "overdue" : `renews in ${opts.daysRemaining} days`}) and has been escalated to workspace administration.`
              }</span>
            </div>`
          : ""
      }
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

  const escalationBanner = opts.isEscalated
    ? `*** ESCALATION NOTICE ***\nThis renewal deadline is critical and has been escalated to workspace administrators.\n----------------------------------------\n`
    : "";

  return `DUESORA RENEWAL ALERT
----------------------------------------
${escalationBanner}${opts.resourceName}
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
  const subject = formatReminderSubject(opts.resourceName, opts.daysRemaining, opts.isEscalated);
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

export interface SendMonitorAlertEmailOptions {
  to: string;
  recipientName?: string | null;
  resourceName: string;
  hostname: string;
  resourceId: string;
  status: "warning" | "critical" | "error" | "healthy" | "unknown";
  previousStatus?: string | null;
  tlsDaysRemaining: number | null;
  tlsIssuer: string | null;
  tlsProtocol?: string | null;
  errorMessage?: string | null;
  workspaceName?: string;
  appUrl?: string;
}

export function formatMonitorSubject(opts: SendMonitorAlertEmailOptions): string {
  if (opts.status === "healthy") {
    return `[RESOLVED] Monitor recovered for ${opts.hostname}`;
  }
  if (opts.status === "critical") {
    if (opts.tlsDaysRemaining !== null && opts.tlsDaysRemaining <= 0) {
      return `[CRITICAL] SSL certificate EXPIRED for ${opts.hostname}`;
    }
    if (opts.tlsDaysRemaining !== null && opts.tlsDaysRemaining <= 7) {
      return `[CRITICAL] SSL certificate expiring in ${opts.tlsDaysRemaining} days: ${opts.hostname}`;
    }
    return `[CRITICAL] Health check critical for ${opts.hostname}`;
  }
  if (opts.status === "warning") {
    if (opts.tlsDaysRemaining !== null) {
      return `[WARNING] SSL certificate expires in ${opts.tlsDaysRemaining} days: ${opts.hostname}`;
    }
    return `[WARNING] Health check warning for ${opts.hostname}`;
  }
  return `[ALERT] Health check failed for ${opts.hostname}`;
}

export function renderMonitorEmailHtml(opts: SendMonitorAlertEmailOptions): string {
  const appBaseUrl = opts.appUrl || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resourceUrl = `${appBaseUrl}/resources/${opts.resourceId}`;

  const urgencyColor =
    opts.status === "healthy"
      ? "#10b981"
      : opts.status === "warning"
      ? "#d97706"
      : "#e11d48";

  const statusLabel =
    opts.status === "healthy"
      ? "HEALTHY / RECOVERED"
      : opts.status === "critical"
      ? "CRITICAL EXPIRATION"
      : opts.status === "warning"
      ? "EXPIRING SOON"
      : "CHECK FAILED";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${formatMonitorSubject(opts)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; line-height: 1.5; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; padding: 24px 32px; color: #ffffff; }
    .logo { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: #10b981; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; background-color: ${urgencyColor}20; color: ${urgencyColor}; border: 1px solid ${urgencyColor}40; margin-top: 12px; }
    .content { padding: 32px; }
    .greeting { font-size: 16px; margin-bottom: 16px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .item-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .item-row:last-child { border-bottom: none; }
    .label { color: #64748b; font-weight: 500; }
    .value { font-weight: 600; color: #0f172a; }
    .btn { display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 16px; }
    .footer { padding: 20px 32px; background: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Duesora</div>
      <div class="badge">${statusLabel}</div>
    </div>
    <div class="content">
      <div class="greeting">Hello ${opts.recipientName || "there"},</div>
      <p>An automated health monitor check has detected a status update for <strong>${opts.hostname}</strong>.</p>
      
      <div class="card">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Resource:</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; font-size: 13px;">${opts.resourceName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Hostname:</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; font-size: 13px;">${opts.hostname}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Current Status:</td>
            <td style="padding: 6px 0; font-weight: 700; text-align: right; font-size: 13px; color: ${urgencyColor};">${opts.status.toUpperCase()}</td>
          </tr>
          ${opts.tlsDaysRemaining !== null ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">SSL Days Remaining:</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; font-size: 13px;">${opts.tlsDaysRemaining} days</td>
          </tr>` : ""}
          ${opts.tlsIssuer ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Certificate Issuer:</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; font-size: 13px;">${opts.tlsIssuer}</td>
          </tr>` : ""}
          ${opts.errorMessage ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Diagnostic Note:</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; font-size: 13px; color: #e11d48;">${opts.errorMessage}</td>
          </tr>` : ""}
        </table>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${resourceUrl}" class="btn" style="color: #ffffff;">View Resource & Monitor Logs</a>
      </div>
    </div>
    <div class="footer">
      Automated health monitoring by Duesora. Manage monitor alert preferences in your workspace settings.
    </div>
  </div>
</body>
</html>`;
}

export function renderMonitorEmailText(opts: SendMonitorAlertEmailOptions): string {
  const appBaseUrl = opts.appUrl || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resourceUrl = `${appBaseUrl}/resources/${opts.resourceId}`;

  return `Duesora Health Monitor Alert: ${opts.hostname}

Resource: ${opts.resourceName}
Hostname: ${opts.hostname}
Status: ${opts.status.toUpperCase()}
SSL Days Remaining: ${opts.tlsDaysRemaining !== null ? opts.tlsDaysRemaining + " days" : "N/A"}
Issuer: ${opts.tlsIssuer || "N/A"}
${opts.errorMessage ? `Note: ${opts.errorMessage}\n` : ""}
View Resource & Logs: ${resourceUrl}
`;
}

export async function sendMonitorAlertEmail(
  opts: SendMonitorAlertEmailOptions
): Promise<SendEmailResult> {
  const subject = formatMonitorSubject(opts);
  const html = renderMonitorEmailHtml(opts);
  const text = renderMonitorEmailText(opts);

  if (!isEmailConfigured()) {
    return {
      success: true,
      simulated: true,
      messageId: `simulated-monitor-${Date.now()}`,
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

export interface SendTeamInvitationEmailOptions {
  to: string;
  inviterName?: string | null;
  workspaceName: string;
  role: string;
  inviteToken: string;
  expiresAt: Date;
  appUrl?: string;
}

export function renderTeamInvitationEmailHtml(opts: SendTeamInvitationEmailOptions): string {
  const appBaseUrl = opts.appUrl || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const inviteUrl = `${appBaseUrl}/invite/${opts.inviteToken}`;
  const inviterText = opts.inviterName ? opts.inviterName : "A colleague";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Invitation to join ${opts.workspaceName} on Duesora</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; line-height: 1.5; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; padding: 24px 32px; color: #ffffff; }
    .logo { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: #10b981; }
    .content { padding: 32px; }
    .greeting { font-size: 16px; margin-bottom: 16px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .btn { display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 16px; }
    .footer { padding: 20px 32px; background: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Duesora</div>
    </div>
    <div class="content">
      <div class="greeting">Hello!</div>
      <p><strong>${inviterText}</strong> has invited you to join the <strong>${opts.workspaceName}</strong> workspace on Duesora as a <strong>${opts.role.toUpperCase()}</strong>.</p>
      
      <div class="card">
        <p style="margin: 0; font-size: 14px; color: #475569;">
          Collaborate on tracking IT assets, SSL certificates, recurring software licenses, and renewal budgets with real-time proactive alerts.
        </p>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${inviteUrl}" class="btn" style="color: #ffffff;">Accept Invitation</a>
      </div>

      <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
        Or copy and paste this link into your browser:<br />
        <a href="${inviteUrl}" style="color: #10b981; word-break: break-all;">${inviteUrl}</a>
      </p>
    </div>
    <div class="footer">
      This invitation link will expire in 7 days. If you were not expecting this invitation, you can safely ignore this email.
    </div>
  </div>
</body>
</html>`;
}

export function renderTeamInvitationEmailText(opts: SendTeamInvitationEmailOptions): string {
  const appBaseUrl = opts.appUrl || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const inviteUrl = `${appBaseUrl}/invite/${opts.inviteToken}`;
  const inviterText = opts.inviterName ? opts.inviterName : "A colleague";

  return `Invitation to join ${opts.workspaceName} on Duesora

${inviterText} has invited you to join the ${opts.workspaceName} workspace as a ${opts.role.toUpperCase()}.

Accept your invitation here:
${inviteUrl}

This invitation link will expire in 7 days.
`;
}

export async function sendTeamInvitationEmail(
  opts: SendTeamInvitationEmailOptions
): Promise<SendEmailResult> {
  const subject = `You've been invited to join ${opts.workspaceName} on Duesora`;
  const html = renderTeamInvitationEmailHtml(opts);
  const text = renderTeamInvitationEmailText(opts);

  if (!isEmailConfigured()) {
    return {
      success: true,
      simulated: true,
      messageId: `simulated-invite-${Date.now()}`,
    };
  }

  try {
    const transporter = getEmailTransporter();
    if (!transporter) {
      return { success: false, error: "Transporter unavailable" };
    }

    const fromAddress =
      process.env.SMTP_FROM || "Duesora <notifications@duesora.com>";

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


