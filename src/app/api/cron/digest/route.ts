import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { workspaces } from "@/db/schema";
import { verifyCronAuthorization } from "@/lib/cron/auth";
import { compileWorkspaceDigest, dispatchWorkspaceDigest } from "@/lib/reports/digest";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleDigestCron(request);
}

export async function POST(request: NextRequest) {
  return handleDigestCron(request);
}

async function handleDigestCron(request: NextRequest) {
  // 1. Authorize cron trigger
  const authResult = await verifyCronAuthorization(request);
  if (!authResult.authorized) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: authResult.reason || "Unauthorized cron execution",
        },
      },
      { status: 401 }
    );
  }

  const db = getDb();
  const targetWorkspaceId = request.nextUrl.searchParams.get("workspaceId");

  try {
    let workspaceList: Array<{ id: string; name: string }>;

    if (targetWorkspaceId) {
      workspaceList = await db
        .select({ id: workspaces.id, name: workspaces.name })
        .from(workspaces)
        .where(undefined);
      workspaceList = workspaceList.filter((w) => w.id === targetWorkspaceId);
    } else {
      workspaceList = await db
        .select({ id: workspaces.id, name: workspaces.name })
        .from(workspaces);
    }

    const results = [];

    for (const ws of workspaceList) {
      try {
        const digest = await compileWorkspaceDigest(ws.id);
        const dispatchResult = await dispatchWorkspaceDigest(digest);

        results.push({
          workspaceId: ws.id,
          workspaceName: ws.name,
          success: true,
          itemsCount: digest.itemsDue7Days.length + digest.itemsDue30Days.length,
          totalDue30DaysMinor: digest.totalDue30DaysMinor,
          dispatchResult,
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to generate digest";
        results.push({
          workspaceId: ws.id,
          workspaceName: ws.name,
          success: false,
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      status: "ok",
      processedCount: results.length,
      successCount: results.filter((r) => r.success).length,
      data: results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error processing digests";
    console.error("Cron Digest Error:", err);
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
