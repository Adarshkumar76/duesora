import {
  CloudflareApiResponse,
  CloudflareZoneResponse,
  DiscoveredResource,
  ProviderDiscoveryResult,
} from "./types";
import { getDb } from "@/db";
import { resources } from "@/db/schema";
import { eq } from "drizzle-orm";

const CLOUDFLARE_API_URL = "https://api.cloudflare.com/client/v4";

/**
 * Validates a Cloudflare API token by calling the /user/tokens/verify endpoint.
 */
export async function verifyCloudflareToken(apiToken: string): Promise<{
  valid: boolean;
  status?: string;
  error?: string;
}> {
  if (!apiToken || apiToken.trim().length === 0) {
    return { valid: false, error: "Cloudflare API token cannot be empty." };
  }

  try {
    const response = await fetch(`${CLOUDFLARE_API_URL}/user/tokens/verify`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiToken.trim()}`,
        "Content-Type": "application/json",
      },
    });

    const data = (await response.json()) as CloudflareApiResponse<{
      id: string;
      status: string;
    }>;

    if (!response.ok || !data.success) {
      const errorMsg = data.errors?.[0]?.message || `HTTP ${response.status}: Unauthorized`;
      return { valid: false, error: errorMsg };
    }

    return {
      valid: true,
      status: data.result?.status || "active",
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Failed to connect to Cloudflare API",
    };
  }
}

/**
 * Fetches all zones/domains associated with the provided Cloudflare API Token.
 */
export async function fetchCloudflareZones(
  apiToken: string,
  options?: { perPage?: number; page?: number }
): Promise<DiscoveredResource[]> {
  const perPage = options?.perPage || 50;
  const page = options?.page || 1;

  const url = `${CLOUDFLARE_API_URL}/zones?per_page=${perPage}&page=${page}&status=active`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiToken.trim()}`,
      "Content-Type": "application/json",
    },
  });

  const data = (await response.json()) as CloudflareApiResponse<CloudflareZoneResponse[]>;

  if (!response.ok || !data.success) {
    const errorMsg = data.errors?.[0]?.message || `Cloudflare API returned error (${response.status})`;
    throw new Error(errorMsg);
  }

  const zones = data.result || [];

  return zones.map((zone): DiscoveredResource => {
    let status: DiscoveredResource["status"] = "unknown";
    if (zone.status === "active") status = "active";
    else if (zone.status === "pending") status = "pending";
    else if (zone.status === "deactivated") status = "deactivated";

    return {
      externalId: zone.id,
      name: zone.name.toLowerCase().trim(),
      type: "domain",
      provider: "Cloudflare",
      status,
      websiteUrl: `https://${zone.name.toLowerCase().trim()}`,
      metadata: {
        zoneId: zone.id,
        plan: zone.plan?.name || "Free",
        paused: zone.paused,
        nameServers: zone.name_servers || [],
        createdOn: zone.created_on,
        accountName: zone.account?.name,
      },
    };
  });
}

/**
 * Discovers Cloudflare resources and cross-references them against existing
 * resources in the workspace to identify untracked domains.
 */
export async function discoverCloudflareResources(
  workspaceId: string,
  apiToken: string
): Promise<ProviderDiscoveryResult> {
  const discovered = await fetchCloudflareZones(apiToken);

  // Cross reference with workspace database
  const db = getDb();
  const existingRecords = await db
    .select({
      id: resources.id,
      name: resources.name,
      type: resources.type,
    })
    .from(resources)
    .where(eq(resources.workspaceId, workspaceId));

  const existingMap = new Map<string, string>();
  for (const item of existingRecords) {
    existingMap.set(item.name.toLowerCase().trim(), item.id);
  }

  let newCount = 0;
  let alreadyTrackedCount = 0;

  const enrichedItems = discovered.map((item) => {
    const existingId = existingMap.get(item.name);
    if (existingId) {
      alreadyTrackedCount++;
      return {
        ...item,
        alreadyTracked: true,
        existingResourceId: existingId,
      };
    } else {
      newCount++;
      return {
        ...item,
        alreadyTracked: false,
        existingResourceId: null,
      };
    }
  });

  return {
    provider: "cloudflare",
    totalFound: discovered.length,
    newCount,
    alreadyTrackedCount,
    items: enrichedItems,
  };
}
