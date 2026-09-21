import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import {
  listUserNotifications,
  markAllNotificationsRead,
} from "@/lib/notifications/repository";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to view notifications",
          },
        },
        { status: 401 }
      );
    }

    const { workspaceId } = await context.params;
    const userId = session.user.id;

    await requireWorkspaceRole(userId, workspaceId, "viewer");

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") as "unread" | "read" | "all" | null;
    const severity = searchParams.get("severity") as "info" | "warning" | "critical" | null;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    const result = await listUserNotifications(userId, workspaceId, {
      status: status || undefined,
      severity: severity || undefined,
      page,
      pageSize,
    });

    return Response.json(
      {
        data: result.items,
        meta: {
          total: result.total,
          unreadCount: result.unreadCount,
          page,
          pageSize,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "You do not have access to notifications in this workspace",
          },
        },
        { status: 403 }
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to load notifications",
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  _request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to update notifications",
          },
        },
        { status: 401 }
      );
    }

    const { workspaceId } = await context.params;
    const userId = session.user.id;

    await requireWorkspaceRole(userId, workspaceId, "viewer");

    const updatedCount = await markAllNotificationsRead(userId, workspaceId);

    return Response.json(
      {
        data: {
          updatedCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "You do not have access to notifications in this workspace",
          },
        },
        { status: 403 }
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to mark notifications read",
        },
      },
      { status: 500 }
    );
  }
}
