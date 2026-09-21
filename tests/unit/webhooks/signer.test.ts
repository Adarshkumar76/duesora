import { describe, expect, it } from "vitest";
import {
  generateWebhookSecret,
  signWebhookPayload,
  verifyWebhookSignature,
} from "@/lib/webhooks/signer";

describe("Webhook HMAC-SHA256 Signer & Replay Defense", () => {
  const secret = "whsec_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const payload = JSON.stringify({ event: "resource.created", id: "123" });

  describe("generateWebhookSecret", () => {
    it("generates a random secret starting with whsec_", () => {
      const sec1 = generateWebhookSecret();
      const sec2 = generateWebhookSecret();

      expect(sec1).toMatch(/^whsec_[a-f0-9]{64}$/);
      expect(sec2).toMatch(/^whsec_[a-f0-9]{64}$/);
      expect(sec1).not.toBe(sec2);
    });
  });

  describe("signWebhookPayload", () => {
    it("generates header in t={timestamp},v1={signature} format", () => {
      const fixedTimestamp = 1760000000;
      const { signatureHeader, timestamp, signature } = signWebhookPayload(
        payload,
        secret,
        fixedTimestamp
      );

      expect(timestamp).toBe(fixedTimestamp);
      expect(signatureHeader).toBe(`t=${fixedTimestamp},v1=${signature}`);
      expect(signature).toHaveLength(64);
    });
  });

  describe("verifyWebhookSignature", () => {
    it("successfully verifies authentic signature within tolerance", () => {
      const now = Math.floor(Date.now() / 1000);
      const { signatureHeader } = signWebhookPayload(payload, secret, now);

      const result = verifyWebhookSignature(payload, signatureHeader, secret);
      expect(result.valid).toBe(true);
    });

    it("rejects signature signed with incorrect secret", () => {
      const now = Math.floor(Date.now() / 1000);
      const { signatureHeader } = signWebhookPayload(payload, secret, now);
      const wrongSecret = "whsec_wrongsecretwrongsecretwrongsecretwrongsecretwrongsecret123456";

      const result = verifyWebhookSignature(payload, signatureHeader, wrongSecret);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Signature mismatch");
    });

    it("rejects tampered payload content", () => {
      const now = Math.floor(Date.now() / 1000);
      const { signatureHeader } = signWebhookPayload(payload, secret, now);
      const tamperedPayload = JSON.stringify({ event: "resource.created", id: "999" });

      const result = verifyWebhookSignature(tamperedPayload, signatureHeader, secret);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Signature mismatch");
    });

    it("rejects expired timestamp (replay attack defense)", () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
      const { signatureHeader } = signWebhookPayload(payload, secret, oldTimestamp);

      // Default tolerance is 300s (5 minutes)
      const result = verifyWebhookSignature(payload, signatureHeader, secret, 300);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("replay protection");
    });

    it("rejects malformed signature headers", () => {
      expect(verifyWebhookSignature(payload, "invalid-header", secret).valid).toBe(false);
      expect(verifyWebhookSignature(payload, "t=abc,v1=123", secret).valid).toBe(false);
      expect(verifyWebhookSignature(payload, "", secret).valid).toBe(false);
    });
  });
});
