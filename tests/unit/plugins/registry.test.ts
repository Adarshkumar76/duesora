import { describe, it, expect } from "vitest";
import { pluginRegistry } from "@/lib/plugins/registry";
import type { ProviderPlugin, NotificationPlugin } from "@/lib/plugins/types";

describe("Plugin Architecture & Registry", () => {
  it("registers and lists built-in reference plugins", () => {
    const plugins = pluginRegistry.listPlugins();
    expect(plugins.length).toBeGreaterThanOrEqual(2);

    const cloudflare = pluginRegistry.getPlugin("cloudflare-dns");
    expect(cloudflare).toBeDefined();
    expect(cloudflare?.name).toContain("Cloudflare");
    expect(cloudflare?.category).toBe("provider");

    const ntfy = pluginRegistry.getPlugin("ntfy-push");
    expect(ntfy).toBeDefined();
    expect(ntfy?.category).toBe("notification");
  });

  it("registers a custom provider plugin and executes discovery", async () => {
    const customPlugin: ProviderPlugin = {
      id: "mock-dns-provider",
      name: "Mock DNS Provider",
      version: "1.0.0",
      description: "Mock provider for test verification",
      category: "provider",
      async discoverResources() {
        return [
          {
            externalId: "ext-1",
            name: "example.org",
            type: "domain",
            provider: "MockDNS",
            status: "active",
          },
        ];
      },
    };

    pluginRegistry.registerPlugin(customPlugin);

    const asset = await pluginRegistry.executeProviderDiscovery("mock-dns-provider", {
      token: "test-token",
    });

    expect(asset.length).toBe(1);
    expect(asset[0].name).toBe("example.org");
    expect(asset[0].provider).toBe("MockDNS");
  });

  it("handles custom notification plugin dispatch and captures errors safely", async () => {
    const customNotif: NotificationPlugin = {
      id: "mock-webhook-notif",
      name: "Mock Notification",
      version: "0.1.0",
      description: "Test notification plugin",
      category: "notification",
      async dispatchAlert(event, payload, config) {
        if (!config.channel) {
          throw new Error("Missing channel parameter");
        }
        return { success: true };
      },
    };

    pluginRegistry.registerPlugin(customNotif);

    const failure = await pluginRegistry.dispatchNotification(
      "mock-webhook-notif",
      "test.event",
      { test: true },
      {}
    );
    expect(failure.success).toBe(false);
    expect(failure.error).toContain("Missing channel");

    const success = await pluginRegistry.dispatchNotification(
      "mock-webhook-notif",
      "test.event",
      { test: true },
      { channel: "#devops" }
    );
    expect(success.success).toBe(true);
  });
});
