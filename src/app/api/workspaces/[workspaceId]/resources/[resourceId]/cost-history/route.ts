import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { listResourceCostHistory } from "@/lib/resources/cost-history";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string; resourceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to access resource cost history",
          },
        },
        { status: 401 }
      );
    }

    const { workspaceId, resourceId } = await context.params;
    const userId = session.user.id;

    const history = await listResourceCostHistory(userId, workspaceId, resourceId);

    return Response.json({
      data: history,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "You do not have access to this workspace",
          },
        },
        { status: 403 }
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch resource cost history",
        },
      },
      { status: 500 }
    );
  }
}
