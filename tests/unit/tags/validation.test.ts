import { describe, expect, it } from "vitest";
import { createTagSchema } from "@/lib/tags/validation";

describe("createTagSchema", () => {
  it("accepts a valid tag name and color token", () => {
    const result = createTagSchema.safeParse({
      name: "production",
      colorToken: "emerald",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("production");
      expect(result.data.colorToken).toBe("emerald");
    }
  });

  it("defaults colorToken to slate when not specified", () => {
    const result = createTagSchema.safeParse({
      name: "infra",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.colorToken).toBe("slate");
    }
  });

  it("rejects an empty tag name", () => {
    const result = createTagSchema.safeParse({
      name: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid color token", () => {
    const result = createTagSchema.safeParse({
      name: "my-tag",
      colorToken: "neon-rainbow",
    });

    expect(result.success).toBe(false);
  });

  it("sanitizes HTML tags from tag name", () => {
    const result = createTagSchema.safeParse({
      name: "<script>alert(1)</script>frontend",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("frontend");
    }
  });

  it("rejects names longer than 50 characters", () => {
    const result = createTagSchema.safeParse({
      name: "a".repeat(51),
    });

    expect(result.success).toBe(false);
  });
});
