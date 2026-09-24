import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveWorkspaceId } from "@/lib/api/route-params";
import {
  getWorkspaceBudgetStatus,
  upsertWorkspaceBudget,
} from "@/lib/budgets/service";

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

    const status = await getWorkspaceBudgetStatus(session.user.id, workspaceId);

    return NextResponse.json({
      data: status,
    });
  } catch (err: unknown) {
    console.error("GET /api/workspaces/[workspaceId]/budgets error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch workspace budget status";
    const statusCode = message === "FORBIDDEN" ? 403 : message === "NOT_FOUND" ? 404 : 500;
    return NextResponse.json(
      { error: { code: message === "FORBIDDEN" ? "FORBIDDEN" : "INTERNAL_ERROR", message } },
      { status: statusCode }
    );
  }
}

export async function PUT(request: NextRequest, context?: unknown) {
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

    const body = await request.json();
    const ipAddress = request.headers.get("x-forwarded-for") || undefined;

    const updated = await upsertWorkspaceBudget(
      session.user.id,
      workspaceId,
      {
        monthlyBudgetMinor: body.monthlyBudgetMinor,
        annualBudgetMinor: body.annualBudgetMinor,
        currency: body.currency,
        alertThresholdPct: body.alertThresholdPct,
        alertEmailsEnabled: body.alertEmailsEnabled,
      },
      ipAddress
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err: unknown) {
    console.error("PUT /api/workspaces/[workspaceId]/budgets error:", err);
    const message = err instanceof Error ? err.message : "Failed to update workspace budget";
    const statusCode = message === "FORBIDDEN" ? 403 : message.includes("Unsupported currency") ? 400 : 500;
    return NextResponse.json(
      { error: { code: message === "FORBIDDEN" ? "FORBIDDEN" : "INTERNAL_ERROR", message } },
      { status: statusCode }
    );
  }
}
