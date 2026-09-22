import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateMemberRole, removeMemberFromWorkspace } from "@/lib/team/service";
import { z } from "zod";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ workspaceId: string; memberId: string }>;
}

const updateRoleSchema = z.object({
  role: z.enum(["admin", "member", "viewer"]),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { workspaceId, memberId } = await params;
    const body = await request.json();
    const parsed = updateRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid role specified" } },
        { status: 400 }
      );
    }

    await updateMemberRole(workspaceId, memberId, parsed.data.role, session.user.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Insufficient permissions to change this member's role" } },
          { status: 403 }
        );
      }
      if (error.message === "CANNOT_MODIFY_OWNER") {
        return NextResponse.json(
          { error: { code: "BAD_REQUEST", message: "Workspace owner role cannot be modified" } },
          { status: 400 }
        );
      }
      if (error.message === "MEMBER_NOT_FOUND") {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Member not found in this workspace" } },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed updating member role",
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

    const { workspaceId, memberId } = await params;
    await removeMemberFromWorkspace(workspaceId, memberId, session.user.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Insufficient permissions to remove this member" } },
          { status: 403 }
        );
      }
      if (error.message === "CANNOT_REMOVE_OWNER") {
        return NextResponse.json(
          { error: { code: "BAD_REQUEST", message: "Workspace owner cannot be removed" } },
          { status: 400 }
        );
      }
      if (error.message === "MEMBER_NOT_FOUND") {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Member not found" } },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed removing member",
        },
      },
      { status: 500 }
    );
  }
}
