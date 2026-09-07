import { describe, expect, it } from "vitest";
import { hasMinimumRole } from "./permissions";

describe("hasMinimumRole", () => {
  it("allows owner to satisfy all roles", () => {
    expect(hasMinimumRole("owner", "owner")).toBe(true);
    expect(hasMinimumRole("owner", "admin")).toBe(true);
    expect(hasMinimumRole("owner", "member")).toBe(true);
    expect(hasMinimumRole("owner", "viewer")).toBe(true);
  });

  it("allows admin to satisfy admin, member, and viewer", () => {
    expect(hasMinimumRole("admin", "admin")).toBe(true);
    expect(hasMinimumRole("admin", "member")).toBe(true);
    expect(hasMinimumRole("admin", "viewer")).toBe(true);
    expect(hasMinimumRole("admin", "owner")).toBe(false);
  });

  it("allows member to satisfy member and viewer only", () => {
    expect(hasMinimumRole("member", "member")).toBe(true);
    expect(hasMinimumRole("member", "viewer")).toBe(true);
    expect(hasMinimumRole("member", "admin")).toBe(false);
    expect(hasMinimumRole("member", "owner")).toBe(false);
  });

  it("allows viewer to satisfy viewer only", () => {
    expect(hasMinimumRole("viewer", "viewer")).toBe(true);
    expect(hasMinimumRole("viewer", "member")).toBe(false);
    expect(hasMinimumRole("viewer", "admin")).toBe(false);
    expect(hasMinimumRole("viewer", "owner")).toBe(false);
  });
});