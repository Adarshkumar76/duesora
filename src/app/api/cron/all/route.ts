import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { workspaces } from "@/db/schema";
import { verifyCronAuthorization } from "@/lib/cron/auth";
import { runAutomatedMonitoringJob } from "@/lib/monitors/service";
import { processWorkspaceReminders } from "@/lib/notifications/reminder-engine";

export const dynamic = "force-dynamic";

async function handleAllCron(request: NextRequest) {
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
    // 1. Run monitoring job
    const monitorSummary = await runAutomatedMonitoringJob({
      workspaceId: targetWorkspaceId || undefined,
    });

    // 2. Run renewal reminder checks
    let workspaceList: Array<{ id: string }>;
    if (targetWorkspaceId) {
      workspaceList = [{ id: targetWorkspaceId }];
    } else {
      workspaceList = await db.select({ id: workspaces.id }).from(workspaces);
    }

    const reminderSummaries = [];
    for (const ws of workspaceList) {
      try {
        const wsSummary = await processWorkspaceReminders(ws.id);
        reminderSummaries.push(wsSummary);
      } catch (err) {
        reminderSummaries.push({
          workspaceId: ws.id,
          scannedCount: 0,
          dispatchedInAppCount: 0,
          dispatchedEmailCount: 0,
          skippedCount: 0,
          errors: [err instanceof Error ? err.message : "Reminder engine error"],
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        source: authResult.source,
        timestamp: new Date().toISOString(),
        data: {
          monitoring: monitorSummary,
          reminders: reminderSummaries,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed executing all cron jobs",
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleAllCron(request);
}

export async function POST(request: NextRequest) {
  return handleAllCron(request);
}
