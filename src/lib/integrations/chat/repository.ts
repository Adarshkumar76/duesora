import { getDb } from "@/db";
import { workspaceNotificationChannels } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import type { ChatProvider, ChatEventType, NotificationChannelItem } from "./types";

export interface CreateChannelInput {
  workspaceId: string;
  provider: ChatProvider;
  name: string;
  webhookUrl: string;
  events?: string[];
  active?: boolean;
}

export interface UpdateChannelInput {
  name?: string;
  events?: string[];
  active?: boolean;
}

function parseEvents(raw: string | null | undefined): string[] {
  if (!raw) return ["*"];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : ["*"];
  } catch {
    return ["*"];
  }
}

export async function listNotificationChannels(
  workspaceId: string
): Promise<NotificationChannelItem[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(workspaceNotificationChannels)
    .where(eq(workspaceNotificationChannels.workspaceId, workspaceId))
    .orderBy(desc(workspaceNotificationChannels.createdAt));

  return rows.map((r) => ({
    id: r.id,
    workspaceId: r.workspaceId,
    provider: r.provider as ChatProvider,
    name: r.name,
    webhookUrl: r.webhookUrl,
    events: parseEvents(r.events),
    active: r.active,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function getNotificationChannelById(
  channelId: string,
  workspaceId: string
): Promise<NotificationChannelItem | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(workspaceNotificationChannels)
    .where(
      and(
        eq(workspaceNotificationChannels.id, channelId),
        eq(workspaceNotificationChannels.workspaceId, workspaceId)
      )
    )
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    workspaceId: row.workspaceId,
    provider: row.provider as ChatProvider,
    name: row.name,
    webhookUrl: row.webhookUrl,
    events: parseEvents(row.events),
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createNotificationChannel(
  input: CreateChannelInput
): Promise<NotificationChannelItem> {
  const db = getDb();
  const eventsJson = JSON.stringify(input.events || ["*"]);

  const [row] = await db
    .insert(workspaceNotificationChannels)
    .values({
      workspaceId: input.workspaceId,
      provider: input.provider,
      name: input.name,
      webhookUrl: input.webhookUrl,
      events: eventsJson,
      active: input.active !== undefined ? input.active : true,
    })
    .returning();

  return {
    id: row.id,
    workspaceId: row.workspaceId,
    provider: row.provider as ChatProvider,
    name: row.name,
    webhookUrl: row.webhookUrl,
    events: parseEvents(row.events),
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function updateNotificationChannel(
  channelId: string,
  workspaceId: string,
  updates: UpdateChannelInput
): Promise<NotificationChannelItem | null> {
  const db = getDb();
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.active !== undefined) updateData.active = updates.active;
  if (updates.events !== undefined) updateData.events = JSON.stringify(updates.events);

  const [row] = await db
    .update(workspaceNotificationChannels)
    .set(updateData)
    .where(
      and(
        eq(workspaceNotificationChannels.id, channelId),
        eq(workspaceNotificationChannels.workspaceId, workspaceId)
      )
    )
    .returning();

  if (!row) return null;

  return {
    id: row.id,
    workspaceId: row.workspaceId,
    provider: row.provider as ChatProvider,
    name: row.name,
    webhookUrl: row.webhookUrl,
    events: parseEvents(row.events),
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function deleteNotificationChannel(
  channelId: string,
  workspaceId: string
): Promise<boolean> {
  const db = getDb();
  const [deleted] = await db
    .delete(workspaceNotificationChannels)
    .where(
      and(
        eq(workspaceNotificationChannels.id, channelId),
        eq(workspaceNotificationChannels.workspaceId, workspaceId)
      )
    )
    .returning({ id: workspaceNotificationChannels.id });

  return Boolean(deleted);
}

export async function listActiveChannelsForEvent(
  workspaceId: string,
  event: ChatEventType
): Promise<NotificationChannelItem[]> {
  const allChannels = await listNotificationChannels(workspaceId);
  return allChannels.filter((c) => {
    if (!c.active) return false;
    return c.events.includes("*") || c.events.includes(event);
  });
}
