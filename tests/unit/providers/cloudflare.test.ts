/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  verifyCloudflareToken,
  fetchCloudflareZones,
  discoverCloudflareResources,
} from "@/lib/providers/cloudflare";
import { getDb } from "@/db";

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

describe("Cloudflare Provider Discovery Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("verifyCloudflareToken", () => {
    it("returns error for empty token", async () => {
      const res = await verifyCloudflareToken("");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("cannot be empty");
    });

    it("verifies token successfully against Cloudflare API", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          result: { id: "tok-123", status: "active" },
          errors: [],
          messages: [],
        }),
      } as any);

      const res = await verifyCloudflareToken("valid-cf-token");
      expect(res.valid).toBe(true);
      expect(res.status).toBe("active");
    });

    it("handles invalid token response from Cloudflare API", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          errors: [{ code: 1000, message: "Invalid API Token" }],
        }),
      } as any);

      const res = await verifyCloudflareToken("bad-token");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Invalid API Token");
    });
  });

  describe("fetchCloudflareZones", () => {
    it("maps Cloudflare zones to DiscoveredResource format", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          result: [
            {
              id: "zone-1",
              name: "AcmeApp.io",
              status: "active",
              paused: false,
              plan: { name: "Pro" },
              created_on: "2025-01-01T00:00:00Z",
              name_servers: ["ns1.cloudflare.com", "ns2.cloudflare.com"],
            },
          ],
        }),
      } as any);

      const zones = await fetchCloudflareZones("dummy-token");
      expect(zones).toHaveLength(1);
      expect(zones[0].name).toBe("acmeapp.io");
      expect(zones[0].provider).toBe("Cloudflare");
      expect(zones[0].type).toBe("domain");
      expect(zones[0].status).toBe("active");
      expect(zones[0].websiteUrl).toBe("https://acmeapp.io");
    });
  });

  describe("discoverCloudflareResources", () => {
    it("cross-references discovered zones against existing workspace resources", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          result: [
            { id: "z-1", name: "tracked.com", status: "active" },
            { id: "z-2", name: "newdomain.dev", status: "active" },
          ],
        }),
      } as any);

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { id: "res-existing-1", name: "tracked.com", type: "domain" },
            ]),
          }),
        }),
      };
      vi.mocked(getDb).mockReturnValue(mockDb as any);

      const result = await discoverCloudflareResources("ws-1", "dummy-token");

      expect(result.provider).toBe("cloudflare");
      expect(result.totalFound).toBe(2);
      expect(result.alreadyTrackedCount).toBe(1);
      expect(result.newCount).toBe(1);

      const tracked = result.items.find((i) => i.name === "tracked.com");
      expect(tracked?.alreadyTracked).toBe(true);
      expect(tracked?.existingResourceId).toBe("res-existing-1");

      const newDomain = result.items.find((i) => i.name === "newdomain.dev");
      expect(newDomain?.alreadyTracked).toBe(false);
      expect(newDomain?.existingResourceId).toBeNull();
    });
  });
});
