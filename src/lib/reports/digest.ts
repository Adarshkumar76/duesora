import { getDb } from "@/db";
import { resources, workspaces, memberships } from "@/db/schema";
import { eq, and, isNotNull, lte, gte } from "drizzle-orm";
import { getWorkspaceSeatOptimizationReport } from "@/lib/resources/seats";
import { createNotification } from "@/lib/notifications/repository";
import { emitWorkspaceWebhook } from "@/lib/webhooks/dispatcher";

export interface DigestItem {
  id: string;
  name: string;
  type: string;
  provider: string | null;
  renewalDate: Date;
  daysRemaining: number;
  amountFormatted: string;
}

export interface WorkspaceDigest {
  workspaceId: string;
  workspaceName: string;
  generatedAt: string;
  currency: string;
  summary: string;
  totalDue30DaysMinor: number;
  totalDue7DaysMinor: number;
  itemsDue7Days: DigestItem[];
  itemsDue30Days: DigestItem[];
  seatOptimization: {
    totalWasteAnnualFormatted: string;
    overprovisionedServicesCount: number;
  };
  markdown: string;
  html: string;
}

/**
 * Formats minor integer cents into a standard currency string (e.g. 1299 -> "$12.99")
 */
function formatCurrency(amountMinor: number | null, currency: string = "USD"): string {
  if (amountMinor === null) return "Free / Variable";
  const major = (amountMinor / 100).toFixed(2);
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
  };
  const sym = symbols[currency.toUpperCase()] || `${currency} `;
  return `${sym}${major}`;
}

/**
 * Compiles a comprehensive renewal and cost optimization digest for a workspace
 */
export async function compileWorkspaceDigest(
  workspaceId: string,
  nowDate: Date = new Date()
): Promise<WorkspaceDigest> {
  const db = getDb();

  // 1. Fetch workspace details
  const [ws] = await db
    .select({ id: workspaces.id, name: workspaces.name, currency: workspaces.defaultCurrency })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  const workspaceName = ws?.name || "Workspace";
  const defaultCurrency = ws?.currency || "USD";

  // 2. Fetch resources due in next 30 days
  const future30Days = new Date(nowDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  const upcomingResources = await db
    .select({
      id: resources.id,
      name: resources.name,
      type: resources.type,
      provider: resources.provider,
      renewalDate: resources.renewalDate,
      amountMinor: resources.amountMinor,
      currency: resources.currency,
      status: resources.status,
    })
    .from(resources)
    .where(
      and(
        eq(resources.workspaceId, workspaceId),
        eq(resources.status, "active"),
        isNotNull(resources.renewalDate),
        gte(resources.renewalDate, nowDate),
        lte(resources.renewalDate, future30Days)
      )
    );

  const itemsDue7Days: DigestItem[] = [];
  const itemsDue30Days: DigestItem[] = [];
  let totalDue7DaysMinor = 0;
  let totalDue30DaysMinor = 0;

  for (const res of upcomingResources) {
    if (!res.renewalDate) continue;
    const renewalMs = new Date(res.renewalDate).getTime();
    const daysRemaining = Math.max(0, Math.ceil((renewalMs - nowDate.getTime()) / (1000 * 60 * 60 * 24)));
    const amountFormatted = formatCurrency(res.amountMinor, res.currency || defaultCurrency);

    const item: DigestItem = {
      id: res.id,
      name: res.name,
      type: res.type,
      provider: res.provider,
      renewalDate: res.renewalDate,
      daysRemaining,
      amountFormatted,
    };

    totalDue30DaysMinor += res.amountMinor || 0;

    if (daysRemaining <= 7) {
      totalDue7DaysMinor += res.amountMinor || 0;
      itemsDue7Days.push(item);
    } else {
      itemsDue30Days.push(item);
    }
  }

  // Sort upcoming items by urgency
  itemsDue7Days.sort((a, b) => a.daysRemaining - b.daysRemaining);
  itemsDue30Days.sort((a, b) => a.daysRemaining - b.daysRemaining);

  // 3. Seat Optimization & Bloat Waste Report
  let totalWasteAnnualFormatted = "$0.00";
  let overprovisionedCount = 0;
  const overprovisionedNames: string[] = [];

  try {
    const seatReport = await getWorkspaceSeatOptimizationReport(workspaceId);
    totalWasteAnnualFormatted = `${defaultCurrency} ${(seatReport.totalAnnualWastedSpend || 0).toFixed(2)}`;
    const overprovisionedList = (seatReport.allTrackedResources || []).filter(
      (r) => r.status === "warning" || r.status === "critical"
    );
    overprovisionedCount = overprovisionedList.length;
    for (const item of overprovisionedList) {
      overprovisionedNames.push(item.resourceName);
    }
  } catch {
    // If seat tracking table or metrics unavailable, fallback gracefully
  }

  // 4. Executive Summary
  const countTotal = itemsDue7Days.length + itemsDue30Days.length;
  const summary = `${countTotal} renewals due in the next 30 days (${formatCurrency(
    totalDue30DaysMinor,
    defaultCurrency
  )}). ${itemsDue7Days.length} critical in the next 7 days. Potential seat savings: ${totalWasteAnnualFormatted}/yr.`;

  // 5. Generate Markdown for Chat Integrations & CLI
  const markdownLines = [
    `# 📋 Executive Renewal & Cost Digest: **${workspaceName}**`,
    `*Generated on ${nowDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}*`,
    ``,
    `### 💰 30-Day Cashflow Commitment`,
    `- **Next 7 Days:** ${formatCurrency(totalDue7DaysMinor, defaultCurrency)} (${itemsDue7Days.length} services)`,
    `- **Next 30 Days Total:** ${formatCurrency(totalDue30DaysMinor, defaultCurrency)} (${countTotal} services)`,
    ``,
  ];

  if (itemsDue7Days.length > 0) {
    markdownLines.push(`### ⚠️ Urgent Renewals (Next 7 Days)`);
    for (const item of itemsDue7Days) {
      markdownLines.push(
        `- **${item.name}** (${item.provider || item.type}): ${item.amountFormatted} • due in ${item.daysRemaining}d (${item.renewalDate.toLocaleDateString()})`
      );
    }
    markdownLines.push(``);
  }

  if (overprovisionedCount > 0) {
    markdownLines.push(`### 💡 License & Seat Optimization`);
    markdownLines.push(
      `- Found **${overprovisionedCount}** over-provisioned service(s) with idle seats (${overprovisionedNames.join(", ")}).`
    );
    markdownLines.push(`- Estimated potential savings: **${totalWasteAnnualFormatted}/yr**.`);
    markdownLines.push(``);
  }

  const markdown = markdownLines.join("\n");

  // 6. Generate HTML for Email Notifications
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.5;">
      <div style="background: #059669; padding: 24px; border-radius: 12px 12px 0 0; color: white;">
        <h2 style="margin: 0; font-size: 20px;">Duesora Executive Renewal Digest</h2>
        <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">${workspaceName}</p>
      </div>
      <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #ffffff;">
        <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 0;">${summary}</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: #64748b;">30-Day Renewal Forecast</h4>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Due Next 7 Days:</strong> ${formatCurrency(totalDue7DaysMinor, defaultCurrency)}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Total 30-Day Due:</strong> ${formatCurrency(totalDue30DaysMinor, defaultCurrency)}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Potential Seat Savings:</strong> ${totalWasteAnnualFormatted}/year</p>
        </div>
      </div>
    </div>
  `.trim();

  return {
    workspaceId,
    workspaceName,
    generatedAt: nowDate.toISOString(),
    currency: defaultCurrency,
    summary,
    totalDue30DaysMinor,
    totalDue7DaysMinor,
    itemsDue7Days,
    itemsDue30Days,
    seatOptimization: {
      totalWasteAnnualFormatted,
      overprovisionedServicesCount: overprovisionedCount,
    },
    markdown,
    html,
  };
}

/**
 * Dispatches the compiled digest across in-app notifications and webhooks
 */
export async function dispatchWorkspaceDigest(
  digest: WorkspaceDigest,
  targetUserId?: string
): Promise<{
  inAppNotificationId?: string;
  webhookDispatched: boolean;
}> {
  // 1. Create in-app notification
  let inAppNotificationId: string | undefined;
  try {
    const db = getDb();
    let recipientUserId = targetUserId;
    if (!recipientUserId && db?.select) {
      try {
        const rows = await db
          .select({ userId: memberships.userId })
          .from(memberships)
          .where(eq(memberships.workspaceId, digest.workspaceId))
          .limit(1);
        recipientUserId = rows[0]?.userId;
      } catch {
        // Ignore query error in mock contexts
      }
    }

    if (!recipientUserId) {
      recipientUserId = "system";
    }

    if (recipientUserId) {
      const notif = await createNotification({
        workspaceId: digest.workspaceId,
        userId: recipientUserId,
        title: `Executive Digest: ${digest.itemsDue7Days.length + digest.itemsDue30Days.length} Upcoming Renewals`,
        message: digest.summary,
        type: "renewal_upcoming",
        severity: digest.itemsDue7Days.length > 0 ? "warning" : "info",
      });
      inAppNotificationId = notif.id;
    }
  } catch (err) {
    console.error("Failed to record in-app digest notification:", err);
  }

  // 2. Dispatch webhook
  let webhookDispatched = false;
  try {
    await emitWorkspaceWebhook(digest.workspaceId, "workspace.digest", {
      digest: digest as unknown as Record<string, unknown>,
      timestamp: new Date().toISOString(),
    });
    webhookDispatched = true;
  } catch (err) {
    console.error("Failed to emit digest webhook:", err);
  }

  return {
    inAppNotificationId,
    webhookDispatched,
  };
}
