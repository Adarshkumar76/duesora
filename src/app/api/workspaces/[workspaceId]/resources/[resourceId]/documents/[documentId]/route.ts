import { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  getResourceDocumentFile,
  deleteResourceDocument,
} from "@/lib/documents/service";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string; resourceId: string; documentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { workspaceId, resourceId, documentId } = await context.params;
    const userId = session.user.id;

    const result = await getResourceDocumentFile(userId, workspaceId, resourceId, documentId);

    if (!result) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Document not found" } },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get("download") === "true";
    const dispositionType = isDownload ? "attachment" : "inline";

    // Clean filename for header
    const safeFilename = encodeURIComponent(result.document.fileName);

    return new Response(result.buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": result.document.mimeType || "application/octet-stream",
        "Content-Length": result.buffer.length.toString(),
        "Content-Disposition": `${dispositionType}; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json(
        { error: { code: "FORBIDDEN", message: "Access denied" } },
        { status: 403 }
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to retrieve document",
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string; resourceId: string; documentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { workspaceId, resourceId, documentId } = await context.params;
    const userId = session.user.id;

    const success = await deleteResourceDocument(userId, workspaceId, resourceId, documentId);

    if (!success) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Document not found" } },
        { status: 404 }
      );
    }

    return Response.json({ data: { success: true } }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json(
        { error: { code: "FORBIDDEN", message: "Insufficient permissions to delete document" } },
        { status: 403 }
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to delete document",
        },
      },
      { status: 500 }
    );
  }
}
