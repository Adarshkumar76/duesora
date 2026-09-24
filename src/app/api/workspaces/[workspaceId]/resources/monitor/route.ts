import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { runAutomatedMonitoringJob } from "@/lib/monitors/service";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const { workspaceId } = await context.params;
    if (!workspaceId) {
      return NextResponse.json(
        { error: { message: "Missing required workspaceId" } },
        { status: 400 }
      );
    }

    await requireWorkspaceRole(session.user.id, workspaceId, "member");

    const summary = await runAutomatedMonitoringJob({ workspaceId });

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to run health check sweep";
    const status = message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { message } }, { status });
  }
}
