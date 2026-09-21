import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { sendWebhookPing } from "@/lib/webhooks/dispatcher";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ workspaceId: string; endpointId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to test webhook endpoint",
          },
        },
        { status: 401 }
      );
    }

    const { workspaceId, endpointId } = await context.params;
    const userId = session.user.id;

    await requireWorkspaceRole(userId, workspaceId, "admin");

    const result = await sendWebhookPing(workspaceId, endpointId);

    return Response.json({ data: result }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "You must be an admin or owner to test webhook endpoints",
          },
        },
        { status: 403 }
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to trigger webhook test",
        },
      },
      { status: 500 }
    );
  }
}
