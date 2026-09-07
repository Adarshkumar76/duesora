import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("Password hashing utilities", () => {
  it("hashes a password and verifies it successfully", async () => {
    const plain = "securePassword123!";
    const hash = await hashPassword(plain);

    expect(hash).toBeDefined();
    expect(hash).not.toEqual(plain);
    expect(hash.startsWith("$2")).toBe(true);

    const isValid = await verifyPassword(plain, hash);
    expect(isValid).toBe(true);
  });

  it("fails verification with incorrect password", async () => {
    const plain = "correctHorseBatteryStaple";
    const hash = await hashPassword(plain);

    const isValid = await verifyPassword("wrongPassword", hash);
    expect(isValid).toBe(false);
  });
});
