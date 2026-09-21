import { describe, it, expect, vi } from "vitest";
import { probeDns } from "@/lib/monitors/dns";
import dns from "dns/promises";

describe("DNS Monitor: probeDns", () => {
  it("returns error result for invalid hostname", async () => {
    const result = await probeDns("");
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe("Invalid hostname for DNS resolution");
  });

  it("resolves nameservers and IPv4 successfully with mocked dns", async () => {
    vi.spyOn(dns, "resolve4").mockResolvedValue(["1.1.1.1", "1.0.0.1"]);
    vi.spyOn(dns, "resolveNs").mockResolvedValue(["ns1.cloudflare.com", "ns2.cloudflare.com"]);

    const result = await probeDns("cloudflare.com");
    expect(result.success).toBe(true);
    expect(result.ipv4).toEqual(["1.1.1.1", "1.0.0.1"]);
    expect(result.nameservers).toEqual(["ns1.cloudflare.com", "ns2.cloudflare.com"]);
    expect(result.errorMessage).toBeNull();

    vi.restoreAllMocks();
  });

  it("handles DNS lookup errors gracefully", async () => {
    vi.spyOn(dns, "resolve4").mockRejectedValue(new Error("ENOTFOUND"));
    vi.spyOn(dns, "resolveNs").mockRejectedValue(new Error("ENOTFOUND"));

    const result = await probeDns("nonexistent-domain-xyz-12345.org");
    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain("could not resolve");

    vi.restoreAllMocks();
  });
});
