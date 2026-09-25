import type {
  DuesoraPlugin,
  ProviderPlugin,
  NotificationPlugin,
  DiscoveredAsset,
} from "./types";
import { verifyCloudflareToken, fetchCloudflareZones } from "@/lib/providers/cloudflare";
import type { DiscoveredResource } from "@/lib/providers/types";

class PluginRegistry {
  private plugins = new Map<string, DuesoraPlugin>();

  constructor() {
    this.registerBuiltinPlugins();
  }

  /**
   * Registers a new plugin instance in the runtime
   */
  public registerPlugin(plugin: DuesoraPlugin): void {
    if (!plugin.id || !plugin.name) {
      throw new Error("Plugin must have a valid id and name");
    }
    this.plugins.set(plugin.id, plugin);
  }

  /**
   * Retrieves a registered plugin by id
   */
  public getPlugin(id: string): DuesoraPlugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * Returns all currently registered plugins
   */
  public listPlugins(): DuesoraPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Lists plugins by category
   */
  public listByCategory<T extends DuesoraPlugin>(category: DuesoraPlugin["category"]): T[] {
    return Array.from(this.plugins.values()).filter((p) => p.category === category) as T[];
  }

  /**
   * Safely executes resource discovery through a registered provider plugin
   */
  public async executeProviderDiscovery(
    pluginId: string,
    credentials: Record<string, string>
  ): Promise<DiscoveredAsset[]> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Provider plugin "${pluginId}" not found`);
    }
    if (plugin.category !== "provider") {
      throw new Error(`Plugin "${pluginId}" is not a provider plugin`);
    }

    const providerPlugin = plugin as ProviderPlugin;
    return await providerPlugin.discoverResources(credentials);
  }

  /**
   * Safely dispatches an alert through a registered notification plugin
   */
  public async dispatchNotification(
    pluginId: string,
    event: string,
    payload: Record<string, unknown>,
    config: Record<string, string>
  ): Promise<{ success: boolean; error?: string }> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return { success: false, error: `Notification plugin "${pluginId}" not found` };
    }
    if (plugin.category !== "notification") {
      return { success: false, error: `Plugin "${pluginId}" is not a notification plugin` };
    }

    const notifPlugin = plugin as NotificationPlugin;
    try {
      return await notifPlugin.dispatchAlert(event, payload, config);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Register default built-in reference plugins
   */
  private registerBuiltinPlugins(): void {
    // 1. Cloudflare DNS & Domain Discovery Provider Plugin
    const cloudflarePlugin: ProviderPlugin = {
      id: "cloudflare-dns",
      name: "Cloudflare Domain & DNS Scanner",
      version: "1.0.0",
      description: "Auto-discovers active DNS zones and registered domains via Cloudflare REST API.",
      category: "provider",
      async verifyCredentials(credentials) {
        const token = credentials.apiToken || credentials.token;
        if (!token) return { valid: false, error: "Missing Cloudflare API Token" };
        return await verifyCloudflareToken(token);
      },
      async discoverResources(credentials) {
        const token = credentials.apiToken || credentials.token;
        if (!token) throw new Error("Cloudflare API Token required");
        const zones = await fetchCloudflareZones(token);
        return zones.map((z: DiscoveredResource) => ({
          externalId: z.externalId,
          name: z.name,
          type: "domain" as const,
          provider: "Cloudflare",
          status: z.status === "active" ? ("active" as const) : ("inactive" as const),
          metadata: {
            websiteUrl: z.websiteUrl,
            ...z.metadata,
          },
        }));
      },
    };

    // 2. Open Push Ntfy.sh Notification Plugin
    const ntfyPlugin: NotificationPlugin = {
      id: "ntfy-push",
      name: "ntfy.sh Push Notifications",
      version: "1.0.0",
      description: "Dispatches privacy-first push notifications to ntfy.sh topics.",
      category: "notification",
      async dispatchAlert(event, payload, config) {
        const topic = config.topic;
        const serverUrl = config.serverUrl || "https://ntfy.sh";
        if (!topic) return { success: false, error: "ntfy topic is required" };

        try {
          const res = await fetch(`${serverUrl}/${topic}`, {
            method: "POST",
            headers: {
              Title: `Duesora Alert: ${event}`,
              Priority: "default",
            },
            body: JSON.stringify(payload),
          });
          return { success: res.ok };
        } catch (err: unknown) {
          return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
      },
    };

    this.registerPlugin(cloudflarePlugin);
    this.registerPlugin(ntfyPlugin);
  }
}

// Global registry singleton
export const pluginRegistry = new PluginRegistry();
