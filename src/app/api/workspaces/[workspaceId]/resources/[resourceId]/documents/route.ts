import { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  listResourceDocuments,
  uploadResourceDocument,
} from "@/lib/documents/service";

export const dynamic = "force-dynamic";

export async function GET(
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
    const userId = session.user.id;

    const documents = await listResourceDocuments(userId, workspaceId, resourceId);

    return Response.json({ data: documents });
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
          message: error instanceof Error ? error.message : "Failed to fetch documents",
        },
      },
      { status: 500 }
    );
  }
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
    const userId = session.user.id;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json(
        { error: { code: "BAD_REQUEST", message: "No file provided in upload" } },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const doc = await uploadResourceDocument({
      userId,
      workspaceId,
      resourceId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      buffer,
    });

    return Response.json({ data: doc }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json(
        { error: { code: "FORBIDDEN", message: "Insufficient permissions to upload documents" } },
        { status: 403 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Upload failed";
    const status = errorMessage.includes("exceeds maximum") ||
      errorMessage.includes("Unsupported document") ||
      errorMessage.includes("empty file") ||
      errorMessage.includes("Resource not found")
        ? 400
        : 500;

    return Response.json(
      { error: { code: status === 400 ? "BAD_REQUEST" : "INTERNAL_ERROR", message: errorMessage } },
      { status }
    );
  }
}
