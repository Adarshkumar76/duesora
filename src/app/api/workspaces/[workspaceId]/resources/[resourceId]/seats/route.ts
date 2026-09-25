import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveResourceRouteParams } from "@/lib/api/route-params";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { updateResourceSeatAllocation } from "@/lib/resources/seats";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, context?: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const { workspaceId, resourceId } = await resolveResourceRouteParams(request, context);

    if (!workspaceId || !resourceId) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Missing required route parameters" } },
        { status: 400 }
      );
    }

    await requireWorkspaceRole(session.user.id, workspaceId, "member");

    const body = await request.json();

    const metrics = await updateResourceSeatAllocation(session.user.id, workspaceId, resourceId, {
      seatTrackingEnabled: body.seatTrackingEnabled ?? true,
      totalSeats: typeof body.totalSeats === "number" ? body.totalSeats : null,
      assignedSeats: typeof body.assignedSeats === "number" ? body.assignedSeats : null,
      costPerSeatMinor: typeof body.costPerSeatMinor === "number" ? body.costPerSeatMinor : null,
    });

    return NextResponse.json({
      data: metrics,
    });
  } catch (err: unknown) {
    console.error("PATCH /api/workspaces/[workspaceId]/resources/[resourceId]/seats error:", err);
    const message = err instanceof Error ? err.message : "Failed to update seat allocation";
    const statusCode = message === "FORBIDDEN" ? 403 : message === "NOT_FOUND" ? 404 : 500;
    return NextResponse.json(
      { error: { code: message === "FORBIDDEN" ? "FORBIDDEN" : "INTERNAL_ERROR", message } },
      { status: statusCode }
    );
  }
}
