import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import {
  isEmailConfigured,
  sendRenewalReminderEmail,
} from "@/lib/notifications/email";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const { workspaceId } = await context.params;
    if (!workspaceId) {
      return NextResponse.json({ error: { message: "Missing workspaceId" } }, { status: 400 });
    }

    await requireWorkspaceRole(session.user.id, workspaceId, "viewer");

    const configured = isEmailConfigured();
    const sender = process.env.NOTIFICATION_FROM_EMAIL || "notifications@duesora.com";
    const host = process.env.SMTP_HOST || null;
    const port = process.env.SMTP_PORT || "587";

    return NextResponse.json({
      data: {
        isConfigured: configured,
        sender,
        host: host ? `${host}:${port}` : null,
        recipientEmail: session.user.email || null,
        mode: configured ? "smtp" : "simulated",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch email status";
    const status = message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { message } }, { status });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const { workspaceId } = await context.params;
    if (!workspaceId) {
      return NextResponse.json({ error: { message: "Missing workspaceId" } }, { status: 400 });
    }

    const membership = await requireWorkspaceRole(session.user.id, workspaceId, "member");
    const recipientEmail = session.user.email;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: { message: "User does not have a verified email address" } },
        { status: 400 }
      );
    }

    const renewalDate = new Date();
    renewalDate.setDate(renewalDate.getDate() + 7);

    const result = await sendRenewalReminderEmail({
      to: recipientEmail,
      recipientName: session.user.name || "Duesora Admin",
      resourceName: "Example Service (Test Alert)",
      resourceType: "subscription",
      provider: "Duesora Cloud Notification System",
      daysRemaining: 7,
      renewalDate,
      amountMinor: 2999,
      currency: "USD",
      billingCycle: "monthly",
      resourceId: "test-resource-id",
      workspaceName: "Duesora Workspace",
    });

    return NextResponse.json({
      success: result.success,
      data: {
        recipient: recipientEmail,
        simulated: result.simulated ?? false,
        messageId: result.messageId || null,
        smtpConfigured: isEmailConfigured(),
        sender: process.env.NOTIFICATION_FROM_EMAIL || "notifications@duesora.com",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send test email";
    const status = message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { message } }, { status });
  }
}
