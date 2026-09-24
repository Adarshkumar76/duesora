import { and, eq, or, ilike, inArray, sql, desc, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { resources, resourceMonitors, users } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import type { MonitorStatus } from "@/lib/monitors/types";
import type {
  DomainItem,
  DomainMetrics,
  ListDomainsOptions,
} from "./types";

export async function listWorkspaceDomains(
  userId: string,
  workspaceId: string,
  options?: ListDomainsOptions
): Promise<{
  items: DomainItem[];
  metrics: DomainMetrics;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}> {
  await requireWorkspaceRole(userId, workspaceId, "viewer");

  const db = getDb();
  const allowedTypes = ["domain", "ssl_certificate"] as const;

  // Base conditions: must be in workspace and of type domain or ssl_certificate
  const baseConditions = [
    eq(resources.workspaceId, workspaceId),
    inArray(resources.type, [...allowedTypes]),
  ];

  // Specific type filter
  if (options?.type && options.type !== "all") {
    baseConditions.push(eq(resources.type, options.type as never));
  }

  // Status filter
  if (options?.status && options.status !== "all") {
    baseConditions.push(eq(resources.status, options.status));
  }

  // Search filter
  if (options?.search && options.search.trim() !== "") {
    const term = `%${options.search.trim()}%`;
    baseConditions.push(
      or(
        ilike(resources.name, term),
        ilike(resources.provider, term),
        ilike(resources.websiteUrl, term),
        ilike(resourceMonitors.hostname, term)
      )!
    );
  }

  // Health filter
  if (options?.health && options.health !== "all") {
    if (options.health === "unmonitored") {
      baseConditions.push(sql`${resourceMonitors.id} IS NULL`);
    } else {
      baseConditions.push(eq(resourceMonitors.status, options.health));
    }
  }

  const page = Math.max(1, options?.page || 1);
  const pageSize = Math.min(50, Math.max(1, options?.pageSize || 20));
  const offset = (page - 1) * pageSize;

  // Query paginated items with monitors and owner
  const rawRows = await db
    .select({
      id: resources.id,
      workspaceId: resources.workspaceId,
      name: resources.name,
      type: resources.type,
      status: resources.status,
      category: resources.category,
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
      monitorId: resourceMonitors.id,
      monitorHostname: resourceMonitors.hostname,
      monitorStatus: resourceMonitors.status,
      tlsIssuer: resourceMonitors.tlsIssuer,
      tlsSubject: resourceMonitors.tlsSubject,
      tlsValidFrom: resourceMonitors.tlsValidFrom,
      tlsValidTo: resourceMonitors.tlsValidTo,
      tlsDaysRemaining: resourceMonitors.tlsDaysRemaining,
      tlsProtocol: resourceMonitors.tlsProtocol,
      dnsNameservers: resourceMonitors.dnsNameservers,
      dnsIpv4: resourceMonitors.dnsIpv4,
      latencyMs: resourceMonitors.latencyMs,
      lastCheckedAt: resourceMonitors.lastCheckedAt,
      errorMessage: resourceMonitors.errorMessage,
    })
    .from(resources)
    .leftJoin(users, eq(resources.ownerId, users.id))
    .leftJoin(resourceMonitors, eq(resources.id, resourceMonitors.resourceId))
    .where(and(...baseConditions))
    .orderBy(asc(resources.renewalDate), desc(resources.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Total count for current filter
  const [totalCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(resources)
    .leftJoin(resourceMonitors, eq(resources.id, resourceMonitors.resourceId))
    .where(and(...baseConditions));

  const total = Number(totalCountResult?.count || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Compute overall workspace domain metrics (independent of pagination/search)
  const allWorkspaceDomains = await db
    .select({
      type: resources.type,
      renewalDate: resources.renewalDate,
      monitorStatus: resourceMonitors.status,
      tlsDaysRemaining: resourceMonitors.tlsDaysRemaining,
    })
    .from(resources)
    .leftJoin(resourceMonitors, eq(resources.id, resourceMonitors.resourceId))
    .where(
      and(
        eq(resources.workspaceId, workspaceId),
        inArray(resources.type, ["domain", "ssl_certificate"])
      )
    );

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  let totalDomains = 0;
  let totalCertificates = 0;
  let healthyMonitors = 0;
  let expiringSoon = 0;
  let failingMonitors = 0;

  for (const item of allWorkspaceDomains) {
    if (item.type === "domain") totalDomains++;
    if (item.type === "ssl_certificate") totalCertificates++;

    if (item.monitorStatus === "healthy") healthyMonitors++;
    if (item.monitorStatus === "critical" || item.monitorStatus === "error") {
      failingMonitors++;
    }

    const isRenewalExpiringSoon =
      item.renewalDate &&
      new Date(item.renewalDate) <= thirtyDaysFromNow;

    const isTlsExpiringSoon =
      item.tlsDaysRemaining !== null &&
      item.tlsDaysRemaining !== undefined &&
      item.tlsDaysRemaining <= 30;

    if (isRenewalExpiringSoon || isTlsExpiringSoon) {
      expiringSoon++;
    }
  }

  const items: DomainItem[] = rawRows.map((row) => ({
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    type: row.type as "domain" | "ssl_certificate",
    status: row.status as "active" | "inactive" | "expired" | "archived",
    category: row.category,
    provider: row.provider,
    websiteUrl: row.websiteUrl,
    amountMinor: row.amountMinor,
    currency: row.currency,
    billingCycle: row.billingCycle,
    renewalDate: row.renewalDate ? new Date(row.renewalDate) : null,
    autoRenew: row.autoRenew,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    ownerName: row.ownerName,
    ownerEmail: row.ownerEmail,
    monitor: row.monitorId
      ? {
          id: row.monitorId,
          hostname: row.monitorHostname || row.name,
          status: (row.monitorStatus || "unknown") as MonitorStatus,
          tlsIssuer: row.tlsIssuer,
          tlsSubject: row.tlsSubject,
          tlsValidFrom: row.tlsValidFrom ? new Date(row.tlsValidFrom) : null,
          tlsValidTo: row.tlsValidTo ? new Date(row.tlsValidTo) : null,
          tlsDaysRemaining: row.tlsDaysRemaining,
          tlsProtocol: row.tlsProtocol,
          dnsNameservers: row.dnsNameservers,
          dnsIpv4: row.dnsIpv4,
          latencyMs: row.latencyMs,
          lastCheckedAt: row.lastCheckedAt ? new Date(row.lastCheckedAt) : null,
          errorMessage: row.errorMessage,
        }
      : null,
  }));

  return {
    items,
    metrics: {
      totalDomains,
      totalCertificates,
      healthyMonitors,
      expiringSoon,
      failingMonitors,
    },
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}
