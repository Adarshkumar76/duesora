import dns from "dns/promises";
import { extractHostname } from "./tls";
import type { DnsProbeResult } from "./types";

/**
 * Resolves nameservers and IPv4 records for a given hostname.
 */
export async function probeDns(hostname: string): Promise<DnsProbeResult> {
  const cleanHost = extractHostname(hostname);
  if (!cleanHost) {
    return {
      success: false,
      nameservers: [],
      ipv4: [],
      latencyMs: 0,
      errorMessage: "Invalid hostname for DNS resolution",
    };
  }

  const startTime = Date.now();
  let nameservers: string[] = [];
  let ipv4: string[] = [];
  let errorMessage: string | null = null;

  try {
    // Resolve IPv4
    try {
      ipv4 = await dns.resolve4(cleanHost);
    } catch {
      // IPv4 resolution might fail if hostname is an apex with only CNAME, or not mapped
    }

    // Resolve Nameservers (for the domain or apex)
    try {
      nameservers = await dns.resolveNs(cleanHost);
    } catch {
      // If subdomain fails NS lookup, try apex domain
      const parts = cleanHost.split(".");
      if (parts.length > 2) {
        const apex = parts.slice(-2).join(".");
        try {
          nameservers = await dns.resolveNs(apex);
        } catch {}
      }
    }

    const latencyMs = Date.now() - startTime;
    const success = ipv4.length > 0 || nameservers.length > 0;

    if (!success) {
      errorMessage = `DNS could not resolve A or NS records for ${cleanHost}`;
    }

    return {
      success,
      nameservers,
      ipv4,
      latencyMs,
      errorMessage,
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      nameservers: [],
      ipv4: [],
      latencyMs,
      errorMessage: err instanceof Error ? err.message : "DNS resolution failed",
    };
  }
}
