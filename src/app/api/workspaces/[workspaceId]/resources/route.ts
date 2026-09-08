import { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  createWorkspaceResource,
  listWorkspaceResources,
} from "@/lib/resources/service";
import { createResourceSchema } from "@/lib/resources/validation";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> },
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
        { status: 401 },
      );
    }

    const { workspaceId } = await context.params;
    const userId = session.user.id;

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const status = searchParams.get("status") as
      | "active"
      | "inactive"
      | "expired"
      | "archived"
      | null;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    const result = await listWorkspaceResources(userId, workspaceId, {
      search,
      type,
      status,
      page,
      pageSize,
    });

    return Response.json({
      data: result,
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
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to create workspace resources",
          },
        },
        { status: 401 },
      );
    }

    const { workspaceId } = await context.params;
    const userId = session.user.id;

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

    // Convert decimal amount to integer minor units if provided
    let amountMinor = result.data.amountMinor ?? null;
    if (amountMinor === null && body.amount !== undefined && body.amount !== null && body.amount !== "") {
      const parsedAmount = Number(body.amount);
      if (!isNaN(parsedAmount) && parsedAmount >= 0) {
        amountMinor = Math.round(parsedAmount * 100);
      }
    }

    const resource = await createWorkspaceResource(userId, {
      workspaceId,
      ...result.data,
      amountMinor,
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
