import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorkspaceDashboardData } from "@/lib/dashboard/service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "You must be signed in to access workspace dashboard.",
        },
      },
      { status: 401 }
    );
  }

  const { workspaceId } = await context.params;

  try {
    const data = await getWorkspaceDashboardData(session.user.id, workspaceId);

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to view this workspace dashboard.",
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load dashboard data.",
        },
      },
      { status: 500 }
    );
  }
}
