import { NextRequest } from "next/server";
import { authenticateV1Request } from "@/lib/api/v1-auth";
import { listResources, createResource, type ListResourcesOptions } from "@/lib/resources/repository";
import { recordAuditEvent } from "@/lib/audit/service";
import { emitWorkspaceWebhook } from "@/lib/webhooks/dispatcher";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { auth, response } = await authenticateV1Request(request, "read");
  if (response || !auth) return response!;

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "50", 10) || 50));
  const search = searchParams.get("search") || undefined;
  const type = (searchParams.get("type") as ListResourcesOptions["type"]) || undefined;
  const status = (searchParams.get("status") as ListResourcesOptions["status"]) || undefined;

  try {
    const result = await listResources(auth.workspaceId, {
      page,
      pageSize,
      search,
      type,
      status,
    });

    return Response.json({
      data: result.items,
      meta: {
        totalCount: result.pagination.total,
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        totalPages: result.pagination.totalPages,
      },
    });
  } catch (err: unknown) {
    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: err instanceof Error ? err.message : "Failed to list resources",
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { auth, response } = await authenticateV1Request(request, "write");
  if (response || !auth) return response!;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json(
        { error: { code: "BAD_REQUEST", message: "Invalid JSON request body" } },
        { status: 400 }
      );
    }

    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return Response.json(
        { error: { code: "BAD_REQUEST", message: "Resource name is required" } },
        { status: 400 }
      );
    }

    const validTypes = [
      "domain",
      "ssl_certificate",
      "subscription",
      "hosting",
      "cloud_service",
      "software_license",
      "contract",
      "warranty",
      "document",
      "custom",
    ];

    const type = body.type || "subscription";
    if (!validTypes.includes(type)) {
      return Response.json(
        { error: { code: "BAD_REQUEST", message: `Invalid resource type. Supported: ${validTypes.join(", ")}` } },
        { status: 400 }
      );
    }

    const created = await createResource({
      workspaceId: auth.workspaceId,
      name: body.name.trim(),
      type,
      category: body.category || null,
      provider: body.provider || null,
      description: body.description || null,
      websiteUrl: body.websiteUrl || null,
      amountMinor: typeof body.amountMinor === "number" ? Math.round(body.amountMinor) : null,
      currency: typeof body.currency === "string" ? body.currency.toUpperCase() : "USD",
      billingCycle: body.billingCycle || "monthly",
      renewalDate: body.renewalDate || null,
      autoRenew: body.autoRenew !== undefined ? Boolean(body.autoRenew) : true,
      tags: Array.isArray(body.tags) ? body.tags : [],
    });

    // Record audit event
    await recordAuditEvent({
      workspaceId: auth.workspaceId,
      actorId: auth.userId,
      action: "resource.created",
      entityType: "resource",
      entityId: created.id,
      entityName: created.name,
      details: { via: "api_v1" },
    }).catch(() => {});

    // Emit webhook
    emitWorkspaceWebhook(
      auth.workspaceId,
      "resource.created",
      created as unknown as Record<string, unknown>
    ).catch(() => {});

    return Response.json({ data: created }, { status: 201 });
  } catch (err: unknown) {
    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: err instanceof Error ? err.message : "Failed to create resource",
        },
      },
      { status: 500 }
    );
  }
}
