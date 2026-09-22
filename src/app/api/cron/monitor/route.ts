import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuthorization } from "@/lib/cron/auth";
import { runAutomatedMonitoringJob } from "@/lib/monitors/service";

export const dynamic = "force-dynamic";

async function handleMonitorCron(request: NextRequest) {
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

  const workspaceId = request.nextUrl.searchParams.get("workspaceId") || undefined;

  try {
    const summary = await runAutomatedMonitoringJob({ workspaceId });

    return NextResponse.json(
      {
        success: true,
        source: authResult.source,
        timestamp: new Date().toISOString(),
        data: summary,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed executing monitoring cron job",
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleMonitorCron(request);
}

export async function POST(request: NextRequest) {
  return handleMonitorCron(request);
}
