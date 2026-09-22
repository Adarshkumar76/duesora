export type MonitorStatus = "healthy" | "warning" | "critical" | "error" | "unknown";

export interface TlsProbeResult {
  success: boolean;
  issuer: string | null;
  subject: string | null;
  validFrom: Date | null;
  validTo: Date | null;
  daysRemaining: number | null;
  protocol: string | null;
  authorized: boolean;
  authorizationError: string | null;
  latencyMs: number;
  errorMessage: string | null;
}

export interface DnsProbeResult {
  success: boolean;
  nameservers: string[];
  ipv4: string[];
  latencyMs: number;
  errorMessage: string | null;
}

export interface FullMonitorProbeResult {
  resourceId: string;
  workspaceId: string;
  hostname: string;
  status: MonitorStatus;
  tls: TlsProbeResult;
  dns: DnsProbeResult;
  latencyMs: number;
  errorMessage: string | null;
  checkedAt: Date;
}

export interface ResourceMonitorRecord {
  id: string;
  workspaceId: string;
  resourceId: string;
  hostname: string;
  status: MonitorStatus;
  tlsIssuer: string | null;
  tlsSubject: string | null;
  tlsValidFrom: Date | null;
  tlsValidTo: Date | null;
  tlsDaysRemaining: number | null;
  tlsProtocol: string | null;
  dnsNameservers: string[];
  dnsIpv4: string[];
  latencyMs: number | null;
  lastCheckedAt: Date | null;
  errorMessage: string | null;
  lastAlertStatus: MonitorStatus | null;
  lastAlertedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceMonitorLogRecord {
  id: string;
  monitorId: string;
  resourceId: string;
  workspaceId: string;
  status: MonitorStatus;
  latencyMs: number | null;
  tlsDaysRemaining: number | null;
  message: string | null;
  checkedAt: Date;
}
