import { getDb } from "@/db";
import { webhookEndpoints, webhookDeliveries } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { generateWebhookSecret } from "./signer";

export interface CreateEndpointInput {
  workspaceId: string;
  url: string;
  description?: string | null;
  secret?: string | null;
  events?: string[];
  active?: boolean;
}

export interface UpdateEndpointInput {
  url?: string;
  description?: string | null;
  events?: string[];
  active?: boolean;
}

export interface WebhookEndpointItem {
  id: string;
  workspaceId: string;
  url: string;
  description: string | null;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookDeliveryItem {
  id: string;
  webhookEndpointId: string;
  workspaceId: string;
  event: string;
  payload: string;
  statusCode: number | null;
  responseBody: string | null;
  durationMs: number | null;
  error: string | null;
  status: string;
  deliveredAt: Date;
}

export async function createWebhookEndpoint(
  input: CreateEndpointInput
): Promise<WebhookEndpointItem> {
  const db = getDb();
  const secret = input.secret?.trim() || generateWebhookSecret();
  const events = input.events && input.events.length > 0 ? input.events : ["*"];

  const [row] = await db
    .insert(webhookEndpoints)
    .values({
      workspaceId: input.workspaceId,
      url: input.url.trim(),
      description: input.description?.trim() || null,
      secret,
      events: JSON.stringify(events),
      active: input.active ?? true,
    })
    .returning();

  return {
    id: row.id,
    workspaceId: row.workspaceId,
    url: row.url,
    description: row.description,
    secret: row.secret,
    events: JSON.parse(row.events),
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listWebhookEndpoints(
  workspaceId: string
): Promise<WebhookEndpointItem[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.workspaceId, workspaceId))
    .orderBy(desc(webhookEndpoints.createdAt));

  return rows.map((r) => ({
    id: r.id,
    workspaceId: r.workspaceId,
    url: r.url,
    description: r.description,
    secret: r.secret,
    events: JSON.parse(r.events),
    active: r.active,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function getWebhookEndpointById(
  workspaceId: string,
  endpointId: string
): Promise<WebhookEndpointItem | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(webhookEndpoints)
    .where(
      and(
        eq(webhookEndpoints.id, endpointId),
        eq(webhookEndpoints.workspaceId, workspaceId)
      )
    )
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    workspaceId: row.workspaceId,
    url: row.url,
    description: row.description,
    secret: row.secret,
    events: JSON.parse(row.events),
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function updateWebhookEndpoint(
  workspaceId: string,
  endpointId: string,
  input: UpdateEndpointInput
): Promise<WebhookEndpointItem | null> {
  const db = getDb();

  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.url !== undefined) updateValues.url = input.url.trim();
  if (input.description !== undefined) updateValues.description = input.description?.trim() || null;
  if (input.events !== undefined) updateValues.events = JSON.stringify(input.events);
  if (input.active !== undefined) updateValues.active = input.active;

  const [row] = await db
    .update(webhookEndpoints)
    .set(updateValues)
    .where(
      and(
        eq(webhookEndpoints.id, endpointId),
        eq(webhookEndpoints.workspaceId, workspaceId)
      )
    )
    .returning();

  if (!row) return null;

  return {
    id: row.id,
    workspaceId: row.workspaceId,
    url: row.url,
    description: row.description,
    secret: row.secret,
    events: JSON.parse(row.events),
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function deleteWebhookEndpoint(
  workspaceId: string,
  endpointId: string
): Promise<boolean> {
  const db = getDb();
  const res = await db
    .delete(webhookEndpoints)
    .where(
      and(
        eq(webhookEndpoints.id, endpointId),
        eq(webhookEndpoints.workspaceId, workspaceId)
      )
    )
    .returning({ id: webhookEndpoints.id });

  return res.length > 0;
}

export async function recordWebhookDelivery(data: {
  webhookEndpointId: string;
  workspaceId: string;
  event: string;
  payload: string;
  statusCode?: number | null;
  responseBody?: string | null;
  durationMs?: number | null;
  error?: string | null;
  status: "success" | "failed";
}): Promise<void> {
  const db = getDb();
  await db.insert(webhookDeliveries).values({
    webhookEndpointId: data.webhookEndpointId,
    workspaceId: data.workspaceId,
    event: data.event,
    payload: data.payload,
    statusCode: data.statusCode ?? null,
    responseBody: data.responseBody?.slice(0, 1000) ?? null,
    durationMs: data.durationMs ?? null,
    error: data.error?.slice(0, 1000) ?? null,
    status: data.status,
  });
}

export async function listWebhookDeliveries(
  workspaceId: string,
  endpointId?: string,
  limit: number = 20
): Promise<WebhookDeliveryItem[]> {
  const db = getDb();
  const conditions = [eq(webhookDeliveries.workspaceId, workspaceId)];

  if (endpointId) {
    conditions.push(eq(webhookDeliveries.webhookEndpointId, endpointId));
  }

  const rows = await db
    .select()
    .from(webhookDeliveries)
    .where(and(...conditions))
    .orderBy(desc(webhookDeliveries.deliveredAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    webhookEndpointId: r.webhookEndpointId,
    workspaceId: r.workspaceId,
    event: r.event,
    payload: r.payload,
    statusCode: r.statusCode,
    responseBody: r.responseBody,
    durationMs: r.durationMs,
    error: r.error,
    status: r.status,
    deliveredAt: r.deliveredAt,
  }));
}
