import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import {
  getNotificationChannelById,
  updateNotificationChannel,
  deleteNotificationChannel,
} from "@/lib/integrations/chat/repository";
import { updateNotificationChannelSchema } from "@/lib/integrations/chat/validation";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ workspaceId: string; channelId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { workspaceId, channelId } = await params;
    await requireWorkspaceRole(session.user.id, workspaceId, "admin");

    const existing = await getNotificationChannelById(channelId, workspaceId);
    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Integration channel not found" } },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = updateNotificationChannelSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Validation failed";
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: firstError } },
        { status: 400 }
      );
    }

    const updated = await updateNotificationChannel(
      channelId,
      workspaceId,
      parseResult.data
    );

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Admin role required to update integrations" } },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed updating integration",
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { workspaceId, channelId } = await params;
    await requireWorkspaceRole(session.user.id, workspaceId, "admin");

    const existing = await getNotificationChannelById(channelId, workspaceId);
    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Integration channel not found" } },
        { status: 404 }
      );
    }

    const success = await deleteNotificationChannel(channelId, workspaceId);
    return NextResponse.json({ data: { success } }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Admin role required to delete integrations" } },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed deleting integration",
        },
      },
      { status: 500 }
    );
  }
}
