import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { renewWorkspaceResource } from "@/lib/renewals/service";
import { resolveResourceRouteParams } from "@/lib/api/route-params";

export async function POST(request: NextRequest, context?: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const { workspaceId, resourceId } = await resolveResourceRouteParams(request, context);
    if (!workspaceId || !resourceId) {
      return NextResponse.json(
        { error: { message: "Missing required workspaceId or resourceId" } },
        { status: 400 }
      );
    }

    const updatedResource = await renewWorkspaceResource(
      session.user.id,
      workspaceId,
      resourceId
    );

    return NextResponse.json({
      data: {
        resource: updatedResource,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to renew resource";
    const status = message === "FORBIDDEN" ? 403 : message === "Resource not found" ? 404 : 500;
    return NextResponse.json({ error: { message } }, { status });
  }
}
