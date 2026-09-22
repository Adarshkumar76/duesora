import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { getNotificationChannelById } from "@/lib/integrations/chat/repository";
import { sendTestChatAlert } from "@/lib/integrations/chat/dispatcher";
import {
  isValidSlackWebhookUrl,
  isValidDiscordWebhookUrl,
} from "@/lib/integrations/chat/validation";
import { getDb } from "@/db";
import { workspaces } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { NotificationChannelItem, ChatProvider } from "@/lib/integrations/chat/types";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { workspaceId } = await params;
    await requireWorkspaceRole(session.user.id, workspaceId, "admin");

    const body = await request.json().catch(() => ({}));
    const { channelId, provider, webhookUrl, name } = body;

    let targetChannel: NotificationChannelItem;

    if (channelId) {
      const channel = await getNotificationChannelById(channelId, workspaceId);
      if (!channel) {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Channel not found" } },
          { status: 404 }
        );
      }
      targetChannel = channel;
    } else {
      if (!provider || (provider !== "slack" && provider !== "discord")) {
        return NextResponse.json(
          { error: { code: "BAD_REQUEST", message: "Provider must be 'slack' or 'discord'" } },
          { status: 400 }
        );
      }

      if (!webhookUrl || typeof webhookUrl !== "string") {
        return NextResponse.json(
          { error: { code: "BAD_REQUEST", message: "webhookUrl is required" } },
          { status: 400 }
        );
      }

      if (provider === "slack" && !isValidSlackWebhookUrl(webhookUrl)) {
        return NextResponse.json(
          { error: { code: "BAD_REQUEST", message: "Invalid Slack webhook URL (must start with https://hooks.slack.com/services/)" } },
          { status: 400 }
        );
      }

      if (provider === "discord" && !isValidDiscordWebhookUrl(webhookUrl)) {
        return NextResponse.json(
          { error: { code: "BAD_REQUEST", message: "Invalid Discord webhook URL (must start with https://discord.com/api/webhooks/)" } },
          { status: 400 }
        );
      }

      targetChannel = {
        id: "temp-test",
        workspaceId,
        provider: provider as ChatProvider,
        name: name || (provider === "slack" ? "Slack Channel" : "Discord Channel"),
        webhookUrl,
        events: ["*"],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    let workspaceName = "Workspace";
    try {
      const db = getDb();
      const [ws] = await db
        .select({ name: workspaces.name })
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);
      if (ws?.name) workspaceName = ws.name;
    } catch {
      // Safe fallback
    }

    const testResult = await sendTestChatAlert(targetChannel, {
      workspaceName,
      channelName: targetChannel.name,
      provider: targetChannel.provider,
      testedBy: session.user.name || session.user.email || "Administrator",
    });

    if (!testResult.success) {
      return NextResponse.json(
        {
          error: {
            code: "DELIVERY_FAILED",
            message: testResult.error || "Failed sending test notification to channel",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        data: {
          success: true,
          message: `Test alert sent successfully to ${targetChannel.provider === "slack" ? "Slack" : "Discord"}!`,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Admin role required to test integrations" } },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed testing integration",
        },
      },
      { status: 500 }
    );
  }
}
