import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveWorkspaceId } from "@/lib/api/route-params";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { getWorkspaceSeatOptimizationReport } from "@/lib/resources/seats";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context?: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
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

    await requireWorkspaceRole(session.user.id, workspaceId, "viewer");

    const report = await getWorkspaceSeatOptimizationReport(workspaceId);

    return NextResponse.json({
      data: report,
    });
  } catch (err: unknown) {
    console.error("GET /api/workspaces/[workspaceId]/seats/optimization error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch seat optimization report";
    const statusCode = message === "FORBIDDEN" ? 403 : message === "NOT_FOUND" ? 404 : 500;
    return NextResponse.json(
      { error: { code: message === "FORBIDDEN" ? "FORBIDDEN" : "INTERNAL_ERROR", message } },
      { status: statusCode }
    );
  }
}
