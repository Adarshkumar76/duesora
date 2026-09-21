import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { markNotificationRead } from "@/lib/notifications/repository";

export const dynamic = "force-dynamic";

export async function PATCH(
  _request: NextRequest,
  context: { params: Promise<{ workspaceId: string; notificationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to update notification",
          },
        },
        { status: 401 }
      );
    }

    const { workspaceId, notificationId } = await context.params;
    const userId = session.user.id;

    await requireWorkspaceRole(userId, workspaceId, "viewer");

    const success = await markNotificationRead(userId, notificationId);
    if (!success) {
      return Response.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Notification not found or already read",
          },
        },
        { status: 404 }
      );
    }

    return Response.json(
      {
        data: {
          id: notificationId,
          status: "read",
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
          message: error instanceof Error ? error.message : "Failed to update notification",
        },
      },
      { status: 500 }
    );
  }
}
