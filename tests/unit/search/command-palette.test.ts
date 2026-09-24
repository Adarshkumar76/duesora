import { describe, it, expect } from "vitest";

describe("Command Palette Search Filtering", () => {
  const staticNavigation = [
    { title: "Dashboard", href: "/dashboard", category: "Navigation" },
    { title: "Resources", href: "/resources", category: "Navigation" },
    { title: "Domains & SSL Health", href: "/domains", category: "Navigation" },
    { title: "Subscriptions", href: "/subscriptions", category: "Navigation" },
    { title: "Renewals Pipeline", href: "/renewals", category: "Navigation" },
    { title: "Reports & Spend Analytics", href: "/reports", category: "Navigation" },
    { title: "Notifications", href: "/notifications", category: "Navigation" },
    { title: "Settings & Integrations", href: "/settings", category: "Navigation" },
  ];

  it("filters routes based on query case-insensitively", () => {
    const query = "domain";
    const filtered = staticNavigation.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe("Domains & SSL Health");
  });

  it("returns all routes when query is empty", () => {
    const query = "";
    const filtered = staticNavigation.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );
    expect(filtered).toHaveLength(staticNavigation.length);
  });

  it("matches multiple relevant navigation targets", () => {
    const query = "re";
    const filtered = staticNavigation.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );
    const titles = filtered.map((f) => f.title);
    expect(titles).toContain("Resources");
    expect(titles).toContain("Renewals Pipeline");
    expect(titles).toContain("Reports & Spend Analytics");
  });
});
