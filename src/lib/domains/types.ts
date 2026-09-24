import type { MonitorStatus } from "@/lib/monitors/types";

export interface DomainMonitorInfo {
  id: string;
  hostname: string;
  status: MonitorStatus;
  tlsIssuer: string | null;
  tlsSubject: string | null;
  tlsValidFrom: Date | null;
  tlsValidTo: Date | null;
  tlsDaysRemaining: number | null;
  tlsProtocol: string | null;
  dnsNameservers: string | null;
  dnsIpv4: string | null;
  latencyMs: number | null;
  lastCheckedAt: Date | null;
  errorMessage: string | null;
}

export interface DomainItem {
  id: string;
  workspaceId: string;
  name: string;
  type: "domain" | "ssl_certificate";
  status: "active" | "inactive" | "expired" | "archived";
  category: string | null;
  provider: string | null;
  websiteUrl: string | null;
  amountMinor: number | null;
  currency: string;
  billingCycle: string;
  renewalDate: Date | null;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
  ownerName: string | null;
  ownerEmail: string | null;
  monitor: DomainMonitorInfo | null;
}

export interface DomainMetrics {
  totalDomains: number;
  totalCertificates: number;
  healthyMonitors: number;
  expiringSoon: number; // <= 30 days on renewal or cert
  failingMonitors: number; // critical or error
}

export interface ListDomainsOptions {
  search?: string | null;
  type?: "all" | "domain" | "ssl_certificate" | null;
  health?: "all" | "healthy" | "warning" | "critical" | "error" | "unmonitored" | null;
  status?: "all" | "active" | "inactive" | "expired" | null;
  page?: number;
  pageSize?: number;
}
