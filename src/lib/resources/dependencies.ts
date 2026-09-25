import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { resourceDependencies } from "@/db/dependencies-schema";
import { resources } from "@/db/schema";
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

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  status: string;
  category: string | null;
  cost: number | null;
  currency: string;
  billingCycle: string;
  renewalDate: Date | null;
  provider: string | null;
  directPrerequisitesCount: number;
  directDependentsCount: number;
  totalBlastRadiusCount: number;
  downstreamNodeIds: string[];
  upstreamNodeIds: string[];
  isCriticalSPOF: boolean;
}

export interface GraphEdge {
  id: string;
  source: string; // Dependent consumer
  target: string; // Prerequisite provider
  notes: string | null;
}

export interface WorkspaceDependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    spofCount: number;
    maxBlastRadius: number;
    totalAnnualCostAtRisk: number;
  };
}

export interface RawResourceForGraph {
  id: string;
  name: string;
  type: string;
  status: string;
  category: string | null;
  amountMinor: number | null;
  currency: string;
  billingCycle: string;
  renewalDate: Date | null;
  provider: string | null;
}

export interface RawEdgeForGraph {
  id: string;
  resourceId: string;
  dependsOnResourceId: string;
  notes: string | null;
}

export function computeAnnualizedAmount(amountMinor: number | null, cycle: string): number {
  if (!amountMinor || amountMinor <= 0) return 0;
  const amount = amountMinor / 100;
  const normalizedCycle = cycle.toLowerCase();
  if (normalizedCycle === "monthly") return amount * 12;
  if (normalizedCycle === "quarterly") return amount * 4;
  if (normalizedCycle === "weekly") return amount * 52;
  return amount; // yearly / default
}

export function computeWorkspaceDependencyGraph(
  rawNodes: RawResourceForGraph[],
  rawEdges: RawEdgeForGraph[]
): WorkspaceDependencyGraph {
  // Map of targetId -> list of sourceIds (who depends on this target)
  const dependentsMap = new Map<string, string[]>();
  // Map of sourceId -> list of targetIds (what does source depend on)
  const prerequisitesMap = new Map<string, string[]>();

  for (const node of rawNodes) {
    dependentsMap.set(node.id, []);
    prerequisitesMap.set(node.id, []);
  }

  const validEdges: GraphEdge[] = [];
  const nodeIdsSet = new Set(rawNodes.map((n) => n.id));

  for (const edge of rawEdges) {
    // Only include edges where both nodes exist
    if (nodeIdsSet.has(edge.resourceId) && nodeIdsSet.has(edge.dependsOnResourceId)) {
      validEdges.push({
        id: edge.id,
        source: edge.resourceId,
        target: edge.dependsOnResourceId,
        notes: edge.notes,
      });

      dependentsMap.get(edge.dependsOnResourceId)?.push(edge.resourceId);
      prerequisitesMap.get(edge.resourceId)?.push(edge.dependsOnResourceId);
    }
  }

  // Helper: BFS for transitive downstream nodes (Blast Radius)
  function getTransitiveDownstream(startId: string): string[] {
    const visited = new Set<string>();
    const queue = [startId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const dependents = dependentsMap.get(current) || [];
      for (const depId of dependents) {
        if (!visited.has(depId)) {
          visited.add(depId);
          queue.push(depId);
        }
      }
    }

    return Array.from(visited);
  }

  // Helper: BFS for transitive upstream nodes (Prerequisites)
  function getTransitiveUpstream(startId: string): string[] {
    const visited = new Set<string>();
    const queue = [startId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const prerequisites = prerequisitesMap.get(current) || [];
      for (const reqId of prerequisites) {
        if (!visited.has(reqId)) {
          visited.add(reqId);
          queue.push(reqId);
        }
      }
    }

    return Array.from(visited);
  }

  let maxBlastRadius = 0;
  let spofCount = 0;

  const nodes: GraphNode[] = rawNodes.map((res) => {
    const downstream = getTransitiveDownstream(res.id);
    const upstream = getTransitiveUpstream(res.id);
    const directPrereq = prerequisitesMap.get(res.id)?.length || 0;
    const directDep = dependentsMap.get(res.id)?.length || 0;
    const blastRadiusCount = downstream.length;

    if (blastRadiusCount > maxBlastRadius) {
      maxBlastRadius = blastRadiusCount;
    }

    // A Single Point of Failure (SPOF) is a critical root or shared node that 2+ services depend on
    const isCriticalSPOF = blastRadiusCount >= 2;
    if (isCriticalSPOF) {
      spofCount++;
    }

    return {
      id: res.id,
      name: res.name,
      type: res.type,
      status: res.status,
      category: res.category,
      cost: res.amountMinor ? res.amountMinor / 100 : null,
      currency: res.currency,
      billingCycle: res.billingCycle,
      renewalDate: res.renewalDate,
      provider: res.provider,
      directPrerequisitesCount: directPrereq,
      directDependentsCount: directDep,
      totalBlastRadiusCount: blastRadiusCount,
      downstreamNodeIds: downstream,
      upstreamNodeIds: upstream,
      isCriticalSPOF,
    };
  });

  // Calculate annual spend across all resources mapped in the graph
  const totalAnnualCostAtRisk = rawNodes.reduce((sum, n) => {
    return sum + computeAnnualizedAmount(n.amountMinor, n.billingCycle);
  }, 0);

  return {
    nodes,
    edges: validEdges,
    stats: {
      totalNodes: nodes.length,
      totalEdges: validEdges.length,
      spofCount,
      maxBlastRadius,
      totalAnnualCostAtRisk: Math.round(totalAnnualCostAtRisk * 100) / 100,
    },
  };
}

export async function getWorkspaceDependencyGraph(
  workspaceId: string
): Promise<WorkspaceDependencyGraph> {
  const db = getDb();

  // 1. Fetch all resources in workspace
  const resourceRows = await db
    .select({
      id: resources.id,
      name: resources.name,
      type: resources.type,
      status: resources.status,
      category: resources.category,
      amountMinor: resources.amountMinor,
      currency: resources.currency,
      billingCycle: resources.billingCycle,
      renewalDate: resources.renewalDate,
      provider: resources.provider,
    })
    .from(resources)
    .where(eq(resources.workspaceId, workspaceId));

  // 2. Fetch all dependency links in workspace
  const edgeRows = await db
    .select({
      id: resourceDependencies.id,
      resourceId: resourceDependencies.resourceId,
      dependsOnResourceId: resourceDependencies.dependsOnResourceId,
      notes: resourceDependencies.notes,
    })
    .from(resourceDependencies)
    .where(eq(resourceDependencies.workspaceId, workspaceId));

  return computeWorkspaceDependencyGraph(resourceRows, edgeRows);
}

