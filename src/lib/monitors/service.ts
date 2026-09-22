import { getDb } from "@/db";
import {
  resourceMonitors,
  resourceMonitorLogs,
  resources,
  users,
  memberships,
  workspaces,
} from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { probeTls, extractHostname } from "./tls";
import { probeDns } from "./dns";
import { createNotification } from "@/lib/notifications/repository";
import { sendMonitorAlertEmail } from "@/lib/notifications/email";
import { emitWorkspaceWebhook } from "@/lib/webhooks/dispatcher";
import type {
  MonitorStatus,
  FullMonitorProbeResult,
  ResourceMonitorRecord,
  ResourceMonitorLogRecord,
} from "./types";

export interface MonitorJobSummary {
  scannedCount: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  errorCount: number;
  alertsDispatched: number;
  durationMs: number;
  errors: string[];
}

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
    lastAlertStatus: (row.lastAlertStatus as MonitorStatus) || null,
    lastAlertedAt: row.lastAlertedAt || null,
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

export async function updateMonitorAlertTracking(
  monitorId: string,
  alertStatus: MonitorStatus,
  alertedAt: Date = new Date()
) {
  const db = getDb();
  await db
    .update(resourceMonitors)
    .set({
      lastAlertStatus: alertStatus,
      lastAlertedAt: alertedAt,
      updatedAt: new Date(),
    })
    .where(eq(resourceMonitors.id, monitorId));
}

/**
 * Determines whether an alert should be dispatched based on status transitions and 24h throttling.
 */
export function shouldSendMonitorAlert(
  newStatus: MonitorStatus,
  previousStatus: MonitorStatus | null,
  lastAlertStatus: MonitorStatus | null,
  lastAlertedAt: Date | null,
  now: Date = new Date()
): { shouldAlert: boolean; alertReason: "degraded" | "recovered" | "periodic_degraded" | null } {
  // Case 1: Recovery from degraded to healthy
  if (
    newStatus === "healthy" &&
    previousStatus &&
    (previousStatus === "warning" || previousStatus === "critical" || previousStatus === "error")
  ) {
    return { shouldAlert: true, alertReason: "recovered" };
  }

  // Case 2: Degraded status (warning, critical, error)
  if (newStatus === "warning" || newStatus === "critical" || newStatus === "error") {
    // 2a. Status transition (e.g. healthy -> warning, warning -> critical)
    if (newStatus !== lastAlertStatus) {
      return { shouldAlert: true, alertReason: "degraded" };
    }

    // 2b. Same degraded status: check 24h throttling
    if (!lastAlertedAt) {
      return { shouldAlert: true, alertReason: "degraded" };
    }

    const msSinceLastAlert = now.getTime() - new Date(lastAlertedAt).getTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    if (msSinceLastAlert >= twentyFourHoursMs) {
      return { shouldAlert: true, alertReason: "periodic_degraded" };
    }
  }

  return { shouldAlert: false, alertReason: null };
}

export async function getMonitoringCandidates(workspaceId?: string) {
  const db = getDb();
  const conditions = [eq(resources.status, "active")];
  if (workspaceId) {
    conditions.push(eq(resources.workspaceId, workspaceId));
  }

  const items = await db
    .select({
      id: resources.id,
      workspaceId: resources.workspaceId,
      name: resources.name,
      websiteUrl: resources.websiteUrl,
      type: resources.type,
      ownerId: resources.ownerId,
      workspaceName: workspaces.name,
    })
    .from(resources)
    .innerJoin(workspaces, eq(resources.workspaceId, workspaces.id))
    .where(and(...conditions));

  return items.filter((item) => {
    const target = item.websiteUrl || item.name;
    const hostname = extractHostname(target) || target;
    return Boolean(hostname && hostname.includes("."));
  });
}

export async function dispatchMonitorAlerts({
  workspaceId,
  workspaceName,
  resource,
  monitor,
  alertReason,
  previousStatus,
}: {
  workspaceId: string;
  workspaceName: string;
  resource: { id: string; name: string; ownerId: string | null };
  monitor: ResourceMonitorRecord;
  alertReason: "degraded" | "recovered" | "periodic_degraded";
  previousStatus: MonitorStatus | null;
}) {
  const db = getDb();

  // 1. Fetch recipients (owner + workspace admins/owners)
  const members = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.workspaceId, workspaceId));

  const recipients: Array<{ id: string; name: string | null; email: string }> = [];
  if (resource.ownerId) {
    const ownerMember = members.find((m) => m.id === resource.ownerId);
    if (ownerMember) {
      recipients.push({ id: ownerMember.id, name: ownerMember.name, email: ownerMember.email });
    }
  }

  members
    .filter((m) => m.role === "owner" || m.role === "admin")
    .forEach((m) => {
      if (!recipients.some((r) => r.id === m.id)) {
        recipients.push({ id: m.id, name: m.name, email: m.email });
      }
    });

  const isHealthy = monitor.status === "healthy";
  const severity = isHealthy
    ? "info"
    : monitor.status === "critical" || monitor.status === "error"
    ? "critical"
    : "warning";

  const title = isHealthy
    ? `Monitor Recovered: ${monitor.hostname}`
    : monitor.status === "critical"
    ? `Critical Health Alert: ${monitor.hostname}`
    : `Health Warning: ${monitor.hostname}`;

  const message = isHealthy
    ? `Resource "${resource.name}" (${monitor.hostname}) is now healthy.`
    : monitor.tlsDaysRemaining !== null
    ? `Resource "${resource.name}" (${monitor.hostname}) SSL certificate expires in ${monitor.tlsDaysRemaining} days.`
    : `Resource "${resource.name}" (${monitor.hostname}) status is ${monitor.status}: ${monitor.errorMessage || "Check failed"}.`;

  // 2. In-App Notifications & Emails
  for (const recipient of recipients) {
    try {
      await createNotification({
        workspaceId,
        userId: recipient.id,
        resourceId: resource.id,
        title,
        message,
        type: "monitor_alert",
        severity,
        metadata: {
          alertReason,
          hostname: monitor.hostname,
          status: monitor.status,
          previousStatus,
          tlsDaysRemaining: monitor.tlsDaysRemaining,
          tlsIssuer: monitor.tlsIssuer,
          errorMessage: monitor.errorMessage,
        },
      });

      await sendMonitorAlertEmail({
        to: recipient.email,
        recipientName: recipient.name,
        resourceName: resource.name,
        hostname: monitor.hostname,
        resourceId: resource.id,
        status: monitor.status,
        previousStatus,
        tlsDaysRemaining: monitor.tlsDaysRemaining,
        tlsIssuer: monitor.tlsIssuer,
        tlsProtocol: monitor.tlsProtocol,
        errorMessage: monitor.errorMessage,
        workspaceName,
      });
    } catch {}
  }

  // 3. Outbound Webhooks
  const webhookPayload = {
    resourceId: resource.id,
    resourceName: resource.name,
    hostname: monitor.hostname,
    status: monitor.status,
    alertReason,
    previousStatus,
    tlsDaysRemaining: monitor.tlsDaysRemaining,
    tlsIssuer: monitor.tlsIssuer,
    latencyMs: monitor.latencyMs,
    errorMessage: monitor.errorMessage,
    checkedAt: monitor.lastCheckedAt?.toISOString(),
  };

  await emitWorkspaceWebhook(workspaceId, "monitor.status_changed", webhookPayload);

  if (isHealthy) {
    await emitWorkspaceWebhook(workspaceId, "monitor.recovered", webhookPayload);
  } else if (monitor.status === "critical" || monitor.status === "warning") {
    if (monitor.tlsDaysRemaining !== null && monitor.tlsDaysRemaining <= 14) {
      await emitWorkspaceWebhook(workspaceId, "monitor.ssl_expiring", webhookPayload);
    }
  } else if (monitor.status === "error") {
    await emitWorkspaceWebhook(workspaceId, "monitor.dns_unhealthy", webhookPayload);
  }

  // Update tracking on the monitor record
  await updateMonitorAlertTracking(monitor.id, monitor.status, new Date());
}

/**
 * Automated Background Monitoring Runner:
 * Scans candidate resources, executes TLS/DNS probes, records logs, and fires alerts.
 */
export async function runAutomatedMonitoringJob(options?: {
  workspaceId?: string;
}): Promise<MonitorJobSummary> {
  const startTime = performance.now();
  const summary: MonitorJobSummary = {
    scannedCount: 0,
    healthyCount: 0,
    warningCount: 0,
    criticalCount: 0,
    errorCount: 0,
    alertsDispatched: 0,
    durationMs: 0,
    errors: [],
  };

  try {
    const candidates = await getMonitoringCandidates(options?.workspaceId);
    summary.scannedCount = candidates.length;

    for (const candidate of candidates) {
      try {
        const existing = await getMonitorForResource(candidate.id, candidate.workspaceId);
        const previousStatus = existing?.status || null;
        const previousAlertStatus = existing?.lastAlertStatus || null;
        const previousAlertedAt = existing?.lastAlertedAt || null;

        const updated = await probeAndSaveResource({
          id: candidate.id,
          workspaceId: candidate.workspaceId,
          name: candidate.name,
          websiteUrl: candidate.websiteUrl,
          type: candidate.type,
        });

        // Tally status counts
        if (updated.status === "healthy") summary.healthyCount++;
        else if (updated.status === "warning") summary.warningCount++;
        else if (updated.status === "critical") summary.criticalCount++;
        else summary.errorCount++;

        // Evaluate alert conditions
        const { shouldAlert, alertReason } = shouldSendMonitorAlert(
          updated.status,
          previousStatus,
          previousAlertStatus,
          previousAlertedAt
        );

        if (shouldAlert && alertReason) {
          await dispatchMonitorAlerts({
            workspaceId: candidate.workspaceId,
            workspaceName: candidate.workspaceName,
            resource: {
              id: candidate.id,
              name: candidate.name,
              ownerId: candidate.ownerId,
            },
            monitor: updated,
            alertReason,
            previousStatus,
          });
          summary.alertsDispatched++;
        }
      } catch (err) {
        summary.errors.push(
          `Failed monitoring for ${candidate.name} (${candidate.id}): ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    }
  } catch (err) {
    summary.errors.push(
      `Job level failure: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }

  summary.durationMs = Math.round(performance.now() - startTime);
  return summary;
}

