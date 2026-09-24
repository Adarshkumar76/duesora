import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateRenewalDecision, ALLOWED_RENEWAL_DECISIONS } from "@/lib/renewals/decision";
import { resolveResourceRouteParams } from "@/lib/api/route-params";

export async function PUT(request: NextRequest, context?: unknown) {
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

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: { message: "Invalid request payload" } },
        { status: 400 }
      );
    }

    const { decision, notes, cancellationNoticeDays, cancellationDeadline } = body;

    if (!decision || !ALLOWED_RENEWAL_DECISIONS.includes(decision)) {
      return NextResponse.json(
        {
          error: {
            message: `Invalid renewal decision: "${decision}". Allowed decisions are: ${ALLOWED_RENEWAL_DECISIONS.join(", ")}`,
          },
        },
        { status: 400 }
      );
    }

    if (notes && typeof notes === "string" && notes.length > 1000) {
      return NextResponse.json(
        { error: { message: "Decision notes cannot exceed 1000 characters." } },
        { status: 400 }
      );
    }

    const updatedResource = await updateRenewalDecision(
      session.user.id,
      workspaceId,
      resourceId,
      {
        decision,
        notes: notes ?? null,
        cancellationNoticeDays:
          cancellationNoticeDays !== undefined && cancellationNoticeDays !== null
            ? Number(cancellationNoticeDays)
            : undefined,
        cancellationDeadline: cancellationDeadline ?? undefined,
      }
    );

    return NextResponse.json({
      data: {
        resource: updatedResource,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update renewal decision";
    const status =
      message === "FORBIDDEN"
        ? 403
        : message === "Resource not found"
        ? 404
        : message.startsWith("Invalid") || message.includes("cannot exceed") || message.includes("between 0 and 365")
        ? 400
        : 500;

    return NextResponse.json({ error: { message } }, { status });
  }
}
