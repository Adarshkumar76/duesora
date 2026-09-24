import path from "path";
import crypto from "crypto";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { resourceDocuments, resources, users } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { recordAuditEvent } from "@/lib/audit/service";
import { emitWorkspaceWebhook } from "@/lib/webhooks/dispatcher";
import {
  saveUploadedFile,
  readUploadedFile,
  deleteUploadedFile,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  ALLOWED_DOCUMENT_MIME_TYPES,
} from "./storage";

export interface ResourceDocumentItem {
  id: string;
  resourceId: string;
  workspaceId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  uploadedByUserId: string | null;
  uploadedByName?: string | null;
  uploadedByEmail?: string | null;
  createdAt: Date;
}

export interface UploadDocumentInput {
  userId: string;
  workspaceId: string;
  resourceId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  buffer: Buffer;
}

/**
 * Lists all documents attached to a specific resource.
 */
export async function listResourceDocuments(
  userId: string,
  workspaceId: string,
  resourceId: string
): Promise<ResourceDocumentItem[]> {
  await requireWorkspaceRole(userId, workspaceId, "viewer");

  const db = getDb();

  const rows = await db
    .select({
      doc: resourceDocuments,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(resourceDocuments)
    .leftJoin(users, eq(resourceDocuments.uploadedByUserId, users.id))
    .where(
      and(
        eq(resourceDocuments.workspaceId, workspaceId),
        eq(resourceDocuments.resourceId, resourceId)
      )
    )
    .orderBy(desc(resourceDocuments.createdAt));

  return rows.map(({ doc, actorName, actorEmail }) => ({
    id: doc.id,
    resourceId: doc.resourceId,
    workspaceId: doc.workspaceId,
    fileName: doc.fileName,
    fileSize: doc.fileSize,
    mimeType: doc.mimeType,
    storagePath: doc.storagePath,
    uploadedByUserId: doc.uploadedByUserId,
    uploadedByName: actorName,
    uploadedByEmail: actorEmail,
    createdAt: doc.createdAt,
  }));
}

/**
 * Validates, saves, and registers a document attached to a resource.
 */
export async function uploadResourceDocument(
  input: UploadDocumentInput
): Promise<ResourceDocumentItem> {
  const { userId, workspaceId, resourceId, fileName, fileSize, mimeType, buffer } = input;

  await requireWorkspaceRole(userId, workspaceId, "member");

  // 1. Verify resource exists within this workspace
  const db = getDb();
  const [resource] = await db
    .select({ id: resources.id, name: resources.name })
    .from(resources)
    .where(and(eq(resources.id, resourceId), eq(resources.workspaceId, workspaceId)))
    .limit(1);

  if (!resource) {
    throw new Error("Resource not found in workspace");
  }

  // 2. Validate file size (max 15MB)
  if (fileSize > MAX_DOCUMENT_FILE_SIZE_BYTES || buffer.length > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    throw new Error(
      `File size exceeds maximum allowed limit of ${MAX_DOCUMENT_FILE_SIZE_BYTES / (1024 * 1024)}MB`
    );
  }

  if (fileSize <= 0 || buffer.length === 0) {
    throw new Error("Cannot upload empty file");
  }

  // 3. Validate MIME type
  const normalizedMime = mimeType.toLowerCase();
  if (!ALLOWED_DOCUMENT_MIME_TYPES.has(normalizedMime)) {
    throw new Error(`Unsupported document file type: ${mimeType}`);
  }

  // 4. Sanitize file name
  const sanitizedName = path.basename(fileName).replace(/[^a-zA-Z0-9._\- ]/g, "_").slice(0, 255);
  const ext = path.extname(sanitizedName) || ".bin";
  const fileId = crypto.randomUUID();

  // 5. Save to disk storage
  const storagePath = await saveUploadedFile(workspaceId, resourceId, fileId, ext, buffer);

  // 6. Insert metadata into database
  const [saved] = await db
    .insert(resourceDocuments)
    .values({
      id: fileId,
      resourceId,
      workspaceId,
      fileName: sanitizedName,
      fileSize: buffer.length,
      mimeType: normalizedMime,
      storagePath,
      uploadedByUserId: userId,
    })
    .returning();

  // 7. Audit log & webhook
  recordAuditEvent({
    workspaceId,
    actorId: userId,
    action: "document.uploaded",
    entityType: "resource",
    entityId: resourceId,
    entityName: resource.name,
    details: {
      documentId: saved.id,
      fileName: saved.fileName,
      fileSize: saved.fileSize,
      mimeType: saved.mimeType,
    },
  }).catch(() => {});

  emitWorkspaceWebhook(workspaceId, "document.uploaded", {
    documentId: saved.id,
    resourceId,
    resourceName: resource.name,
    fileName: saved.fileName,
    fileSize: saved.fileSize,
    mimeType: saved.mimeType,
  }).catch(() => {});

  return {
    id: saved.id,
    resourceId: saved.resourceId,
    workspaceId: saved.workspaceId,
    fileName: saved.fileName,
    fileSize: saved.fileSize,
    mimeType: saved.mimeType,
    storagePath: saved.storagePath,
    uploadedByUserId: saved.uploadedByUserId,
    createdAt: saved.createdAt,
  };
}

/**
 * Retrieves a document metadata and file buffer for download.
 */
export async function getResourceDocumentFile(
  userId: string,
  workspaceId: string,
  resourceId: string,
  documentId: string
): Promise<{ document: ResourceDocumentItem; buffer: Buffer } | null> {
  await requireWorkspaceRole(userId, workspaceId, "viewer");

  const db = getDb();

  const [row] = await db
    .select({
      doc: resourceDocuments,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(resourceDocuments)
    .leftJoin(users, eq(resourceDocuments.uploadedByUserId, users.id))
    .where(
      and(
        eq(resourceDocuments.id, documentId),
        eq(resourceDocuments.resourceId, resourceId),
        eq(resourceDocuments.workspaceId, workspaceId)
      )
    )
    .limit(1);

  if (!row) return null;

  const buffer = await readUploadedFile(row.doc.storagePath);

  return {
    document: {
      id: row.doc.id,
      resourceId: row.doc.resourceId,
      workspaceId: row.doc.workspaceId,
      fileName: row.doc.fileName,
      fileSize: row.doc.fileSize,
      mimeType: row.doc.mimeType,
      storagePath: row.doc.storagePath,
      uploadedByUserId: row.doc.uploadedByUserId,
      uploadedByName: row.actorName,
      uploadedByEmail: row.actorEmail,
      createdAt: row.doc.createdAt,
    },
    buffer,
  };
}

/**
 * Deletes a document record and removes the file from disk storage.
 */
export async function deleteResourceDocument(
  userId: string,
  workspaceId: string,
  resourceId: string,
  documentId: string
): Promise<boolean> {
  await requireWorkspaceRole(userId, workspaceId, "member");

  const db = getDb();

  const [doc] = await db
    .select()
    .from(resourceDocuments)
    .where(
      and(
        eq(resourceDocuments.id, documentId),
        eq(resourceDocuments.resourceId, resourceId),
        eq(resourceDocuments.workspaceId, workspaceId)
      )
    )
    .limit(1);

  if (!doc) return false;

  // 1. Delete from database
  await db
    .delete(resourceDocuments)
    .where(eq(resourceDocuments.id, documentId));

  // 2. Delete file from storage
  await deleteUploadedFile(doc.storagePath);

  // 3. Audit log & webhook
  recordAuditEvent({
    workspaceId,
    actorId: userId,
    action: "document.deleted",
    entityType: "resource",
    entityId: resourceId,
    details: {
      documentId: doc.id,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
    },
  }).catch(() => {});

  emitWorkspaceWebhook(workspaceId, "document.deleted", {
    documentId: doc.id,
    resourceId,
    fileName: doc.fileName,
  }).catch(() => {});

  return true;
}
