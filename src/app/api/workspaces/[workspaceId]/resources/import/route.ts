import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { previewImport, commitImport } from "@/lib/import-export/service";
import type { ValidatedImportRow } from "@/lib/import-export/validation";

export const dynamic = "force-dynamic";

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
            message: "Authentication required to import workspace resources",
          },
        },
        { status: 401 }
      );
    }

    const { workspaceId } = await context.params;
    const userId = session.user.id;

    const body = await request.json();
    const { mode, format = "csv", content, rows } = body;

    if (mode === "preview") {
      if (!content || typeof content !== "string") {
        return Response.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "File content is required for preview",
            },
          },
          { status: 400 }
        );
      }

      const previewResult = await previewImport(
        userId,
        workspaceId,
        content,
        format === "json" ? "json" : "csv"
      );

      return Response.json({ data: previewResult }, { status: 200 });
    }

    if (mode === "commit") {
      if (!Array.isArray(rows)) {
        return Response.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "An array of rows is required to commit import",
            },
          },
          { status: 400 }
        );
      }

      const commitResult = await commitImport(
        userId,
        workspaceId,
        rows as ValidatedImportRow[]
      );

      return Response.json({ data: commitResult }, { status: 200 });
    }

    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid mode. Supported modes are 'preview' and 'commit'",
        },
      },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to import data into this workspace",
          },
        },
        { status: 403 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to import resources";
    const isClientError =
      errorMessage.includes("exceeds") ||
      errorMessage.includes("parse") ||
      errorMessage.includes("must contain") ||
      errorMessage.includes("empty");

    return Response.json(
      {
        error: {
          code: isClientError ? "VALIDATION_ERROR" : "INTERNAL_SERVER_ERROR",
          message: errorMessage,
        },
      },
      { status: isClientError ? 400 : 500 }
    );
  }
}
