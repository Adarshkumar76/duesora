import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { getResourceDocumentFile } from "@/lib/documents/service";
import { extractInvoiceMetadata } from "@/lib/invoices/extractor";

export const dynamic = "force-dynamic";

/**
 * Extracts printable ASCII and UTF-8 strings from binary buffers like PDFs
 */
function extractTextFromBuffer(buffer: Buffer): string {
  // Try UTF-8 first
  const utf8 = buffer.toString("utf8");
  // If mostly printable characters, return as is
  const printableRatio = (utf8.match(/[\x20-\x7E\r\n\t]/g) || []).length / Math.max(1, utf8.length);
  if (printableRatio > 0.6) {
    return utf8;
  }

  // Extract text chunks from binary streams (e.g. PDF text streams / Tj blocks)
  const matches = utf8.match(/(?:\(([^()]+)\)\s*Tj|\[([^\]]+)\]\s*TJ|[\w\s.,;:/\$€£¥₹\-_]{4,})/g);
  if (matches && matches.length > 0) {
    return matches
      .map((m) => m.replace(/^\((.*)\)\s*Tj$/, "$1").replace(/^\[(.*)\]\s*TJ$/, "$1"))
      .join(" ");
  }

  return utf8;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string; resourceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { workspaceId, resourceId } = await context.params;
    await requireWorkspaceRole(session.user.id, workspaceId, "viewer");

    let textContent = "";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return Response.json(
          { error: { code: "BAD_REQUEST", message: "No file provided" } },
          { status: 400 }
        );
      }
      const arrayBuf = await file.arrayBuffer();
      textContent = extractTextFromBuffer(Buffer.from(arrayBuf));
    } else {
      const body = await request.json().catch(() => ({}));
      if (body.documentId) {
        const docData = await getResourceDocumentFile(
          session.user.id,
          workspaceId,
          resourceId,
          body.documentId
        );
        if (!docData) {
          return Response.json(
            { error: { code: "NOT_FOUND", message: "Document not found" } },
            { status: 404 }
          );
        }
        textContent = extractTextFromBuffer(docData.buffer);
      } else if (typeof body.text === "string") {
        textContent = body.text;
      } else {
        return Response.json(
          { error: { code: "BAD_REQUEST", message: "Provide either a file, documentId, or text" } },
          { status: 400 }
        );
      }
    }

    const metadata = extractInvoiceMetadata(textContent);

    return Response.json({
      success: true,
      metadata,
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
          message: error instanceof Error ? error.message : "Failed to extract invoice metadata",
        },
      },
      { status: 500 }
    );
  }
}
