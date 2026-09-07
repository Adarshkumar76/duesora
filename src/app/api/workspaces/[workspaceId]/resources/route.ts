import { NextRequest } from "next/server";

import {
  createWorkspaceResource,
  listWorkspaceResources,
} from "@/lib/resources/service";
import { createResourceSchema } from "@/lib/resources/validation";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await context.params;

    // Temporary until real authentication is added
    const userId = "TEMP_USER_ID";

    const resources = await listWorkspaceResources(userId, workspaceId);

    return Response.json({
      data: resources,
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
        { status: 403 },
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await context.params;

    // Temporary until real authentication is added
    const userId = "TEMP_USER_ID";

    const body = await request.json();

    const result = createResourceSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid resource data",
            details: result.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const resource = await createWorkspaceResource(userId, {
      workspaceId,
      ...result.data,
    });

    return Response.json(
      {
        data: resource,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to create resources",
          },
        },
        { status: 403 },
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        },
      },
      { status: 500 },
    );
  }
}
