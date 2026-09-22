import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { revokeInvitation } from "@/lib/team/service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ workspaceId: string; invitationId: string }>;
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

    const { workspaceId, invitationId } = await params;
    await revokeInvitation(workspaceId, invitationId, session.user.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Only workspace admins and owners can revoke invitations" } },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed revoking invitation",
        },
      },
      { status: 500 }
    );
  }
}
