export type ChatProvider = "slack" | "discord";

export type ChatEventType =
  | "reminder.upcoming"
  | "reminder.overdue"
  | "monitor.degraded"
  | "monitor.recovered"
  | "test";

export interface RenewalAlertData {
  resourceId: string;
  resourceName: string;
  resourceType?: string | null;
  provider?: string | null;
  daysRemaining: number;
  renewalDate: Date | string | null;
  amountMinor?: number | null;
  currency?: string | null;
  billingCycle?: string | null;
  workspaceName?: string;
  appUrl?: string;
}

export interface MonitorAlertData {
  resourceId: string;
  resourceName: string;
  hostname?: string | null;
  status: "healthy" | "warning" | "critical" | "error" | "unknown";
  previousStatus?: string | null;
  alertReason: "degraded" | "recovered" | "periodic_degraded" | "reminder";
  daysRemaining?: number | null;
  issuer?: string | null;
  latencyMs?: number | null;
  workspaceName?: string;
  appUrl?: string;
}

export interface TestAlertData {
  workspaceName: string;
  testedBy?: string;
  channelName: string;
  provider: ChatProvider;
}

export interface NotificationChannelItem {
  id: string;
  workspaceId: string;
  provider: ChatProvider;
  name: string;
  webhookUrl: string;
  events: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
