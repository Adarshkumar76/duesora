import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getInvitationByToken, acceptWorkspaceInvitation } from "@/lib/team/service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const result = await getInvitationByToken(token);

    if (!result.valid) {
      return NextResponse.json(
        { error: { code: "INVALID_INVITATION", message: result.reason } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: result.invitation }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed retrieving invitation",
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "You must be signed in to accept this invitation",
          },
        },
        { status: 401 }
      );
    }

    const { token } = await params;
    const result = await acceptWorkspaceInvitation(token, session.user.id);

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVITATION_NOT_FOUND") {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Invitation not found" } },
          { status: 404 }
        );
      }
      if (error.message === "ALREADY_ACCEPTED") {
        return NextResponse.json(
          { error: { code: "CONFLICT", message: "Invitation has already been accepted" } },
          { status: 409 }
        );
      }
      if (error.message === "INVITATION_EXPIRED") {
        return NextResponse.json(
          { error: { code: "GONE", message: "Invitation has expired" } },
          { status: 410 }
        );
      }
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed accepting invitation",
        },
      },
      { status: 500 }
    );
  }
}
