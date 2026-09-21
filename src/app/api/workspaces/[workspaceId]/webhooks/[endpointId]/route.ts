import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import {
  getWebhookEndpointById,
  updateWebhookEndpoint,
  deleteWebhookEndpoint,
  listWebhookDeliveries,
} from "@/lib/webhooks/repository";
import { updateWebhookSchema } from "@/lib/webhooks/validation";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ workspaceId: string; endpointId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to view webhook details",
          },
        },
        { status: 401 }
      );
    }

    const { workspaceId, endpointId } = await context.params;
    const userId = session.user.id;

    await requireWorkspaceRole(userId, workspaceId, "viewer");

    const endpoint = await getWebhookEndpointById(workspaceId, endpointId);
    if (!endpoint) {
      return Response.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Webhook endpoint not found",
          },
        },
        { status: 404 }
      );
    }

    const deliveries = await listWebhookDeliveries(workspaceId, endpointId, 25);

    return Response.json(
      {
        data: {
          ...endpoint,
          deliveries,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "You do not have access to this webhook endpoint",
          },
        },
        { status: 403 }
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to load webhook details",
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string; endpointId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to update webhook endpoint",
          },
        },
        { status: 401 }
      );
    }

    const { workspaceId, endpointId } = await context.params;
    const userId = session.user.id;

    await requireWorkspaceRole(userId, workspaceId, "admin");

    const body = await request.json();
    const parseResult = updateWebhookSchema.safeParse(body);

    if (!parseResult.success) {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parseResult.error.issues[0]?.message || "Invalid webhook payload",
          },
        },
        { status: 400 }
      );
    }

    const updated = await updateWebhookEndpoint(workspaceId, endpointId, parseResult.data);
    if (!updated) {
      return Response.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Webhook endpoint not found",
          },
        },
        { status: 404 }
      );
    }

    return Response.json({ data: updated }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "You must be an admin or owner to update webhook endpoints",
          },
        },
        { status: 403 }
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to update webhook",
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ workspaceId: string; endpointId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to delete webhook endpoint",
          },
        },
        { status: 401 }
      );
    }

    const { workspaceId, endpointId } = await context.params;
    const userId = session.user.id;

    await requireWorkspaceRole(userId, workspaceId, "admin");

    const deleted = await deleteWebhookEndpoint(workspaceId, endpointId);
    if (!deleted) {
      return Response.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Webhook endpoint not found",
          },
        },
        { status: 404 }
      );
    }

    return Response.json({ data: { id: endpointId, deleted: true } }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "You must be an admin or owner to delete webhook endpoints",
          },
        },
        { status: 403 }
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to delete webhook",
        },
      },
      { status: 500 }
    );
  }
}
