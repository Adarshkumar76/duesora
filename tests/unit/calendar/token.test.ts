import { describe, it, expect } from "vitest";
import { generateCalendarToken, verifyCalendarToken } from "@/lib/calendar/token";

describe("Calendar Feed: Token Generation & Verification", () => {
  const workspaceId = "ws-12345-abcde";

  it("generates a deterministic 32-char hex token", () => {
    const token1 = generateCalendarToken(workspaceId);
    const token2 = generateCalendarToken(workspaceId);

    expect(token1).toHaveLength(32);
    expect(token1).toBe(token2);
  });

  it("successfully verifies a valid token", () => {
    const token = generateCalendarToken(workspaceId);
    expect(verifyCalendarToken(workspaceId, token)).toBe(true);
  });

  it("rejects an invalid or tampered token", () => {
    const token = generateCalendarToken(workspaceId);
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");

    expect(verifyCalendarToken(workspaceId, tampered)).toBe(false);
    expect(verifyCalendarToken(workspaceId, "random-token-123")).toBe(false);
    expect(verifyCalendarToken(workspaceId, "")).toBe(false);
    expect(verifyCalendarToken("other-workspace", token)).toBe(false);
  });
});
