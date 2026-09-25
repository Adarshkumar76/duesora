import path from "path";
import fs from "fs/promises";

export const MAX_DOCUMENT_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

/**
 * Base root directory for uploaded files.
 */
export function getStorageBaseDir(): string {
  if (process.env.STORAGE_LOCAL_PATH) {
    return path.resolve(process.env.STORAGE_LOCAL_PATH);
  }
  if (process.env.VERCEL) {
    return path.join("/tmp", "storage", "uploads");
  }
  return path.join(process.cwd(), "storage", "uploads");
}

/**
 * Resolves and verifies that a relative storage path is safely contained
 * within the base storage root directory (path-traversal protection).
 */
export function resolveSafeStoragePath(relativeStoragePath: string): string {
  const baseDir = path.resolve(getStorageBaseDir());
  const resolved = path.resolve(baseDir, relativeStoragePath);

  if (!resolved.startsWith(baseDir)) {
    throw new Error("Invalid storage path: Access outside storage directory denied");
  }

  return resolved;
}

/**
 * Writes an uploaded file buffer to workspace-isolated disk storage.
 */
export async function saveUploadedFile(
  workspaceId: string,
  resourceId: string,
  fileId: string,
  fileExtension: string,
  buffer: Buffer
): Promise<string> {
  const ext = fileExtension.startsWith(".") ? fileExtension : `.${fileExtension}`;
  const relativePath = path.join(workspaceId, resourceId, `${fileId}${ext}`);
  const absolutePath = resolveSafeStoragePath(relativePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, buffer);

  return relativePath.replace(/\\/g, "/");
}

/**
 * Reads a stored file buffer from disk.
 */
export async function readUploadedFile(relativeStoragePath: string): Promise<Buffer> {
  const absolutePath = resolveSafeStoragePath(relativeStoragePath);
  return fs.readFile(absolutePath);
}

/**
 * Deletes a stored file from disk if it exists.
 */
export async function deleteUploadedFile(relativeStoragePath: string): Promise<boolean> {
  try {
    const absolutePath = resolveSafeStoragePath(relativeStoragePath);
    await fs.unlink(absolutePath);
    return true;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      return false;
    }
    throw err;
  }
}
