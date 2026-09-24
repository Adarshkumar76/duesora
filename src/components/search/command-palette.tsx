"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Globe,
  CreditCard,
  Shield,
  Server,
  Cloud,
  FileText,
  Settings,
  Calendar,
  BarChart3,
  Bell,
  Plus,
  ArrowRight,
  Sun,
  Loader2,
  X,
} from "lucide-react";

interface SearchResourceItem {
  id: string;
  name: string;
  type: string;
  provider: string | null;
  renewalDate: string | null;
  status: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function CommandPalette({ isOpen, onClose, workspaceId }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Quick navigation pages
  const staticNavigation = [
    { title: "Dashboard", href: "/dashboard", icon: BarChart3, category: "Navigation" },
    { title: "Resources", href: "/resources", icon: FileText, category: "Navigation" },
    { title: "Domains & SSL Health", href: "/domains", icon: Globe, category: "Navigation" },
    { title: "Subscriptions", href: "/subscriptions", icon: CreditCard, category: "Navigation" },
    { title: "Renewals Pipeline", href: "/renewals", icon: Calendar, category: "Navigation" },
    { title: "Reports & Spend Analytics", href: "/reports", icon: BarChart3, category: "Navigation" },
    { title: "Notifications", href: "/notifications", icon: Bell, category: "Navigation" },
    { title: "Settings & Integrations", href: "/settings", icon: Settings, category: "Navigation" },
  ];

  const quickActions = [
    { title: "Add New Resource", href: "/resources/new", icon: Plus, category: "Actions" },
    {
      title: "Toggle Theme (Light / Dark)",
      action: () => {
        const isDark = document.documentElement.classList.contains("dark");
        if (isDark) {
          document.documentElement.classList.remove("dark");
          localStorage.setItem("theme", "light");
        } else {
          document.documentElement.classList.add("dark");
          localStorage.setItem("theme", "dark");
        }
        window.dispatchEvent(new Event("storage"));
      },
      icon: Sun,
      category: "Actions",
    },
  ];

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Search resources via API
  useEffect(() => {
    if (!isOpen || !workspaceId) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/workspaces/${workspaceId}/resources?search=${encodeURIComponent(trimmed)}&pageSize=6`
        );
        if (res.ok) {
          const json = await res.json();
          const items: SearchResourceItem[] = (json.data?.items || []).map(
            (r: {
              id: string;
              name: string;
              type: string;
              provider?: string | null;
              renewalDate?: string | null;
              status: string;
            }) => ({
              id: r.id,
              name: r.name,
              type: r.type,
              provider: r.provider || null,
              renewalDate: r.renewalDate || null,
              status: r.status,
            })
          );
          setResults(items);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, isOpen, workspaceId]);

  // Combined matched items
  const filteredNav = query.trim()
    ? staticNavigation.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase())
      )
    : staticNavigation;

  const filteredActions = query.trim()
    ? quickActions.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase())
      )
    : quickActions;

  // Search-all item when user types a query
  const searchAllItem = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return null;
    return {
      type: "search-all" as const,
      item: {
        title: `Search all resources for "${trimmed}"`,
        query: trimmed,
      },
    };
  }, [query]);

  // Flattened list for keyboard navigation
  type FlatItem =
    | { type: "search-all"; item: { title: string; query: string } }
    | { type: "resource"; item: SearchResourceItem }
    | { type: "nav"; item: (typeof staticNavigation)[0] }
    | { type: "action"; item: (typeof quickActions)[0] };

  const flatItems: FlatItem[] = useMemo(
    () => [
      ...(searchAllItem ? [searchAllItem] : []),
      ...results.map((r) => ({ type: "resource" as const, item: r })),
      ...filteredNav.map((n) => ({ type: "nav" as const, item: n })),
      ...filteredActions.map((a) => ({ type: "action" as const, item: a })),
    ],
    [searchAllItem, results, filteredNav, filteredActions]
  );

  const handleSelect = useCallback(
    (index: number) => {
      const selected = flatItems[index];
      if (!selected) {
        if (query.trim()) {
          onClose();
          router.push(`/resources?search=${encodeURIComponent(query.trim())}`);
        }
        return;
      }

      onClose();
      if (selected.type === "search-all") {
        router.push(`/resources?search=${encodeURIComponent(selected.item.query)}`);
      } else if (selected.type === "resource") {
        router.push(`/resources/${selected.item.id}`);
      } else if (selected.type === "nav") {
        router.push(selected.item.href);
      } else if (selected.type === "action") {
        if ("action" in selected.item && selected.item.action) {
          selected.item.action();
        } else if ("href" in selected.item && selected.item.href) {
          router.push(selected.item.href);
        }
      }
    },
    [flatItems, onClose, query, router]
  );

  // Scroll active item into view
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Esc") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (flatItems.length ? (prev + 1) % flatItems.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          flatItems.length ? (prev - 1 + flatItems.length) % flatItems.length : 0
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatItems.length > 0 && selectedIndex >= 0 && selectedIndex < flatItems.length) {
          handleSelect(selectedIndex);
        } else if (query.trim()) {
          onClose();
          router.push(`/resources?search=${encodeURIComponent(query.trim())}`);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flatItems.length, selectedIndex, handleSelect, onClose, query, router]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-150"
    >
      <div
        ref={containerRef}
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
      >
        {/* Search Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (flatItems.length > 0 && selectedIndex >= 0 && selectedIndex < flatItems.length) {
              handleSelect(selectedIndex);
            } else if (query.trim()) {
              onClose();
              router.push(`/resources?search=${encodeURIComponent(query.trim())}`);
            }
          }}
          className="flex items-center px-4 py-3.5 border-b border-border/80 gap-3"
        >
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search domains, subscriptions, settings..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm sm:text-base focus:outline-hidden"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
          {query && !loading && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              title="Clear search query"
              className="text-muted-foreground hover:text-foreground text-xs p-1 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Enter Button to trigger search/selection */}
          <button
            type="submit"
            title="Press Enter to select"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-md border border-emerald-500/30 transition-colors cursor-pointer"
          >
            <span>Enter</span>
            <span className="text-[12px] leading-none">↵</span>
          </button>

          {/* Close button with ESC */}
          <button
            type="button"
            onClick={onClose}
            title="Close search (Esc)"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 px-2 py-1 rounded-md border border-border/60 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 sm:hidden" />
            <span className="hidden sm:inline">ESC</span>
          </button>
        </form>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-4 flex-1">
          {/* Search Everywhere / All Resources Quick Hit */}
          {searchAllItem && (
            <div className="space-y-1">
              <button
                ref={(el) => {
                  itemRefs.current[0] = el;
                }}
                type="button"
                onClick={() => handleSelect(0)}
                onMouseEnter={() => setSelectedIndex(0)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm transition-colors cursor-pointer ${
                  selectedIndex === 0
                    ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-medium"
                    : "hover:bg-muted/60 text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Search className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-foreground">
                      Search all resources for &ldquo;{searchAllItem.item.query}&rdquo;
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60">
                    ↵
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </button>
            </div>
          )}

          {/* Resources Group */}
          {results.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Resources ({results.length})
              </div>
              {results.map((r, idx) => {
                const itemIndex = (searchAllItem ? 1 : 0) + idx;
                const isSelected = selectedIndex === itemIndex;
                const typeIcon =
                  r.type === "domain"
                    ? Globe
                    : r.type === "subscription"
                    ? CreditCard
                    : r.type === "ssl_certificate"
                    ? Shield
                    : r.type === "hosting"
                    ? Server
                    : r.type === "cloud_service"
                    ? Cloud
                    : FileText;
                const Icon = typeIcon;

                return (
                  <button
                    key={r.id}
                    ref={(el) => {
                      itemRefs.current[itemIndex] = el;
                    }}
                    type="button"
                    onClick={() => handleSelect(itemIndex)}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-medium"
                        : "hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-muted text-muted-foreground shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-foreground">{r.name}</span>
                        {r.provider && (
                          <span className="text-xs text-muted-foreground ml-2">via {r.provider}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {r.type.replace("_", " ")}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Navigation Group */}
          {filteredNav.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Navigation
              </div>
              {filteredNav.map((n, idx) => {
                const itemIndex = (searchAllItem ? 1 : 0) + results.length + idx;
                const isSelected = selectedIndex === itemIndex;
                const Icon = n.icon;

                return (
                  <button
                    key={n.href}
                    ref={(el) => {
                      itemRefs.current[itemIndex] = el;
                    }}
                    type="button"
                    onClick={() => handleSelect(itemIndex)}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-medium"
                        : "hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-muted text-muted-foreground shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{n.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Go to page</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Actions Group */}
          {filteredActions.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Quick Actions
              </div>
              {filteredActions.map((a, idx) => {
                const itemIndex =
                  (searchAllItem ? 1 : 0) + results.length + filteredNav.length + idx;
                const isSelected = selectedIndex === itemIndex;
                const Icon = a.icon;

                return (
                  <button
                    key={a.title}
                    ref={(el) => {
                      itemRefs.current[itemIndex] = el;
                    }}
                    type="button"
                    onClick={() => handleSelect(itemIndex)}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-medium"
                        : "hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{a.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Action</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {flatItems.length === 0 && !loading && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No matching assets, routes, or commands found for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-muted/30 border-t border-border/80 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-semibold bg-muted px-1.5 py-0.5 rounded border border-border/60">↑</kbd>{" "}
              <kbd className="font-semibold bg-muted px-1.5 py-0.5 rounded border border-border/60">↓</kbd> navigate
            </span>
            <span>
              <kbd className="font-semibold bg-muted px-1.5 py-0.5 rounded border border-border/60">↵</kbd> select
            </span>
          </div>
          <span>Duesora Command</span>
        </div>
      </div>
    </div>
  );
}
