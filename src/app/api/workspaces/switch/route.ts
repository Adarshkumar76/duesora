import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorkspaceMembership } from "@/lib/auth/workspace";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/auth/active-workspace";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to switch workspace",
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { workspaceId } = body;

    if (!workspaceId || typeof workspaceId !== "string") {
      return NextResponse.json(
        {
          error: {
            code: "BAD_REQUEST",
            message: "workspaceId is required",
          },
        },
        { status: 400 }
      );
    }

    // Verify user is a member of the target workspace
    const membership = await getWorkspaceMembership(session.user.id, workspaceId);
    if (!membership) {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "You are not a member of this workspace",
          },
        },
        { status: 403 }
      );
    }

    const response = NextResponse.json(
      {
        data: {
          success: true,
          workspaceId,
        },
      },
      { status: 200 }
    );

    // Set active workspace cookie
    response.cookies.set({
      name: ACTIVE_WORKSPACE_COOKIE,
      value: workspaceId,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed switching workspace",
        },
      },
      { status: 500 }
    );
  }
}
