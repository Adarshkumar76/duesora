"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Moon,
  ExternalLink,
  Loader2,
  X,
  Command,
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
          const items: SearchResourceItem[] = (json.data?.items || []).map((r: any) => ({
            id: r.id,
            name: r.name,
            type: r.type,
            provider: r.provider,
            renewalDate: r.renewalDate,
            status: r.status,
          }));
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

  // Flattened list for keyboard navigation
  type FlatItem =
    | { type: "resource"; item: SearchResourceItem }
    | { type: "nav"; item: (typeof staticNavigation)[0] }
    | { type: "action"; item: (typeof quickActions)[0] };

  const flatItems: FlatItem[] = [
    ...results.map((r) => ({ type: "resource" as const, item: r })),
    ...filteredNav.map((n) => ({ type: "nav" as const, item: n })),
    ...filteredActions.map((a) => ({ type: "action" as const, item: a })),
  ];

  const handleSelect = useCallback(
    (index: number) => {
      const selected = flatItems[index];
      if (!selected) return;

      onClose();
      if (selected.type === "resource") {
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
    [flatItems, onClose, router]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
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
        handleSelect(selectedIndex);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flatItems.length, selectedIndex, handleSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-150">
      <div
        ref={containerRef}
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border/80 gap-3">
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
              onClick={() => {
                setQuery("");
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="text-muted-foreground hover:text-foreground text-xs p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border/60">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-4 flex-1">
          {/* Resources Group */}
          {results.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Resources ({results.length})
              </div>
              {results.map((r, idx) => {
                const isSelected = selectedIndex === idx;
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
                    onClick={() => handleSelect(idx)}
                    onMouseEnter={() => setSelectedIndex(idx)}
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
                const itemIndex = results.length + idx;
                const isSelected = selectedIndex === itemIndex;
                const Icon = n.icon;

                return (
                  <button
                    key={n.href}
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
                const itemIndex = results.length + filteredNav.length + idx;
                const isSelected = selectedIndex === itemIndex;
                const Icon = a.icon;

                return (
                  <button
                    key={a.title}
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
