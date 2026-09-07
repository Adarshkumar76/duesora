import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { envSchema } from "./env";

describe("Environment Validation", () => {
  it("parses valid environment configurations", () => {
    const parsed = envSchema.safeParse({
      NODE_ENV: "production",
      APP_URL: "https://duesora.example.com",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
      REDIS_URL: "redis://localhost:6379",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.NODE_ENV).toBe("production");
      expect(parsed.data.APP_URL).toBe("https://duesora.example.com");
      expect(parsed.data.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/db");
      expect(parsed.data.REDIS_URL).toBe("redis://localhost:6379");
    }
  });

  it("provides sensible defaults for development", () => {
    const parsed = envSchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.NODE_ENV).toBe("development");
      expect(parsed.data.APP_URL).toBe("http://localhost:3000");
      expect(parsed.data.DATABASE_URL).toBe("postgresql://duesora:duesora@localhost:5432/duesora");
    }
  });

  it("fails on invalid URL for APP_URL", () => {
    const parsed = envSchema.safeParse({
      APP_URL: "not-a-valid-url",
    });
    expect(parsed.success).toBe(false);
  });
});
