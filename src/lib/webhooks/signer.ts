import crypto from "crypto";

export interface SignatureVerificationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Generates a cryptographically secure random secret for webhook authentication.
 * Formatted as whsec_<64 hex characters>.
 */
export function generateWebhookSecret(): string {
  const bytes = crypto.randomBytes(32).toString("hex");
  return `whsec_${bytes}`;
}

/**
 * Signs a raw webhook JSON payload string with HMAC-SHA256.
 * Signature header format: t={timestamp},v1={hex_signature}
 */
export function signWebhookPayload(
  payload: string,
  secret: string,
  timestamp: number = Math.floor(Date.now() / 1000)
): { signatureHeader: string; timestamp: number; signature: string } {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  return {
    signatureHeader: `t=${timestamp},v1=${signature}`,
    timestamp,
    signature,
  };
}

/**
 * Validates an incoming webhook signature using timing-safe comparison
 * and enforces timestamp replay attack protection.
 */
export function verifyWebhookSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
  toleranceSec: number = 300
): SignatureVerificationResult {
  if (!signatureHeader || !secret) {
    return { valid: false, reason: "Missing signature header or secret" };
  }

  // Parse header: t=12345678,v1=abcdef...
  const parts = signatureHeader.split(",");
  let timestampStr: string | null = null;
  let signature: string | null = null;

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t") timestampStr = value;
    if (key === "v1") signature = value;
  }

  if (!timestampStr || !signature) {
    return { valid: false, reason: "Malformed signature header format" };
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return { valid: false, reason: "Invalid timestamp in header" };
  }

  // Replay protection: check timestamp tolerance
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSec) {
    return { valid: false, reason: "Timestamp outside tolerance window (replay protection)" };
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  // Timing safe comparison
  const sigBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (sigBuffer.length !== expectedBuffer.length) {
    return { valid: false, reason: "Signature mismatch" };
  }

  const matches = crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  if (!matches) {
    return { valid: false, reason: "Signature mismatch" };
  }

  return { valid: true };
}
