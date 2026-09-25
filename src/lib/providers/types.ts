/**
 * Provider Auto-Discovery & Sync Engine Types
 */

export type ProviderType = "cloudflare" | "aws_route53";

export interface DiscoveredResource {
  externalId: string;
  name: string;
  type: "domain" | "subscription" | "other";
  provider: string;
  status: "active" | "pending" | "deactivated" | "unknown";
  websiteUrl?: string | null;
  renewalDate?: Date | null;
  cancellationNoticeDays?: number | null;
  metadata?: Record<string, unknown>;
  alreadyTracked?: boolean;
  existingResourceId?: string | null;
}

export interface ProviderDiscoveryResult {
  provider: ProviderType;
  totalFound: number;
  newCount: number;
  alreadyTrackedCount: number;
  items: DiscoveredResource[];
}

export interface CloudflareZoneResponse {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  type: string;
  development_mode: number;
  name_servers?: string[];
  original_name_servers?: string[];
  created_on?: string;
  modified_on?: string;
  account?: {
    id: string;
    name: string;
  };
  plan?: {
    id: string;
    name: string;
    price: number;
    currency: string;
    frequency: string;
  };
}

export interface CloudflareApiResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: Array<{ code: number; message: string }>;
  result: T;
  result_info?: {
    page: number;
    per_page: number;
    count: number;
    total_count: number;
    total_pages: number;
  };
}
