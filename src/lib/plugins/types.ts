export type PluginCategory = "provider" | "notification" | "audit";

export interface PluginContext {
  workspaceId?: string;
  config?: Record<string, string>;
}

export interface DiscoveredAsset {
  externalId: string;
  name: string;
  type: "domain" | "subscription" | "cloud_service" | "hosting" | "software_license";
  provider: string;
  status: "active" | "inactive" | "expired";
  websiteUrl?: string;
  renewalDate?: string; // ISO string
  amountMinor?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface BasePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  category: PluginCategory;
  onInit?(context: PluginContext): Promise<void>;
  onDestroy?(): Promise<void>;
}

export interface ProviderPlugin extends BasePlugin {
  category: "provider";
  discoverResources(credentials: Record<string, string>): Promise<DiscoveredAsset[]>;
  verifyCredentials?(credentials: Record<string, string>): Promise<{ valid: boolean; error?: string }>;
}

export interface NotificationPlugin extends BasePlugin {
  category: "notification";
  dispatchAlert(
    event: string,
    payload: Record<string, unknown>,
    config: Record<string, string>
  ): Promise<{ success: boolean; error?: string }>;
}

export type DuesoraPlugin = ProviderPlugin | NotificationPlugin | BasePlugin;
