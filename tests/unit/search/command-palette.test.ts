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

  it("creates a Search All item when search query is typed", () => {
    const query = "google.com";
    const searchAllItem = query.trim()
      ? {
          title: `Search all resources for "${query.trim()}"`,
          query: query.trim(),
        }
      : null;

    expect(searchAllItem).not.toBeNull();
    expect(searchAllItem?.title).toBe('Search all resources for "google.com"');
    expect(searchAllItem?.query).toBe("google.com");
  });

  it("recognizes keyboard triggers for Win+K, Cmd+K, and Ctrl+K", () => {
    function isSearchShortcut(e: { metaKey: boolean; ctrlKey: boolean; key?: string; code?: string }) {
      const isK = e.key?.toLowerCase() === "k" || e.code === "KeyK";
      return (e.metaKey || e.ctrlKey) && isK;
    }

    // Windows Key + K (MetaKey on Windows)
    expect(isSearchShortcut({ metaKey: true, ctrlKey: false, key: "k" })).toBe(true);
    expect(isSearchShortcut({ metaKey: true, ctrlKey: false, code: "KeyK" })).toBe(true);

    // Ctrl + K
    expect(isSearchShortcut({ metaKey: false, ctrlKey: true, key: "K" })).toBe(true);

    // Regular typing of 'k' should NOT trigger
    expect(isSearchShortcut({ metaKey: false, ctrlKey: false, key: "k" })).toBe(false);
  });

  it("recognizes escape key to close search modal", () => {
    function isEscapeKey(e: { key: string }) {
      return e.key === "Escape" || e.key === "Esc";
    }

    expect(isEscapeKey({ key: "Escape" })).toBe(true);
    expect(isEscapeKey({ key: "Esc" })).toBe(true);
    expect(isEscapeKey({ key: "Enter" })).toBe(false);
  });
});
