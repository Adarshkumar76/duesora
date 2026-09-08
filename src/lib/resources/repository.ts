import { and, eq, ilike, or, desc, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { resources } from "@/db/schema";

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
  description?: string | null;
  provider?: string | null;
  websiteUrl?: string | null;
  amountMinor?: number | null;
  currency?: string;
  billingCycle?: "yearly" | "monthly" | "quarterly" | "one_time" | "lifetime";
  renewalDate?: Date | string | null;
  autoRenew?: boolean;
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

  return resource;
}

export type ListResourcesOptions = {
  search?: string | null;
  type?: string | null;
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

  if (options?.status) {
    conditions.push(eq(resources.status, options.status));
  }

  if (options?.search && options.search.trim() !== "") {
    const searchPattern = `%${options.search.trim()}%`;
    conditions.push(
      or(
        ilike(resources.name, searchPattern),
        ilike(resources.provider, searchPattern),
        ilike(resources.description, searchPattern)
      )!
    );
  }

  const page = Math.max(1, options?.page || 1);
  const pageSize = Math.min(50, Math.max(1, options?.pageSize || 20));
  const offset = (page - 1) * pageSize;

  const [items, totalCountResult] = await Promise.all([
    db
      .select()
      .from(resources)
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

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getResourceById(
  workspaceId: string,
  resourceId: string
) {
  const db = getDb();

  const [resource] = await db
    .select()
    .from(resources)
    .where(
      and(
        eq(resources.id, resourceId),
        eq(resources.workspaceId, workspaceId)
      )
    )
    .limit(1);

  return resource ?? null;
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