import { getDb } from "@/db";
import { resourceMonitors, resourceMonitorLogs } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { probeTls, extractHostname } from "./tls";
import { probeDns } from "./dns";
import type {
  MonitorStatus,
  FullMonitorProbeResult,
  ResourceMonitorRecord,
  ResourceMonitorLogRecord,
} from "./types";

export function determineOverallStatus(
  tlsResult: Awaited<ReturnType<typeof probeTls>>,
  dnsResult: Awaited<ReturnType<typeof probeDns>>
): MonitorStatus {
  if (tlsResult.success) {
    if (tlsResult.daysRemaining !== null) {
      if (tlsResult.daysRemaining <= 7) return "critical";
      if (tlsResult.daysRemaining < 30) return "warning";
      return "healthy";
    }
    return "healthy";
  }

  // If TLS failed, but DNS succeeded
  if (dnsResult.success) {
    return "warning";
  }

  return "error";
}

export async function runFullProbe(
  workspaceId: string,
  resourceId: string,
  targetHostOrUrl: string
): Promise<FullMonitorProbeResult> {
  const hostname = extractHostname(targetHostOrUrl) || targetHostOrUrl;

  const [tlsResult, dnsResult] = await Promise.all([
    probeTls(hostname),
    probeDns(hostname),
  ]);

  const status = determineOverallStatus(tlsResult, dnsResult);
  const latencyMs = Math.max(tlsResult.latencyMs, dnsResult.latencyMs);
  const errorMessage = tlsResult.errorMessage || dnsResult.errorMessage || null;

  return {
    resourceId,
    workspaceId,
    hostname,
    status,
    tls: tlsResult,
    dns: dnsResult,
    latencyMs,
    errorMessage,
    checkedAt: new Date(),
  };
}

export async function probeAndSaveResource(resource: {
  id: string;
  workspaceId: string;
  name: string;
  websiteUrl?: string | null;
  type?: string;
}): Promise<ResourceMonitorRecord> {
  const db = getDb();
  const target = resource.websiteUrl || resource.name;
  const probe = await runFullProbe(resource.workspaceId, resource.id, target);

  // 1. Upsert into resource_monitors
  const [existing] = await db
    .select()
    .from(resourceMonitors)
    .where(
      and(
        eq(resourceMonitors.resourceId, resource.id),
        eq(resourceMonitors.workspaceId, resource.workspaceId)
      )
    )
    .limit(1);

  let monitorId: string;

  if (existing) {
    monitorId = existing.id;
    await db
      .update(resourceMonitors)
      .set({
        hostname: probe.hostname,
        status: probe.status,
        tlsIssuer: probe.tls.issuer,
        tlsSubject: probe.tls.subject,
        tlsValidFrom: probe.tls.validFrom,
        tlsValidTo: probe.tls.validTo,
        tlsDaysRemaining: probe.tls.daysRemaining,
        tlsProtocol: probe.tls.protocol,
        dnsNameservers: JSON.stringify(probe.dns.nameservers),
        dnsIpv4: JSON.stringify(probe.dns.ipv4),
        latencyMs: probe.latencyMs,
        lastCheckedAt: probe.checkedAt,
        errorMessage: probe.errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(resourceMonitors.id, existing.id));
  } else {
    const [inserted] = await db
      .insert(resourceMonitors)
      .values({
        workspaceId: resource.workspaceId,
        resourceId: resource.id,
        hostname: probe.hostname,
        status: probe.status,
        tlsIssuer: probe.tls.issuer,
        tlsSubject: probe.tls.subject,
        tlsValidFrom: probe.tls.validFrom,
        tlsValidTo: probe.tls.validTo,
        tlsDaysRemaining: probe.tls.daysRemaining,
        tlsProtocol: probe.tls.protocol,
        dnsNameservers: JSON.stringify(probe.dns.nameservers),
        dnsIpv4: JSON.stringify(probe.dns.ipv4),
        latencyMs: probe.latencyMs,
        lastCheckedAt: probe.checkedAt,
        errorMessage: probe.errorMessage,
      })
      .returning({ id: resourceMonitors.id });

    monitorId = inserted.id;
  }

  // 2. Insert check history log
  await db.insert(resourceMonitorLogs).values({
    monitorId,
    resourceId: resource.id,
    workspaceId: resource.workspaceId,
    status: probe.status,
    latencyMs: probe.latencyMs,
    tlsDaysRemaining: probe.tls.daysRemaining,
    message: probe.errorMessage || `Checked ${probe.hostname} (${probe.status})`,
    checkedAt: probe.checkedAt,
  });

  return getMonitorForResource(resource.id, resource.workspaceId) as Promise<ResourceMonitorRecord>;
}

export async function getMonitorForResource(
  resourceId: string,
  workspaceId: string
): Promise<ResourceMonitorRecord | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(resourceMonitors)
    .where(
      and(
        eq(resourceMonitors.resourceId, resourceId),
        eq(resourceMonitors.workspaceId, workspaceId)
      )
    )
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    workspaceId: row.workspaceId,
    resourceId: row.resourceId,
    hostname: row.hostname,
    status: row.status as MonitorStatus,
    tlsIssuer: row.tlsIssuer,
    tlsSubject: row.tlsSubject,
    tlsValidFrom: row.tlsValidFrom,
    tlsValidTo: row.tlsValidTo,
    tlsDaysRemaining: row.tlsDaysRemaining,
    tlsProtocol: row.tlsProtocol,
    dnsNameservers: row.dnsNameservers ? JSON.parse(row.dnsNameservers) : [],
    dnsIpv4: row.dnsIpv4 ? JSON.parse(row.dnsIpv4) : [],
    latencyMs: row.latencyMs,
    lastCheckedAt: row.lastCheckedAt,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getMonitorLogsForResource(
  resourceId: string,
  workspaceId: string,
  limit = 10
): Promise<ResourceMonitorLogRecord[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(resourceMonitorLogs)
    .where(
      and(
        eq(resourceMonitorLogs.resourceId, resourceId),
        eq(resourceMonitorLogs.workspaceId, workspaceId)
      )
    )
    .orderBy(desc(resourceMonitorLogs.checkedAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    monitorId: r.monitorId,
    resourceId: r.resourceId,
    workspaceId: r.workspaceId,
    status: r.status as MonitorStatus,
    latencyMs: r.latencyMs,
    tlsDaysRemaining: r.tlsDaysRemaining,
    message: r.message,
    checkedAt: r.checkedAt,
  }));
}
