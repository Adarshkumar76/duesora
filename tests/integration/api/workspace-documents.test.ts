import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  GET as listDocuments,
  POST as uploadDocument,
} from "@/app/api/workspaces/[workspaceId]/resources/[resourceId]/documents/route";
import {
  GET as downloadDocument,
  DELETE as deleteDocument,
} from "@/app/api/workspaces/[workspaceId]/resources/[resourceId]/documents/[documentId]/route";
import { auth } from "@/auth";
import * as docService from "@/lib/documents/service";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/documents/service", () => ({
  listResourceDocuments: vi.fn(),
  uploadResourceDocument: vi.fn(),
  getResourceDocumentFile: vi.fn(),
  deleteResourceDocument: vi.fn(),
}));

describe("API: Resource Documents & Contracts", () => {
  const context = {
    params: Promise.resolve({
      workspaceId: "ws-1",
      resourceId: "res-1",
    }),
  };

  const itemContext = {
    params: Promise.resolve({
      workspaceId: "ws-1",
      resourceId: "res-1",
      documentId: "doc-1",
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/workspaces/[workspaceId]/resources/[resourceId]/documents", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const req = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-1/resources/res-1/documents"
      );
      const res = await listDocuments(req, context);
      expect(res.status).toBe(401);
    });

    it("returns 403 when forbidden", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(docService.listResourceDocuments).mockRejectedValue(new Error("FORBIDDEN"));

      const req = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-1/resources/res-1/documents"
      );
      const res = await listDocuments(req, context);
      expect(res.status).toBe(403);
    });

    it("returns 200 with documents array", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      const mockDocs = [
        {
          id: "doc-1",
          resourceId: "res-1",
          workspaceId: "ws-1",
          fileName: "contract.pdf",
          fileSize: 1024,
          mimeType: "application/pdf",
          storagePath: "ws-1/res-1/file.pdf",
          uploadedByUserId: "user-1",
          uploadedByName: "Alice",
          createdAt: new Date(),
        },
      ];
      vi.mocked(docService.listResourceDocuments).mockResolvedValue(mockDocs);

      const req = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-1/resources/res-1/documents"
      );
      const res = await listDocuments(req, context);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data).toHaveLength(1);
      expect(json.data[0].fileName).toBe("contract.pdf");
    });
  });

  describe("POST /api/workspaces/[workspaceId]/resources/[resourceId]/documents", () => {
    it("returns 400 when no file is in form data", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);

      const formData = new FormData();
      const req = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-1/resources/res-1/documents",
        {
          method: "POST",
          body: formData,
        }
      );

      const res = await uploadDocument(req, context);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.message).toContain("No file provided");
    });

    it("returns 201 with document metadata on successful upload", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);

      const mockDoc = {
        id: "doc-123",
        resourceId: "res-1",
        workspaceId: "ws-1",
        fileName: "agreement.pdf",
        fileSize: 500,
        mimeType: "application/pdf",
        storagePath: "ws-1/res-1/doc-123.pdf",
        uploadedByUserId: "user-1",
        createdAt: new Date(),
      };
      vi.mocked(docService.uploadResourceDocument).mockResolvedValue(mockDoc);

      const formData = new FormData();
      const fakeBlob = new Blob(["sample content"], { type: "application/pdf" });
      formData.append("file", fakeBlob, "agreement.pdf");

      const req = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-1/resources/res-1/documents",
        {
          method: "POST",
          body: formData,
        }
      );

      const res = await uploadDocument(req, context);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.data.id).toBe("doc-123");
      expect(json.data.fileName).toBe("agreement.pdf");
    });
  });

  describe("GET & DELETE /api/workspaces/[workspaceId]/resources/[resourceId]/documents/[documentId]", () => {
    it("returns 404 when document file not found", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(docService.getResourceDocumentFile).mockResolvedValue(null);

      const req = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-1/resources/res-1/documents/doc-1"
      );
      const res = await downloadDocument(req, itemContext);
      expect(res.status).toBe(404);
    });

    it("returns 200 with buffer and download headers", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      const mockResult = {
        document: {
          id: "doc-1",
          resourceId: "res-1",
          workspaceId: "ws-1",
          fileName: "contract.pdf",
          fileSize: 15,
          mimeType: "application/pdf",
          storagePath: "path",
          uploadedByUserId: "user-1",
          createdAt: new Date(),
        },
        buffer: Buffer.from("pdf-binary-data"),
      };
      vi.mocked(docService.getResourceDocumentFile).mockResolvedValue(mockResult);

      const req = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-1/resources/res-1/documents/doc-1?download=true"
      );
      const res = await downloadDocument(req, itemContext);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/pdf");
      expect(res.headers.get("Content-Disposition")).toContain("attachment");
    });

    it("deletes document successfully", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
      vi.mocked(docService.deleteResourceDocument).mockResolvedValue(true);

      const req = new NextRequest(
        "http://localhost:3000/api/workspaces/ws-1/resources/res-1/documents/doc-1",
        {
          method: "DELETE",
        }
      );
      const res = await deleteDocument(req, itemContext);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.success).toBe(true);
    });
  });
});
