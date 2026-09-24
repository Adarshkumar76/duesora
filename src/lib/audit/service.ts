import { and, eq, or, ilike, desc, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs } from "@/db/audit-schema";
import { users } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import type {
  AuditLogEntry,
  LogAuditInput,
  ListAuditLogsOptions,
} from "./types";

/**
 * Records an immutable audit log entry for compliance and workspace governance.
 * Executes safely without propagating errors to caller mutations.
 */
export async function recordAuditEvent(input: LogAuditInput): Promise<void> {
  try {
    if (!auditLogs) {
      console.warn("[AuditLog] auditLogs schema table is not initialized");
      return;
    }
    const db = getDb();
    const detailsStr = input.details ? JSON.stringify(input.details) : null;

    await db.insert(auditLogs).values({
      workspaceId: input.workspaceId,
      actorId: input.actorId || null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId || null,
      entityName: input.entityName || null,
      details: detailsStr,
      ipAddress: input.ipAddress || null,
    });
  } catch (err) {
    console.error("[AuditLog] Failed to record audit event:", err);
  }
}

/**
 * Lists workspace audit logs with actor attribution and pagination.
 * Restricted to workspace Administrators and Owners.
 */
export async function listWorkspaceAuditLogs(
  userId: string,
  workspaceId: string,
  options?: ListAuditLogsOptions
): Promise<{
  items: AuditLogEntry[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}> {
  await requireWorkspaceRole(userId, workspaceId, "member");

  if (!auditLogs?.workspaceId) {
    console.error("[AuditLog] auditLogs schema is undefined or missing workspaceId");
    return {
      items: [],
      pagination: {
        page: 1,
        pageSize: Math.min(100, Math.max(1, options?.pageSize || 20)),
        total: 0,
        totalPages: 1,
      },
    };
  }

  const db = getDb();

  const conditions = [eq(auditLogs.workspaceId, workspaceId)];

  if (options?.entityType && options.entityType !== "all") {
    conditions.push(eq(auditLogs.entityType, options.entityType));
  }

  if (options?.action && options.action !== "all") {
    conditions.push(eq(auditLogs.action, options.action));
  }

  if (options?.actorId && options.actorId !== "all") {
    conditions.push(eq(auditLogs.actorId, options.actorId));
  }

  if (options?.search && options.search.trim() !== "") {
    const term = `%${options.search.trim()}%`;
    conditions.push(
      or(
        ilike(auditLogs.action, term),
        ilike(auditLogs.entityName, term),
        ilike(users.name, term),
        ilike(users.email, term)
      )!
    );
  }

  const page = Math.max(1, options?.page || 1);
  const pageSize = Math.min(100, Math.max(1, options?.pageSize || 20));
  const offset = (page - 1) * pageSize;

  const [rawRows, totalCountResult] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        workspaceId: auditLogs.workspaceId,
        actorId: auditLogs.actorId,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        entityName: auditLogs.entityName,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
        actorName: users.name,
        actorEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(pageSize)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .where(and(...conditions)),
  ]);

  const total = Number(totalCountResult[0]?.count || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const items: AuditLogEntry[] = rawRows.map((row) => {
    let parsedDetails: Record<string, unknown> | null = null;
    if (row.details) {
      try {
        parsedDetails = JSON.parse(row.details);
      } catch {
        parsedDetails = { raw: row.details };
      }
    }

    return {
      id: row.id,
      workspaceId: row.workspaceId,
      actorId: row.actorId,
      actorName: row.actorName,
      actorEmail: row.actorEmail,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      entityName: row.entityName,
      details: parsedDetails,
      ipAddress: row.ipAddress,
      createdAt: new Date(row.createdAt),
    };
  });

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}
