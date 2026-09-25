import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listWorkspaceAuditLogs } from "@/lib/audit/service";
import { resolveWorkspaceId } from "@/lib/api/route-params";

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
    const searchParams = request.nextUrl.searchParams;

    const action = searchParams.get("action") || undefined;
    const entityType = searchParams.get("entityType") || undefined;
    const search = searchParams.get("search") || undefined;
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const rawPageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    const page = isNaN(rawPage) ? 1 : rawPage;
    const pageSize = isNaN(rawPageSize) ? 10 : rawPageSize;

    const result = await listWorkspaceAuditLogs(session.user.id, workspaceId, {
      action,
      entityType,
      search,
      page,
      pageSize,
    });

    return NextResponse.json({
      data: result,
    });
  } catch (err: unknown) {
    console.error("GET /api/workspaces/[workspaceId]/audit error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch audit logs";
    const status = message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { code: message === "FORBIDDEN" ? "FORBIDDEN" : "INTERNAL_ERROR", message } }, { status });
  }
}
