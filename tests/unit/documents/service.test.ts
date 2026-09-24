import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  uploadResourceDocument,
  listResourceDocuments,
  getResourceDocumentFile,
  deleteResourceDocument,
} from "@/lib/documents/service";
import * as authWorkspace from "@/lib/auth/workspace";
import * as storage from "@/lib/documents/storage";
import * as auditService from "@/lib/audit/service";
import * as webhookDispatcher from "@/lib/webhooks/dispatcher";
import { getDb } from "@/db";

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/lib/documents/storage", () => ({
  saveUploadedFile: vi.fn().mockResolvedValue("ws-1/res-1/file-1.pdf"),
  readUploadedFile: vi.fn().mockResolvedValue(Buffer.from("dummy pdf content")),
  deleteUploadedFile: vi.fn().mockResolvedValue(true),
  MAX_DOCUMENT_FILE_SIZE_BYTES: 15 * 1024 * 1024,
  ALLOWED_DOCUMENT_MIME_TYPES: new Set([
    "application/pdf",
    "text/plain",
    "image/png",
    "image/jpeg",
  ]),
}));

vi.mock("@/lib/audit/service", () => ({
  recordAuditEvent: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/webhooks/dispatcher", () => ({
  emitWorkspaceWebhook: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

describe("Documents Service Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadResourceDocument", () => {
    it("rejects empty file buffer", async () => {
      vi.mocked(authWorkspace.requireWorkspaceRole).mockResolvedValue({} as never);
      vi.mocked(getDb).mockReturnValue({
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([{ id: "res-1", name: "AWS Cloud" }]),
            }),
          }),
        }),
      } as never);

      await expect(
        uploadResourceDocument({
          userId: "user-1",
          workspaceId: "ws-1",
          resourceId: "res-1",
          fileName: "contract.pdf",
          fileSize: 0,
          mimeType: "application/pdf",
          buffer: Buffer.from(""),
        })
      ).rejects.toThrow("Cannot upload empty file");
    });

    it("rejects file exceeding max limit (15MB)", async () => {
      vi.mocked(authWorkspace.requireWorkspaceRole).mockResolvedValue({} as never);
      vi.mocked(getDb).mockReturnValue({
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([{ id: "res-1", name: "AWS Cloud" }]),
            }),
          }),
        }),
      } as never);

      const oversizedSize = 16 * 1024 * 1024;
      await expect(
        uploadResourceDocument({
          userId: "user-1",
          workspaceId: "ws-1",
          resourceId: "res-1",
          fileName: "big.pdf",
          fileSize: oversizedSize,
          mimeType: "application/pdf",
          buffer: Buffer.alloc(10), // simulated
        })
      ).rejects.toThrow("File size exceeds maximum allowed limit");
    });

    it("rejects unsupported MIME type", async () => {
      vi.mocked(authWorkspace.requireWorkspaceRole).mockResolvedValue({} as never);
      vi.mocked(getDb).mockReturnValue({
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([{ id: "res-1", name: "AWS Cloud" }]),
            }),
          }),
        }),
      } as never);

      await expect(
        uploadResourceDocument({
          userId: "user-1",
          workspaceId: "ws-1",
          resourceId: "res-1",
          fileName: "malware.exe",
          fileSize: 1024,
          mimeType: "application/x-msdownload",
          buffer: Buffer.from("sample bytes"),
        })
      ).rejects.toThrow("Unsupported document file type");
    });

    it("saves valid PDF document, records audit log and emits webhook", async () => {
      vi.mocked(authWorkspace.requireWorkspaceRole).mockResolvedValue({} as never);

      const mockDb = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([{ id: "res-1", name: "AWS Contract" }]),
            }),
          }),
        }),
        insert: () => ({
          values: () => ({
            returning: () =>
              Promise.resolve([
                {
                  id: "doc-uuid-1",
                  resourceId: "res-1",
                  workspaceId: "ws-1",
                  fileName: "contract_final.pdf",
                  fileSize: 1024,
                  mimeType: "application/pdf",
                  storagePath: "ws-1/res-1/doc-uuid-1.pdf",
                  uploadedByUserId: "user-1",
                  createdAt: new Date(),
                },
              ]),
          }),
        }),
      };
      vi.mocked(getDb).mockReturnValue(mockDb as never);

      const result = await uploadResourceDocument({
        userId: "user-1",
        workspaceId: "ws-1",
        resourceId: "res-1",
        fileName: "contract final.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
        buffer: Buffer.from("pdf-stream"),
      });

      expect(result.id).toBe("doc-uuid-1");
      expect(storage.saveUploadedFile).toHaveBeenCalled();
      expect(auditService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "document.uploaded",
          workspaceId: "ws-1",
          entityId: "res-1",
        })
      );
      expect(webhookDispatcher.emitWorkspaceWebhook).toHaveBeenCalledWith(
        "ws-1",
        "document.uploaded",
        expect.objectContaining({
          resourceId: "res-1",
        })
      );
    });
  });

  describe("listResourceDocuments", () => {
    it("enforces viewer role and returns mapped document items", async () => {
      vi.mocked(authWorkspace.requireWorkspaceRole).mockResolvedValue({} as never);
      const mockDb = {
        select: () => ({
          from: () => ({
            leftJoin: () => ({
              where: () => ({
                orderBy: () =>
                  Promise.resolve([
                    {
                      doc: {
                        id: "doc-1",
                        resourceId: "res-1",
                        workspaceId: "ws-1",
                        fileName: "invoice.pdf",
                        fileSize: 2048,
                        mimeType: "application/pdf",
                        storagePath: "path/to/invoice.pdf",
                        uploadedByUserId: "user-1",
                        createdAt: new Date(),
                      },
                      actorName: "John Doe",
                      actorEmail: "john@example.com",
                    },
                  ]),
              }),
            }),
          }),
        }),
      };
      vi.mocked(getDb).mockReturnValue(mockDb as never);

      const docs = await listResourceDocuments("user-1", "ws-1", "res-1");
      expect(authWorkspace.requireWorkspaceRole).toHaveBeenCalledWith("user-1", "ws-1", "viewer");
      expect(docs).toHaveLength(1);
      expect(docs[0].fileName).toBe("invoice.pdf");
      expect(docs[0].uploadedByName).toBe("John Doe");
    });
  });

  describe("deleteResourceDocument", () => {
    it("deletes document from database and file storage", async () => {
      vi.mocked(authWorkspace.requireWorkspaceRole).mockResolvedValue({} as never);
      const mockDb = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () =>
                Promise.resolve([
                  {
                    id: "doc-1",
                    storagePath: "ws-1/res-1/file.pdf",
                    fileName: "file.pdf",
                    fileSize: 500,
                  },
                ]),
            }),
          }),
        }),
        delete: () => ({
          where: () => Promise.resolve(),
        }),
      };
      vi.mocked(getDb).mockReturnValue(mockDb as never);

      const success = await deleteResourceDocument("user-1", "ws-1", "res-1", "doc-1");
      expect(success).toBe(true);
      expect(storage.deleteUploadedFile).toHaveBeenCalledWith("ws-1/res-1/file.pdf");
      expect(auditService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "document.deleted",
        })
      );
      expect(webhookDispatcher.emitWorkspaceWebhook).toHaveBeenCalledWith(
        "ws-1",
        "document.deleted",
        expect.objectContaining({
          documentId: "doc-1",
        })
      );
    });
  });
});
