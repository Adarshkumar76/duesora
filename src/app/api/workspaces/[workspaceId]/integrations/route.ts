import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import {
  listNotificationChannels,
  createNotificationChannel,
} from "@/lib/integrations/chat/repository";
import { createNotificationChannelSchema } from "@/lib/integrations/chat/validation";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { workspaceId } = await params;
    await requireWorkspaceRole(session.user.id, workspaceId, "viewer");

    const channels = await listNotificationChannels(workspaceId);
    return NextResponse.json({ data: channels }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed fetching channels",
        },
      },
      { status: 500 }
    );
  }
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
    const parseResult = createNotificationChannelSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Validation failed";
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: firstError } },
        { status: 400 }
      );
    }

    const channel = await createNotificationChannel({
      workspaceId,
      provider: parseResult.data.provider,
      name: parseResult.data.name,
      webhookUrl: parseResult.data.webhookUrl,
      events: parseResult.data.events,
      active: parseResult.data.active,
    });

    return NextResponse.json({ data: channel }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Admin role required to configure chat integrations" } },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed creating channel",
        },
      },
      { status: 500 }
    );
  }
}
