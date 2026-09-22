import { describe, it, expect } from "vitest";
import { determineOverallStatus } from "@/lib/monitors/service";
import type { TlsProbeResult, DnsProbeResult } from "@/lib/monitors/types";

describe("Monitoring Service: determineOverallStatus", () => {
  const baseDnsSuccess: DnsProbeResult = {
    success: true,
    nameservers: ["ns1.example.com"],
    ipv4: ["93.184.216.34"],
    latencyMs: 15,
    errorMessage: null,
  };

  const baseDnsFailure: DnsProbeResult = {
    success: false,
    nameservers: [],
    ipv4: [],
    latencyMs: 50,
    errorMessage: "ENOTFOUND",
  };

  it("returns 'healthy' when TLS is valid for 30+ days", () => {
    const tls: TlsProbeResult = {
      success: true,
      issuer: "Let's Encrypt",
      subject: "example.com",
      validFrom: new Date(),
      validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      daysRemaining: 60,
      protocol: "TLSv1.3",
      authorized: true,
      authorizationError: null,
      latencyMs: 45,
      errorMessage: null,
    };
    expect(determineOverallStatus(tls, baseDnsSuccess)).toBe("healthy");
  });

  it("returns 'warning' when TLS expires in less than 30 days but more than 7 days", () => {
    const tls: TlsProbeResult = {
      success: true,
      issuer: "Let's Encrypt",
      subject: "example.com",
      validFrom: new Date(),
      validTo: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      daysRemaining: 14,
      protocol: "TLSv1.3",
      authorized: true,
      authorizationError: null,
      latencyMs: 45,
      errorMessage: null,
    };
    expect(determineOverallStatus(tls, baseDnsSuccess)).toBe("warning");
  });

  it("returns 'critical' when TLS expires in 7 days or less, or is expired", () => {
    const tlsExpiring: TlsProbeResult = {
      success: true,
      issuer: "Let's Encrypt",
      subject: "example.com",
      validFrom: new Date(),
      validTo: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      daysRemaining: 3,
      protocol: "TLSv1.3",
      authorized: true,
      authorizationError: null,
      latencyMs: 45,
      errorMessage: null,
    };
    expect(determineOverallStatus(tlsExpiring, baseDnsSuccess)).toBe("critical");

    const tlsExpired: TlsProbeResult = {
      ...tlsExpiring,
      daysRemaining: -2,
    };
    expect(determineOverallStatus(tlsExpired, baseDnsSuccess)).toBe("critical");
  });

  it("returns 'warning' when TLS fails but DNS resolves", () => {
    const tlsFailed: TlsProbeResult = {
      success: false,
      issuer: null,
      subject: null,
      validFrom: null,
      validTo: null,
      daysRemaining: null,
      protocol: null,
      authorized: false,
      authorizationError: "ECONNREFUSED",
      latencyMs: 50,
      errorMessage: "Connection refused",
    };
    expect(determineOverallStatus(tlsFailed, baseDnsSuccess)).toBe("warning");
  });

  it("returns 'error' when both TLS and DNS fail", () => {
    const tlsFailed: TlsProbeResult = {
      success: false,
      issuer: null,
      subject: null,
      validFrom: null,
      validTo: null,
      daysRemaining: null,
      protocol: null,
      authorized: false,
      authorizationError: "ENOTFOUND",
      latencyMs: 50,
      errorMessage: "Host not found",
    };
    expect(determineOverallStatus(tlsFailed, baseDnsFailure)).toBe("error");
  });
});
