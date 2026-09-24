import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { bulkPerformResourceAction } from "@/lib/resources/bulk";
import { resolveWorkspaceId } from "@/lib/api/route-params";

const bulkActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("bulk_tag"),
    resourceIds: z.array(z.string().uuid()).min(1, "At least one resource must be selected").max(100),
    tags: z.array(z.string().trim().min(1).max(50)).max(20),
    mode: z.enum(["add", "remove", "replace"]).optional(),
  }),
  z.object({
    action: z.literal("bulk_owner"),
    resourceIds: z.array(z.string().uuid()).min(1, "At least one resource must be selected").max(100),
    ownerId: z.string().uuid().nullable(),
  }),
  z.object({
    action: z.literal("bulk_status"),
    resourceIds: z.array(z.string().uuid()).min(1, "At least one resource must be selected").max(100),
    status: z.enum(["active", "inactive", "expired", "archived"]),
  }),
  z.object({
    action: z.literal("bulk_delete"),
    resourceIds: z.array(z.string().uuid()).min(1, "At least one resource must be selected").max(100),
  }),
]);

export async function POST(request: NextRequest, context?: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const workspaceId = await resolveWorkspaceId(request, context);
    if (!workspaceId) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Missing or invalid workspaceId parameter" } },
        { status: 400 }
      );
    }
    const body = await request.json().catch(() => null);

    const parseResult = bulkActionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid bulk action request payload",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const result = await bulkPerformResourceAction(
      session.user.id,
      workspaceId,
      parseResult.data
    );

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Insufficient permissions for this workspace" } },
        { status: 403 }
      );
    }

    console.error("POST /api/workspaces/[workspaceId]/resources/bulk error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to perform bulk resource action" } },
      { status: 500 }
    );
  }
}
