import { NextRequest } from "next/server";
import { authenticateV1Request } from "@/lib/api/v1-auth";
import {
  getResourceById,
  updateResource,
  deleteResource,
} from "@/lib/resources/repository";
import { recordAuditEvent } from "@/lib/audit/service";
import { emitWorkspaceWebhook } from "@/lib/webhooks/dispatcher";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { auth, response } = await authenticateV1Request(request, "read");
  if (response || !auth) return response!;

  const { id } = await context.params;
  const resource = await getResourceById(auth.workspaceId, id);

  if (!resource) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: `Resource "${id}" not found` } },
      { status: 404 }
    );
  }

  return Response.json({ data: resource });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { auth, response } = await authenticateV1Request(request, "write");
  if (response || !auth) return response!;

  const { id } = await context.params;
  const existing = await getResourceById(auth.workspaceId, id);
  if (!existing) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: `Resource "${id}" not found` } },
      { status: 404 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json(
        { error: { code: "BAD_REQUEST", message: "Invalid JSON request body" } },
        { status: 400 }
      );
    }

    const updated = await updateResource(auth.workspaceId, id, {
      name: typeof body.name === "string" ? body.name.trim() : undefined,
      type: body.type,
      category: body.category,
      provider: body.provider,
      description: body.description,
      websiteUrl: body.websiteUrl,
      amountMinor: typeof body.amountMinor === "number" ? Math.round(body.amountMinor) : undefined,
      currency: typeof body.currency === "string" ? body.currency.toUpperCase() : undefined,
      billingCycle: body.billingCycle,
      renewalDate: body.renewalDate,
      autoRenew: body.autoRenew !== undefined ? Boolean(body.autoRenew) : undefined,
      status: body.status,
      tags: Array.isArray(body.tags) ? body.tags : undefined,
    });

    // Record audit event
    await recordAuditEvent({
      workspaceId: auth.workspaceId,
      actorId: auth.userId,
      action: "resource.updated",
      entityType: "resource",
      entityId: id,
      entityName: updated?.name || existing.name,
      details: { via: "api_v1" },
    }).catch(() => {});

    // Emit webhook
    emitWorkspaceWebhook(
      auth.workspaceId,
      "resource.updated",
      updated as unknown as Record<string, unknown>
    ).catch(() => {});

    return Response.json({ data: updated });
  } catch (err: unknown) {
    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: err instanceof Error ? err.message : "Failed to update resource",
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { auth, response } = await authenticateV1Request(request, "write");
  if (response || !auth) return response!;

  const { id } = await context.params;
  const existing = await getResourceById(auth.workspaceId, id);
  if (!existing) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: `Resource "${id}" not found` } },
      { status: 404 }
    );
  }

  try {
    await deleteResource(auth.workspaceId, id);

    // Record audit event
    await recordAuditEvent({
      workspaceId: auth.workspaceId,
      actorId: auth.userId,
      action: "resource.deleted",
      entityType: "resource",
      entityId: id,
      entityName: existing.name,
      details: { via: "api_v1" },
    }).catch(() => {});

    // Emit webhook
    emitWorkspaceWebhook(auth.workspaceId, "resource.deleted", {
      resourceId: id,
      name: existing.name,
    }).catch(() => {});

    return Response.json({ success: true, message: `Resource "${id}" deleted successfully` });
  } catch (err: unknown) {
    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: err instanceof Error ? err.message : "Failed to delete resource",
        },
      },
      { status: 500 }
    );
  }
}
