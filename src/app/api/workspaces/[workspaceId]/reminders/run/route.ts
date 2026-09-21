import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { processWorkspaceReminders } from "@/lib/notifications/reminder-engine";

export const dynamic = "force-dynamic";

export async function POST(
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
            message: "Authentication required to trigger reminder engine",
          },
        },
        { status: 401 }
      );
    }

    const { workspaceId } = await context.params;
    const userId = session.user.id;

    // Only admins or owners can trigger the reminder engine
    await requireWorkspaceRole(userId, workspaceId, "admin");

    const summary = await processWorkspaceReminders(workspaceId);

    return Response.json(
      {
        data: summary,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "You must be an admin or owner to trigger the reminder engine",
          },
        },
        { status: 403 }
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to run reminder engine",
        },
      },
      { status: 500 }
    );
  }
}
