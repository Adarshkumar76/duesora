import { describe, expect, it } from "vitest";
import { createResourceSchema } from "@/lib/resources/validation";

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

  it("rejects javascript: pseudo-protocol XSS in website URL", () => {
    const result = createResourceSchema.safeParse({
      name: "example",
      type: "domain",
      websiteUrl: "javascript:alert(document.cookie)",
    });

    expect(result.success).toBe(false);
  });

  it("sanitizes script tags from resource name and description", () => {
    const result = createResourceSchema.safeParse({
      name: "My Domain <script>alert(1)</script>",
      type: "domain",
      description: "Description with <script>console.log('hack')</script> text",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My Domain");
      expect(result.data.description).toBe("Description with text");
    }
  });
});
