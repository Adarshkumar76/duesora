import crypto from "crypto";
import { env } from "@/lib/env";

/**
 * Generates a deterministic, secure feed token for a workspace calendar.
 */
export function generateCalendarToken(workspaceId: string): string {
  const secret = env.AUTH_SECRET || "default-duesora-auth-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(`calendar-feed:${workspaceId}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Verifies that a calendar feed token matches the expected workspace token.
 */
export function verifyCalendarToken(workspaceId: string, token: string): boolean {
  if (!workspaceId || !token) return false;
  const expected = generateCalendarToken(workspaceId);

  if (expected.length !== token.length) return false;

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}
