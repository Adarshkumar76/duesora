import tls from "tls";
import type { TlsProbeResult } from "./types";

/**
 * Extracts a clean hostname from a URL, domain, or host:port string.
 */
export function extractHostname(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    // If it starts with a protocol, parse via URL
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//i.test(trimmed)) {
      const parsed = new URL(trimmed);
      return parsed.hostname.toLowerCase();
    }

    // If it doesn't have a protocol, add https:// to parse cleanly
    const parsed = new URL(`https://${trimmed}`);
    return parsed.hostname.toLowerCase();
  } catch {
    // Fallback regex for plain domain / hostname
    const match = trimmed.replace(/^https?:\/\//i, "").split(/[\/?#:]/)[0];
    return match ? match.toLowerCase() : null;
  }
}

/**
 * Parses an issuer object from node's PeerCertificate into a readable string.
 */
export function formatIssuer(issuer: tls.Certificate | Record<string, unknown> | undefined): string | null {
  if (!issuer || typeof issuer !== "object") return null;

  const org = (issuer as Record<string, unknown>).O;
  const commonName = (issuer as Record<string, unknown>).CN;

  if (typeof org === "string" && org.trim()) {
    if (typeof commonName === "string" && commonName.trim() && commonName !== org) {
      return `${org} (${commonName})`;
    }
    return org;
  }

  if (typeof commonName === "string" && commonName.trim()) {
    return commonName;
  }

  return null;
}

/**
 * Probes a hostname over TLS/SSL on port 443 with SNI.
 * Enforces a strict timeout and extracts certificate validity, issuer, and protocol.
 */
export async function probeTls(hostname: string, port = 443, timeoutMs = 5000): Promise<TlsProbeResult> {
  const cleanHost = extractHostname(hostname);
  if (!cleanHost) {
    return {
      success: false,
      issuer: null,
      subject: null,
      validFrom: null,
      validTo: null,
      daysRemaining: null,
      protocol: null,
      authorized: false,
      authorizationError: "Invalid hostname",
      latencyMs: 0,
      errorMessage: "Invalid hostname provided",
    };
  }

  const startTime = Date.now();

  return new Promise<TlsProbeResult>((resolve) => {
    let resolved = false;

    const finalize = (result: TlsProbeResult) => {
      if (resolved) return;
      resolved = true;
      try {
        socket.destroy();
      } catch {}
      resolve(result);
    };

    const socket = tls.connect(
      {
        host: cleanHost,
        port,
        servername: cleanHost,
        rejectUnauthorized: false, // Allows inspecting expired or self-signed certs safely
        timeout: timeoutMs,
      },
      () => {
        const latencyMs = Date.now() - startTime;
        const cert = socket.getPeerCertificate(false);
        const protocol = socket.getProtocol() || null;
        const authorized = socket.authorized;
        const authError = socket.authorizationError ? String(socket.authorizationError) : null;

        if (!cert || Object.keys(cert).length === 0) {
          return finalize({
            success: false,
            issuer: null,
            subject: null,
            validFrom: null,
            validTo: null,
            daysRemaining: null,
            protocol,
            authorized,
            authorizationError: authError,
            latencyMs,
            errorMessage: "No TLS/SSL certificate presented by host",
          });
        }

        const validFrom = cert.valid_from ? new Date(cert.valid_from) : null;
        const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
        const issuer = formatIssuer(cert.issuer);
        const subject = typeof cert.subject?.CN === "string" ? cert.subject.CN : cleanHost;

        let daysRemaining: number | null = null;
        if (validTo && !isNaN(validTo.getTime())) {
          const diffMs = validTo.getTime() - Date.now();
          daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));
        }

        let errorMessage: string | null = null;
        if (!authorized && authError) {
          errorMessage = authError;
        } else if (daysRemaining !== null && daysRemaining <= 0) {
          errorMessage = "Certificate has expired";
        }

        finalize({
          success: true,
          issuer,
          subject,
          validFrom,
          validTo,
          daysRemaining,
          protocol,
          authorized,
          authorizationError: authError,
          latencyMs,
          errorMessage,
        });
      }
    );

    socket.on("timeout", () => {
      finalize({
        success: false,
        issuer: null,
        subject: null,
        validFrom: null,
        validTo: null,
        daysRemaining: null,
        protocol: null,
        authorized: false,
        authorizationError: "ETIMEDOUT",
        latencyMs: timeoutMs,
        errorMessage: `TLS connection timed out after ${timeoutMs}ms`,
      });
    });

    socket.on("error", (err: Error) => {
      const latencyMs = Date.now() - startTime;
      finalize({
        success: false,
        issuer: null,
        subject: null,
        validFrom: null,
        validTo: null,
        daysRemaining: null,
        protocol: null,
        authorized: false,
        authorizationError: err.message,
        latencyMs,
        errorMessage: err.message || "Failed to establish TLS handshake",
      });
    });
  });
}
