import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { exportWorkspaceResources } from "@/lib/import-export/service";

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
            message: "Authentication required to export workspace resources",
          },
        },
        { status: 401 }
      );
    }

    const { workspaceId } = await context.params;
    const userId = session.user.id;

    const { searchParams } = request.nextUrl;
    const formatParam = searchParams.get("format");
    const format = formatParam === "json" ? "json" : "csv";

    const exportResult = await exportWorkspaceResources(
      userId,
      workspaceId,
      format
    );

    return new Response(exportResult.content, {
      status: 200,
      headers: {
        "Content-Type": exportResult.contentType,
        "Content-Disposition": `attachment; filename="${exportResult.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "You do not have access to export data from this workspace",
          },
        },
        { status: 403 }
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to export resources",
        },
      },
      { status: 500 }
    );
  }
}
