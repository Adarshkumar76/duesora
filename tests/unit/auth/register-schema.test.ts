import { describe, it, expect } from "vitest";
import { registerSchema } from "@/lib/auth/register-schema";

describe("Registration Schema Validation", () => {
  it("validates correct registration inputs", () => {
    const input = {
      name: "Adarsh Kumar",
      email: "user@duesora.com",
      password: "password123",
      confirmPassword: "password123",
      acceptedTerms: true,
    };

    const result = registerSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("fails if passwords do not match", () => {
    const input = {
      name: "Adarsh Kumar",
      email: "user@duesora.com",
      password: "password123",
      confirmPassword: "differentPassword",
      acceptedTerms: true,
    };

    const result = registerSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((i) => i.path.includes("confirmPassword"))).toBe(true);
    }
  });

  it("fails if password is under 8 characters", () => {
    const input = {
      name: "Adarsh Kumar",
      email: "user@duesora.com",
      password: "short",
      confirmPassword: "short",
      acceptedTerms: true,
    };

    const result = registerSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("fails if acceptedTerms is false", () => {
    const input = {
      name: "Adarsh Kumar",
      email: "user@duesora.com",
      password: "password123",
      confirmPassword: "password123",
      acceptedTerms: false,
    };

    const result = registerSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("sanitizes XSS payloads in name input", () => {
    const input = {
      name: "Adarsh <script>alert('xss')</script>Kumar",
      email: "user@duesora.com",
      password: "password123",
      confirmPassword: "password123",
      acceptedTerms: true,
    };

    const result = registerSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Adarsh Kumar");
      expect(result.data.name).not.toContain("<script>");
    }
  });

  it("rejects passwords containing null bytes", () => {
    const input = {
      name: "Adarsh Kumar",
      email: "user@duesora.com",
      password: "password123\0admin",
      confirmPassword: "password123\0admin",
      acceptedTerms: true,
    };

    const result = registerSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
