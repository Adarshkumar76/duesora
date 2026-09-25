import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { resources } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { recordAuditEvent } from "@/lib/audit/service";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string; resourceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { workspaceId, resourceId } = await context.params;
    await requireWorkspaceRole(session.user.id, workspaceId, "member");

    const body = await request.json().catch(() => ({}));

    const updateData: {
      amountMinor?: number;
      currency?: string;
      billingCycle?: "monthly" | "yearly" | "quarterly" | "weekly" | "one_time";
      renewalDate?: Date;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (typeof body.amountMinor === "number" && body.amountMinor >= 0) {
      updateData.amountMinor = Math.round(body.amountMinor);
    }

    if (typeof body.currency === "string" && body.currency.length === 3) {
      updateData.currency = body.currency.toUpperCase();
    }

    if (body.billingCycle && ["monthly", "yearly", "quarterly"].includes(body.billingCycle)) {
      updateData.billingCycle = body.billingCycle;
    }

    if (body.renewalDate) {
      const d = new Date(body.renewalDate);
      if (!isNaN(d.getTime())) {
        updateData.renewalDate = d;
      }
    }

    const db = getDb();
    const [updatedResource] = await db
      .update(resources)
      .set(updateData)
      .where(and(eq(resources.id, resourceId), eq(resources.workspaceId, workspaceId)))
      .returning();

    if (!updatedResource) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Resource not found" } },
        { status: 404 }
      );
    }

    // Record audit event
    await recordAuditEvent({
      workspaceId,
      actorId: session.user.id,
      action: "resource.updated",
      entityType: "resource",
      entityId: resourceId,
      details: {
        reason: "Applied extracted invoice metadata",
        updatedFields: Object.keys(updateData).filter((k) => k !== "updatedAt"),
      },
    }).catch(() => {});

    return Response.json({
      success: true,
      data: updatedResource,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json(
        { error: { code: "FORBIDDEN", message: "Editor permissions required to update resource" } },
        { status: 403 }
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to apply invoice metadata",
        },
      },
      { status: 500 }
    );
  }
}
