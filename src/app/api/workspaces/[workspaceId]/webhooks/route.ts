import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import {
  createWebhookEndpoint,
  listWebhookEndpoints,
} from "@/lib/webhooks/repository";
import { createWebhookSchema } from "@/lib/webhooks/validation";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to view webhooks",
          },
        },
        { status: 401 }
      );
    }

    const { workspaceId } = await context.params;
    const userId = session.user.id;

    await requireWorkspaceRole(userId, workspaceId, "viewer");

    const endpoints = await listWebhookEndpoints(workspaceId);

    // Mask the secret for security in list view, revealing only suffix
    const sanitized = endpoints.map((ep) => ({
      ...ep,
      maskedSecret: `${ep.secret.slice(0, 10)}...${ep.secret.slice(-4)}`,
    }));

    return Response.json({ data: sanitized }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "You do not have access to webhooks in this workspace",
          },
        },
        { status: 403 }
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to load webhooks",
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to create webhooks",
          },
        },
        { status: 401 }
      );
    }

    const { workspaceId } = await context.params;
    const userId = session.user.id;

    await requireWorkspaceRole(userId, workspaceId, "admin");

    const body = await request.json();
    const parseResult = createWebhookSchema.safeParse(body);

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

    const endpoint = await createWebhookEndpoint({
      workspaceId,
      url: parseResult.data.url,
      description: parseResult.data.description,
      secret: parseResult.data.secret,
      events: parseResult.data.events,
      active: parseResult.data.active,
    });

    return Response.json({ data: endpoint }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "You must be an admin or owner to create webhooks",
          },
        },
        { status: 403 }
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to create webhook",
        },
      },
      { status: 500 }
    );
  }
}
