import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { memberships } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { listUserWorkspaces } from "@/lib/auth/workspace";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/auth/active-workspace";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{
    workspaceId: string;
  }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const { workspaceId } = await params;
    const db = getDb();

    // 1. Fetch user's membership in this workspace
    const [userMembership] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.workspaceId, workspaceId),
          eq(memberships.userId, session.user.id)
        )
      )
      .limit(1);

    if (!userMembership) {
      return NextResponse.json(
        { error: { message: "You are not a member of this workspace." } },
        { status: 404 }
      );
    }

    // 2. If user is owner, check whether other owners exist
    if (userMembership.role === "owner") {
      const allOwners = await db
        .select({ id: memberships.id })
        .from(memberships)
        .where(
          and(
            eq(memberships.workspaceId, workspaceId),
            eq(memberships.role, "owner")
          )
        );

      if (allOwners.length <= 1) {
        return NextResponse.json(
          {
            error: {
              message:
                "You are the sole owner of this workspace. Please transfer ownership to another member before leaving, or delete the workspace.",
            },
          },
          { status: 400 }
        );
      }
    }

    // 3. Delete user's membership
    await db
      .delete(memberships)
      .where(
        and(
          eq(memberships.workspaceId, workspaceId),
          eq(memberships.userId, session.user.id)
        )
      );

    // 4. Resolve next active workspace
    const remaining = await listUserWorkspaces(session.user.id);
    const nextWorkspaceId = remaining[0]?.id || null;

    const response = NextResponse.json({
      success: true,
      message: "You have left the workspace.",
      redirectUrl: "/dashboard",
    });

    if (nextWorkspaceId) {
      response.cookies.set(ACTIVE_WORKSPACE_COOKIE, nextWorkspaceId, {
        path: "/",
        sameSite: "lax",
        httpOnly: true,
      });
    } else {
      response.cookies.delete(ACTIVE_WORKSPACE_COOKIE);
    }

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to leave workspace";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
