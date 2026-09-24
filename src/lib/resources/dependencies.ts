import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { resourceDependencies, resources } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/auth/workspace";

export interface ResourceDependencyItem {
  id: string;
  resourceId: string;
  dependsOnResourceId: string;
  notes: string | null;
  createdAt: Date;
  dependsOnResource?: {
    id: string;
    name: string;
    type: string;
    status: string;
    provider: string | null;
  };
  dependentResource?: {
    id: string;
    name: string;
    type: string;
    status: string;
    provider: string | null;
  };
}

export async function listResourceDependencies(
  workspaceId: string,
  resourceId: string
): Promise<{
  dependsOn: ResourceDependencyItem[];
  dependents: ResourceDependencyItem[];
}> {
  const db = getDb();

  // 1. Upstream: Resources this resource depends on
  const upstreamRows = await db
    .select({
      id: resourceDependencies.id,
      resourceId: resourceDependencies.resourceId,
      dependsOnResourceId: resourceDependencies.dependsOnResourceId,
      notes: resourceDependencies.notes,
      createdAt: resourceDependencies.createdAt,
      dependsOnName: resources.name,
      dependsOnType: resources.type,
      dependsOnStatus: resources.status,
      dependsOnProvider: resources.provider,
    })
    .from(resourceDependencies)
    .innerJoin(resources, eq(resourceDependencies.dependsOnResourceId, resources.id))
    .where(
      and(
        eq(resourceDependencies.workspaceId, workspaceId),
        eq(resourceDependencies.resourceId, resourceId)
      )
    );

  // 2. Downstream: Resources that depend on this resource (Blast Radius)
  const downstreamRows = await db
    .select({
      id: resourceDependencies.id,
      resourceId: resourceDependencies.resourceId,
      dependsOnResourceId: resourceDependencies.dependsOnResourceId,
      notes: resourceDependencies.notes,
      createdAt: resourceDependencies.createdAt,
      depName: resources.name,
      depType: resources.type,
      depStatus: resources.status,
      depProvider: resources.provider,
    })
    .from(resourceDependencies)
    .innerJoin(resources, eq(resourceDependencies.resourceId, resources.id))
    .where(
      and(
        eq(resourceDependencies.workspaceId, workspaceId),
        eq(resourceDependencies.dependsOnResourceId, resourceId)
      )
    );

  return {
    dependsOn: upstreamRows.map((r) => ({
      id: r.id,
      resourceId: r.resourceId,
      dependsOnResourceId: r.dependsOnResourceId,
      notes: r.notes,
      createdAt: r.createdAt,
      dependsOnResource: {
        id: r.dependsOnResourceId,
        name: r.dependsOnName,
        type: r.dependsOnType,
        status: r.dependsOnStatus,
        provider: r.dependsOnProvider,
      },
    })),
    dependents: downstreamRows.map((r) => ({
      id: r.id,
      resourceId: r.resourceId,
      dependsOnResourceId: r.dependsOnResourceId,
      notes: r.notes,
      createdAt: r.createdAt,
      dependentResource: {
        id: r.resourceId,
        name: r.depName,
        type: r.depType,
        status: r.depStatus,
        provider: r.depProvider,
      },
    })),
  };
}

export async function addResourceDependency(
  userId: string,
  workspaceId: string,
  resourceId: string,
  dependsOnResourceId: string,
  notes?: string
): Promise<ResourceDependencyItem> {
  await requireWorkspaceRole(userId, workspaceId, "member");

  if (resourceId === dependsOnResourceId) {
    throw new Error("A resource cannot depend on itself.");
  }

  const db = getDb();

  // Validate both resources exist in workspace
  const [parentRes] = await db
    .select({ id: resources.id })
    .from(resources)
    .where(and(eq(resources.id, resourceId), eq(resources.workspaceId, workspaceId)))
    .limit(1);

  const [depRes] = await db
    .select({ id: resources.id })
    .from(resources)
    .where(and(eq(resources.id, dependsOnResourceId), eq(resources.workspaceId, workspaceId)))
    .limit(1);

  if (!parentRes || !depRes) {
    throw new Error("One or both resources were not found in this workspace.");
  }

  const [created] = await db
    .insert(resourceDependencies)
    .values({
      workspaceId,
      resourceId,
      dependsOnResourceId,
      notes: notes?.trim() || null,
    })
    .returning();

  return created;
}

export async function removeResourceDependency(
  userId: string,
  workspaceId: string,
  dependencyId: string
): Promise<boolean> {
  await requireWorkspaceRole(userId, workspaceId, "member");

  const db = getDb();
  const [deleted] = await db
    .delete(resourceDependencies)
    .where(
      and(
        eq(resourceDependencies.id, dependencyId),
        eq(resourceDependencies.workspaceId, workspaceId)
      )
    )
    .returning({ id: resourceDependencies.id });

  return !!deleted;
}
