import { describe, expect, it } from "vitest";
import { createResourceSchema } from "./validation";

describe("createResourceSchema", () => {
  it("accepts a valid resource", () => {
    const result = createResourceSchema.safeParse({
      name: "example.com",
      type: "domain",
      provider: "Cloudflare",
      websiteUrl: "https://example.com",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = createResourceSchema.safeParse({
      name: "",
      type: "domain",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid resource type", () => {
    const result = createResourceSchema.safeParse({
      name: "example",
      type: "something_random",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid website URL", () => {
    const result = createResourceSchema.safeParse({
      name: "example",
      type: "domain",
      websiteUrl: "not-a-url",
    });

    expect(result.success).toBe(false);
  });
});
