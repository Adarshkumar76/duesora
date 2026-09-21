import { describe, it, expect, vi } from "vitest";
import { extractHostname, formatIssuer, probeTls } from "@/lib/monitors/tls";
import tls from "tls";

describe("TLS Monitor: extractHostname", () => {
  it("extracts hostname from full URLs", () => {
    expect(extractHostname("https://google.com/search?q=test")).toBe("google.com");
    expect(extractHostname("http://sub.domain.co.uk:8080/path")).toBe("sub.domain.co.uk");
    expect(extractHostname("https://app.duesora.com")).toBe("app.duesora.com");
  });

  it("extracts hostname from naked domains or hostnames", () => {
    expect(extractHostname("example.com")).toBe("example.com");
    expect(extractHostname("api.example.org/v1")).toBe("api.example.org");
    expect(extractHostname("localhost:3000")).toBe("localhost");
  });

  it("returns null for invalid inputs", () => {
    expect(extractHostname("")).toBeNull();
    expect(extractHostname("   ")).toBeNull();
    // @ts-expect-error test invalid type
    expect(extractHostname(null)).toBeNull();
  });
});

describe("TLS Monitor: formatIssuer", () => {
  it("formats issuer with both organization and common name", () => {
    expect(formatIssuer({ O: "Let's Encrypt", CN: "R3" })).toBe("Let's Encrypt (R3)");
  });

  it("formats issuer with organization only if same as CN or CN missing", () => {
    expect(formatIssuer({ O: "Cloudflare, Inc.", CN: "Cloudflare, Inc." })).toBe("Cloudflare, Inc.");
    expect(formatIssuer({ O: "DigiCert Inc" })).toBe("DigiCert Inc");
  });

  it("formats issuer with common name only if organization missing", () => {
    expect(formatIssuer({ CN: "GlobalSign RSA" })).toBe("GlobalSign RSA");
  });

  it("returns null for empty or undefined issuer", () => {
    expect(formatIssuer(undefined)).toBeNull();
    expect(formatIssuer({})).toBeNull();
  });
});

describe("TLS Monitor: probeTls", () => {
  it("returns error result for invalid hostname", async () => {
    const result = await probeTls("");
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe("Invalid hostname provided");
  });

  it("successfully extracts certificate fields on mocked TLS connection", async () => {
    const mockSocket = {
      destroy: vi.fn(),
      setTimeout: vi.fn(),
      getPeerCertificate: vi.fn().mockReturnValue({
        valid_from: "Jan  1 00:00:00 2026 GMT",
        valid_to: "Dec 31 23:59:59 2026 GMT",
        issuer: { O: "Let's Encrypt", CN: "E1" },
        subject: { CN: "duesora.com" },
      }),
      getProtocol: vi.fn().mockReturnValue("TLSv1.3"),
      authorized: true,
      authorizationError: null,
      on: vi.fn(),
    };

    vi.spyOn(tls, "connect").mockImplementation(((options: unknown, callback?: () => void) => {
      if (callback) {
        setTimeout(callback, 5);
      }
      return mockSocket as unknown as tls.TLSSocket;
    }) as unknown as typeof tls.connect);

    const result = await probeTls("duesora.com");
    expect(result.success).toBe(true);
    expect(result.issuer).toBe("Let's Encrypt (E1)");
    expect(result.protocol).toBe("TLSv1.3");
    expect(result.authorized).toBe(true);
    expect(result.subject).toBe("duesora.com");
    expect(result.validFrom).toBeInstanceOf(Date);
    expect(result.validTo).toBeInstanceOf(Date);

    vi.restoreAllMocks();
  });
});
