import { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  getWorkspaceResource,
  updateWorkspaceResource,
  deleteWorkspaceResource,
} from "@/lib/resources/service";
import { updateResourceSchema } from "@/lib/resources/validation";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string; resourceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to access workspace resources",
          },
        },
        { status: 401 }
      );
    }

    const { workspaceId, resourceId } = await context.params;
    const userId = session.user.id;

    const resource = await getWorkspaceResource(userId, workspaceId, resourceId);

    if (!resource) {
      return Response.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Resource not found",
          },
        },
        { status: 404 }
      );
    }

    return Response.json({
      data: resource,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "You do not have access to this workspace",
          },
        },
        { status: 403 }
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch resource",
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string; resourceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to update workspace resources",
          },
        },
        { status: 401 }
      );
    }

    const { workspaceId, resourceId } = await context.params;
    const userId = session.user.id;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          error: {
            code: "INVALID_JSON",
            message: "Request body must be valid JSON",
          },
        },
        { status: 400 }
      );
    }

    const parseResult = updateResourceSchema.safeParse(body);
    if (!parseResult.success) {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid resource update data",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const updated = await updateWorkspaceResource(
      userId,
      workspaceId,
      resourceId,
      parseResult.data
    );

    if (!updated) {
      return Response.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Resource not found or failed to update",
          },
        },
        { status: 404 }
      );
    }

    return Response.json({
      data: updated,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to modify this workspace",
          },
        },
        { status: 403 }
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update resource",
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string; resourceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to delete workspace resources",
          },
        },
        { status: 401 }
      );
    }

    const { workspaceId, resourceId } = await context.params;
    const userId = session.user.id;

    const deleted = await deleteWorkspaceResource(userId, workspaceId, resourceId);

    if (!deleted) {
      return Response.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Resource not found or already deleted",
          },
        },
        { status: 404 }
      );
    }

    return Response.json({
      data: { success: true, id: deleted.id },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to delete resources in this workspace",
          },
        },
        { status: 403 }
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete resource",
        },
      },
      { status: 500 }
    );
  }
}
