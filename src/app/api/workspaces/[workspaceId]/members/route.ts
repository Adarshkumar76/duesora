import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { listWorkspaceMembers } from "@/lib/auth/workspace";

export const dynamic = "force-dynamic";

export async function GET(
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
            message: "Authentication required to view workspace members",
          },
        },
        { status: 401 }
      );
    }

    const { workspaceId } = await context.params;
    const userId = session.user.id;

    const members = await listWorkspaceMembers(userId, workspaceId);

    return Response.json({
      data: members,
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
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        },
      },
      { status: 500 }
    );
  }
}
