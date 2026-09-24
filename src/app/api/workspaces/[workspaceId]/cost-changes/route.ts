import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { listWorkspacePriceChanges } from "@/lib/resources/cost-history";

export const dynamic = "force-dynamic";

export async function GET(
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
            message: "Authentication required to access workspace cost changes",
          },
        },
        { status: 401 }
      );
    }

    const { workspaceId } = await context.params;
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const onlyIncreasesParam = searchParams.get("onlyIncreases");

    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const onlyIncreases = onlyIncreasesParam === "true" || onlyIncreasesParam === "1";

    const changes = await listWorkspacePriceChanges(userId, workspaceId, {
      limit: isNaN(limit) ? 20 : Math.min(Math.max(limit, 1), 100),
      onlyIncreases,
    });

    return Response.json({
      data: changes,
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
          message: "Failed to fetch workspace price changes",
        },
      },
      { status: 500 }
    );
  }
}
