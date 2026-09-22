import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createWorkspaceInvitation } from "@/lib/team/service";
import { z } from "zod";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

const inviteSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address"),
  role: z.enum(["admin", "member", "viewer"]).default("member"),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { workspaceId } = await params;
    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid invitation input",
          },
        },
        { status: 400 }
      );
    }

    const appUrl = request.nextUrl.origin;
    const result = await createWorkspaceInvitation({
      workspaceId,
      callerUserId: session.user.id,
      email: parsed.data.email,
      role: parsed.data.role,
      appUrl,
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Only workspace admins and owners can send invitations" } },
          { status: 403 }
        );
      }
      if (error.message === "ALREADY_MEMBER") {
        return NextResponse.json(
          { error: { code: "CONFLICT", message: "This user is already an active member of this workspace" } },
          { status: 409 }
        );
      }
      if (error.message === "WORKSPACE_NOT_FOUND") {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Workspace not found" } },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed sending invitation",
        },
      },
      { status: 500 }
    );
  }
}
