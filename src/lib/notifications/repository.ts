import { getDb } from "@/db";
import { notifications, reminderLogs, resources } from "@/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";

export interface CreateNotificationInput {
  workspaceId: string;
  userId: string;
  resourceId?: string | null;
  title: string;
  message: string;
  type?: "renewal_upcoming" | "renewal_overdue" | "system" | "monitor_alert";
  severity?: "info" | "warning" | "critical";
  metadata?: Record<string, unknown> | null;
}

export interface ListNotificationsOptions {
  status?: "unread" | "read" | "all";
  severity?: "info" | "warning" | "critical";
  page?: number;
  pageSize?: number;
}

export interface NotificationItem {
  id: string;
  workspaceId: string;
  userId: string;
  resourceId: string | null;
  resourceName?: string | null;
  resourceType?: string | null;
  title: string;
  message: string;
  type: string;
  severity: string;
  status: string;
  metadata: Record<string, unknown> | null;
  readAt: Date | null;
  createdAt: Date;
}

export async function createNotification(
  input: CreateNotificationInput
): Promise<NotificationItem> {
  const db = getDb();

  const [row] = await db
    .insert(notifications)
    .values({
      workspaceId: input.workspaceId,
      userId: input.userId,
      resourceId: input.resourceId || null,
      title: input.title,
      message: input.message,
      type: input.type || "system",
      severity: input.severity || "info",
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    })
    .returning();

  return {
    id: row.id,
    workspaceId: row.workspaceId,
    userId: row.userId,
    resourceId: row.resourceId,
    title: row.title,
    message: row.message,
    type: row.type,
    severity: row.severity,
    status: row.status,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}

export async function listUserNotifications(
  userId: string,
  workspaceId: string,
  options: ListNotificationsOptions = {}
): Promise<{ items: NotificationItem[]; total: number; unreadCount: number }> {
  const db = getDb();
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
  const offset = (page - 1) * pageSize;

  const conditions = [
    eq(notifications.userId, userId),
    eq(notifications.workspaceId, workspaceId),
  ];

  if (options.status && options.status !== "all") {
    conditions.push(eq(notifications.status, options.status));
  }

  if (options.severity) {
    conditions.push(eq(notifications.severity, options.severity));
  }

  // Fetch paginated notifications joined with resource name if linked
  const rows = await db
    .select({
      notification: notifications,
      resourceName: resources.name,
      resourceType: resources.type,
    })
    .from(notifications)
    .leftJoin(resources, eq(notifications.resourceId, resources.id))
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Total matching count
  const [totalCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(...conditions));

  // Global unread count for this user in this workspace
  const [unreadResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.workspaceId, workspaceId),
        eq(notifications.status, "unread")
      )
    );

  const items: NotificationItem[] = rows.map(({ notification, resourceName, resourceType }) => ({
    id: notification.id,
    workspaceId: notification.workspaceId,
    userId: notification.userId,
    resourceId: notification.resourceId,
    resourceName: resourceName || null,
    resourceType: resourceType || null,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    severity: notification.severity,
    status: notification.status,
    metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  }));

  return {
    items,
    total: totalCountResult?.count || 0,
    unreadCount: unreadResult?.count || 0,
  };
}

export async function getUnreadNotificationCount(
  userId: string,
  workspaceId: string
): Promise<number> {
  const db = getDb();
  const [res] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.workspaceId, workspaceId),
        eq(notifications.status, "unread")
      )
    );

  return res?.count || 0;
}

export async function markNotificationRead(
  userId: string,
  notificationId: string
): Promise<boolean> {
  const db = getDb();
  const res = await db
    .update(notifications)
    .set({
      status: "read",
      readAt: new Date(),
    })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    )
    .returning({ id: notifications.id });

  return res.length > 0;
}

export async function markAllNotificationsRead(
  userId: string,
  workspaceId: string
): Promise<number> {
  const db = getDb();
  const res = await db
    .update(notifications)
    .set({
      status: "read",
      readAt: new Date(),
    })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.workspaceId, workspaceId),
        eq(notifications.status, "unread")
      )
    )
    .returning({ id: notifications.id });

  return res.length;
}

export async function hasReminderBeenDispatched(
  resourceId: string,
  channel: string,
  intervalDays: number,
  cycleKey: string
): Promise<boolean> {
  const db = getDb();
  const [existing] = await db
    .select({ id: reminderLogs.id })
    .from(reminderLogs)
    .where(
      and(
        eq(reminderLogs.resourceId, resourceId),
        eq(reminderLogs.channel, channel),
        eq(reminderLogs.intervalDays, intervalDays),
        eq(reminderLogs.cycleKey, cycleKey)
      )
    )
    .limit(1);

  return Boolean(existing);
}

export async function recordReminderLog(data: {
  workspaceId: string;
  resourceId: string;
  channel: "in_app" | "email" | "webhook";
  intervalDays: number;
  cycleKey: string;
  recipient: string;
  status?: "sent" | "failed" | "skipped";
}): Promise<void> {
  const db = getDb();
  await db
    .insert(reminderLogs)
    .values({
      workspaceId: data.workspaceId,
      resourceId: data.resourceId,
      channel: data.channel,
      intervalDays: data.intervalDays,
      cycleKey: data.cycleKey,
      recipient: data.recipient,
      status: data.status || "sent",
    })
    .onConflictDoNothing();
}
