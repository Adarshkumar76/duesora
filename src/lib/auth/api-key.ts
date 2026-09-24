import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { apiKeys } from "@/db/api-keys-schema";
import { requireWorkspaceRole } from "@/lib/auth/workspace";

export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

export function generateRawApiKey(): { rawKey: string; prefix: string; hash: string } {
  const entropy = crypto.randomBytes(24).toString("hex");
  const rawKey = `due_live_${entropy}`;
  const prefix = rawKey.slice(0, 14);
  const hash = hashApiKey(rawKey);

  return { rawKey, prefix, hash };
}

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface CreateApiKeyResult extends ApiKeyItem {
  rawKey: string;
}

export async function listWorkspaceApiKeys(
  userId: string,
  workspaceId: string
): Promise<ApiKeyItem[]> {
  await requireWorkspaceRole(userId, workspaceId, "admin");

  const db = getDb();
  const rows = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      permissions: apiKeys.permissions,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.workspaceId, workspaceId))
    .orderBy(apiKeys.createdAt);

  return rows;
}

export function calculateExpiryDate(
  expiryOption?: string | Date | null
): Date | null {
  if (!expiryOption || expiryOption === "never") {
    return null;
  }
  if (expiryOption instanceof Date) {
    return expiryOption;
  }

  const now = Date.now();
  switch (expiryOption) {
    case "1_day":
      return new Date(now + 1 * 24 * 60 * 60 * 1000);
    case "1_month":
      return new Date(now + 30 * 24 * 60 * 60 * 1000);
    case "3_months":
      return new Date(now + 90 * 24 * 60 * 60 * 1000);
    case "1_year":
      return new Date(now + 365 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

export async function createWorkspaceApiKey(
  userId: string,
  workspaceId: string,
  name: string,
  permissions = "read",
  expiryOption?: string | Date | null
): Promise<CreateApiKeyResult> {
  await requireWorkspaceRole(userId, workspaceId, "admin");

  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > 100) {
    throw new Error("Key name must be between 1 and 100 characters.");
  }

  const expiresAt = calculateExpiryDate(expiryOption);
  const { rawKey, prefix, hash } = generateRawApiKey();
  const db = getDb();

  const [created] = await db
    .insert(apiKeys)
    .values({
      workspaceId,
      userId,
      name: trimmedName,
      keyPrefix: prefix,
      keyHash: hash,
      permissions: permissions === "read_write" ? "read_write" : "read",
      expiresAt,
    })
    .returning();

  return {
    id: created.id,
    name: created.name,
    keyPrefix: created.keyPrefix,
    permissions: created.permissions,
    lastUsedAt: created.lastUsedAt,
    expiresAt: created.expiresAt,
    createdAt: created.createdAt,
    rawKey,
  };
}

export async function revokeWorkspaceApiKey(
  userId: string,
  workspaceId: string,
  keyId: string
): Promise<boolean> {
  await requireWorkspaceRole(userId, workspaceId, "admin");

  const db = getDb();
  const [deleted] = await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.workspaceId, workspaceId)))
    .returning({ id: apiKeys.id });

  return !!deleted;
}

export async function validateBearerApiKey(
  rawToken: string
): Promise<{ workspaceId: string; userId: string; permissions: string } | null> {
  if (!rawToken || !rawToken.startsWith("due_live_")) {
    return null;
  }

  const hash = hashApiKey(rawToken);
  const db = getDb();

  const [record] = await db
    .select({
      id: apiKeys.id,
      workspaceId: apiKeys.workspaceId,
      userId: apiKeys.userId,
      permissions: apiKeys.permissions,
      expiresAt: apiKeys.expiresAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, hash))
    .limit(1);

  if (!record) return null;

  if (record.expiresAt && record.expiresAt < new Date()) {
    return null;
  }

  // Asynchronously update lastUsedAt
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, record.id))
    .catch(() => {});

  return {
    workspaceId: record.workspaceId,
    userId: record.userId,
    permissions: record.permissions,
  };
}
