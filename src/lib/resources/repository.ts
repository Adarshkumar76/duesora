import { and, eq, ilike, or, desc, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { resources, resourceTags, tags, users } from "@/db/schema";
import {
  findOrCreateTagsByName,
  setResourceTags,
  getTagsForResources,
  getTagsForResource,
  type TagItem,
} from "@/lib/tags/repository";

export type ResourceOwnerInfo = {
  id: string;
  name: string | null;
  email: string;
} | null;

export type CreateResourceInput = {
  workspaceId: string;
  name: string;
  type:
    | "domain"
    | "ssl_certificate"
    | "subscription"
    | "hosting"
    | "cloud_service"
    | "software_license"
    | "contract"
    | "warranty"
    | "document"
    | "custom";
  category?: string | null;
  ownerId?: string | null;
  description?: string | null;
  provider?: string | null;
  websiteUrl?: string | null;
  amountMinor?: number | null;
  currency?: string;
  billingCycle?: "yearly" | "monthly" | "quarterly" | "one_time" | "lifetime";
  renewalDate?: Date | string | null;
  autoRenew?: boolean;
  tags?: string[];
};

export async function createResource(input: CreateResourceInput) {
  const db = getDb();

  const renewalDateVal = input.renewalDate
    ? new Date(input.renewalDate)
    : null;

  const [resource] = await db
    .insert(resources)
    .values({
      workspaceId: input.workspaceId,
      name: input.name,
      type: input.type,
      category: input.category ?? null,
      ownerId: input.ownerId ?? null,
      description: input.description ?? null,
      provider: input.provider ?? null,
      websiteUrl: input.websiteUrl ?? null,
      amountMinor: input.amountMinor ?? null,
      currency: input.currency ?? "USD",
      billingCycle: input.billingCycle ?? "yearly",
      renewalDate: renewalDateVal,
      autoRenew: input.autoRenew ?? true,
    })
    .returning();

  let tagItems: TagItem[] = [];
  if (input.tags && input.tags.length > 0) {
    tagItems = await findOrCreateTagsByName(input.workspaceId, input.tags);
    await setResourceTags(
      resource.id,
      tagItems.map((t) => t.id)
    );
  }

  let owner: ResourceOwnerInfo = null;
  if (resource.ownerId) {
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, resource.ownerId))
      .limit(1);
    if (user) owner = user;
  }

  return {
    ...resource,
    tags: tagItems,
    owner,
  };
}

export type ListResourcesOptions = {
  search?: string | null;
  type?: string | null;
  category?: string | null;
  ownerId?: string | null;
  tag?: string | null;
  status?: "active" | "inactive" | "expired" | "archived" | null;
  page?: number;
  pageSize?: number;
};

export async function listResources(
  workspaceId: string,
  options?: ListResourcesOptions
) {
  const db = getDb();

  const conditions = [eq(resources.workspaceId, workspaceId)];

  if (options?.type && options.type !== "all") {
    conditions.push(eq(resources.type, options.type as never));
  }

  if (options?.category && options.category !== "all") {
    conditions.push(eq(resources.category, options.category));
  }

  if (options?.ownerId && options.ownerId !== "all") {
    conditions.push(eq(resources.ownerId, options.ownerId));
  }

  if (options?.status) {
    conditions.push(eq(resources.status, options.status));
  }

  if (options?.tag && options.tag.trim() !== "") {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${resourceTags} rt
        INNER JOIN ${tags} t ON rt.tag_id = t.id
        WHERE rt.resource_id = ${resources.id} AND LOWER(t.name) = LOWER(${options.tag.trim()})
      )`
    );
  }

  if (options?.search && options.search.trim() !== "") {
    const searchPattern = `%${options.search.trim()}%`;
    conditions.push(
      or(
        ilike(resources.name, searchPattern),
        ilike(resources.provider, searchPattern),
        ilike(resources.description, searchPattern),
        ilike(resources.category, searchPattern)
      )!
    );
  }

  const page = Math.max(1, options?.page || 1);
  const pageSize = Math.min(50, Math.max(1, options?.pageSize || 20));
  const offset = (page - 1) * pageSize;

  const [rawItems, totalCountResult] = await Promise.all([
    db
      .select({
        id: resources.id,
        workspaceId: resources.workspaceId,
        name: resources.name,
        type: resources.type,
        status: resources.status,
        category: resources.category,
        ownerId: resources.ownerId,
        description: resources.description,
        provider: resources.provider,
        websiteUrl: resources.websiteUrl,
        amountMinor: resources.amountMinor,
        currency: resources.currency,
        billingCycle: resources.billingCycle,
        renewalDate: resources.renewalDate,
        autoRenew: resources.autoRenew,
        createdAt: resources.createdAt,
        updatedAt: resources.updatedAt,
        ownerName: users.name,
        ownerEmail: users.email,
      })
      .from(resources)
      .leftJoin(users, eq(resources.ownerId, users.id))
      .where(and(...conditions))
      .orderBy(desc(resources.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(resources)
      .where(and(...conditions)),
  ]);

  const total = totalCountResult[0]?.count ?? 0;

  const resourceIds = rawItems.map((r) => r.id);
  const tagMap = await getTagsForResources(resourceIds);

  const items = rawItems.map((row) => ({
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    type: row.type,
    status: row.status,
    category: row.category,
    ownerId: row.ownerId,
    description: row.description,
    provider: row.provider,
    websiteUrl: row.websiteUrl,
    amountMinor: row.amountMinor,
    currency: row.currency,
    billingCycle: row.billingCycle,
    renewalDate: row.renewalDate,
    autoRenew: row.autoRenew,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    owner: row.ownerId
      ? {
          id: row.ownerId,
          name: row.ownerName,
          email: row.ownerEmail || "",
        }
      : null,
    tags: tagMap.get(row.id) ?? [],
  }));

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getResourceById(
  workspaceId: string,
  resourceId: string
) {
  const db = getDb();

  const [row] = await db
    .select({
      id: resources.id,
      workspaceId: resources.workspaceId,
      name: resources.name,
      type: resources.type,
      status: resources.status,
      category: resources.category,
      ownerId: resources.ownerId,
      description: resources.description,
      provider: resources.provider,
      websiteUrl: resources.websiteUrl,
      amountMinor: resources.amountMinor,
      currency: resources.currency,
      billingCycle: resources.billingCycle,
      renewalDate: resources.renewalDate,
      autoRenew: resources.autoRenew,
      renewalDecision: resources.renewalDecision,
      decisionNotes: resources.decisionNotes,
      cancellationNoticeDays: resources.cancellationNoticeDays,
      cancellationDeadline: resources.cancellationDeadline,
      decidedByUserId: resources.decidedByUserId,
      decidedAt: resources.decidedAt,
      createdAt: resources.createdAt,
      updatedAt: resources.updatedAt,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(resources)
    .leftJoin(users, eq(resources.ownerId, users.id))
    .where(
      and(
        eq(resources.id, resourceId),
        eq(resources.workspaceId, workspaceId)
      )
    )
    .limit(1);

  if (!row) return null;

  const resourceTagList = await getTagsForResource(row.id);

  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    type: row.type,
    status: row.status,
    category: row.category,
    ownerId: row.ownerId,
    description: row.description,
    provider: row.provider,
    websiteUrl: row.websiteUrl,
    amountMinor: row.amountMinor,
    currency: row.currency,
    billingCycle: row.billingCycle,
    renewalDate: row.renewalDate,
    autoRenew: row.autoRenew,
    renewalDecision: row.renewalDecision,
    decisionNotes: row.decisionNotes,
    cancellationNoticeDays: row.cancellationNoticeDays,
    cancellationDeadline: row.cancellationDeadline,
    decidedByUserId: row.decidedByUserId,
    decidedAt: row.decidedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    owner: row.ownerId
      ? {
          id: row.ownerId,
          name: row.ownerName,
          email: row.ownerEmail || "",
        }
      : null,
    tags: resourceTagList,
  };
}

export async function deleteResource(
  workspaceId: string,
  resourceId: string
) {
  const db = getDb();

  const [deleted] = await db
    .delete(resources)
    .where(
      and(
        eq(resources.id, resourceId),
        eq(resources.workspaceId, workspaceId)
      )
    )
    .returning();

  return deleted ?? null;
}

export type UpdateResourceInput = Partial<CreateResourceInput> & {
  status?: "active" | "inactive" | "expired" | "archived";
  changeReason?: string | null;
};

export async function updateResource(
  workspaceId: string,
  resourceId: string,
  input: UpdateResourceInput
) {
  const db = getDb();

  const renewalDateVal =
    input.renewalDate !== undefined
      ? input.renewalDate
        ? new Date(input.renewalDate)
        : null
      : undefined;

  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) updateValues.name = input.name;
  if (input.type !== undefined) updateValues.type = input.type;
  if (input.category !== undefined) updateValues.category = input.category;
  if (input.ownerId !== undefined) updateValues.ownerId = input.ownerId;
  if (input.description !== undefined) updateValues.description = input.description;
  if (input.provider !== undefined) updateValues.provider = input.provider;
  if (input.websiteUrl !== undefined) updateValues.websiteUrl = input.websiteUrl;
  if (input.amountMinor !== undefined) updateValues.amountMinor = input.amountMinor;
  if (input.currency !== undefined) updateValues.currency = input.currency;
  if (input.billingCycle !== undefined) updateValues.billingCycle = input.billingCycle;
  if (renewalDateVal !== undefined) updateValues.renewalDate = renewalDateVal;
  if (input.autoRenew !== undefined) updateValues.autoRenew = input.autoRenew;
  if (input.status !== undefined) updateValues.status = input.status;

  const [updated] = await db
    .update(resources)
    .set(updateValues)
    .where(
      and(
        eq(resources.id, resourceId),
        eq(resources.workspaceId, workspaceId)
      )
    )
    .returning();

  if (!updated) return null;

  if (input.tags !== undefined) {
    const tagItems = await findOrCreateTagsByName(workspaceId, input.tags);
    await setResourceTags(
      resourceId,
      tagItems.map((t) => t.id)
    );
  }

  return getResourceById(workspaceId, resourceId);
}
