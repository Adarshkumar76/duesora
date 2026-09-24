"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Check,
  Building2,
  User,
  Sun,
  Moon,
  Coffee,
  CheckCheck,
  AlertTriangle,
  Clock,
  Info,
  Menu,
  X,
  Loader2,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { NAV_ITEMS } from "./app-sidebar";
import { BUY_ME_A_COFFEE_URL } from "@/lib/constants";
import { CommandPalette } from "@/components/search/command-palette";

interface WorkspaceItem {
  id: string;
  name: string;
  role: string;
}

interface AppHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
  currentWorkspace: {
    id: string;
    name: string;
  };
  workspaces?: WorkspaceItem[];
  onSignOut: () => Promise<void>;
}

function subscribeTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getThemeSnapshot(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ||
    localStorage.getItem("theme") === "dark"
    ? "dark"
    : "light";
}

function getServerThemeSnapshot(): "light" | "dark" {
  return "light";
}

export function AppHeader({
  user,
  currentWorkspace,
  workspaces = [],
  onSignOut,
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsList, setNotificationsList] = useState<Array<{
    id: string;
    resourceId?: string | null;
    title: string;
    message: string;
    type: string;
    severity: string;
    status: string;
    createdAt: string;
  }>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [switchingWorkspace, setSwitchingWorkspace] = useState<string | null>(null);
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Close mobile drawer when route changes without cascading effect renders
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  // Fetch real notifications for the active workspace
  useEffect(() => {
    if (!currentWorkspace?.id) return;
    let isMounted = true;

    fetch(`/api/workspaces/${currentWorkspace.id}/notifications?pageSize=5`)
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        if (json.data && Array.isArray(json.data)) {
          setNotificationsList(json.data);
          setUnreadCount(json.meta?.unreadCount ?? 0);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [currentWorkspace?.id]);

  const handleMarkAllRead = async () => {
    if (!currentWorkspace?.id) return;
    try {
      await fetch(`/api/workspaces/${currentWorkspace.id}/notifications`, {
        method: "PATCH",
      });
      setUnreadCount(0);
      setNotificationsList((prev) =>
        prev.map((n) => ({ ...n, status: "read" }))
      );
    } catch {}
  };

  // Synchronize dark class on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (storedTheme === "dark" || (!storedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.dispatchEvent(new Event("storage"));
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    window.dispatchEvent(new Event("storage"));
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/resources?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/resources");
    }
  };

  const userName = user.name || "Adarsh Kumar";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="h-16 border-b border-border/70 bg-card/60 backdrop-blur-sm px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Left items: Mobile Hamburger + Logo + Search */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1 mr-2">
          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open mobile navigation"
            className="lg:hidden w-9 h-9 shrink-0 rounded-xl border border-border/70 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shadow-2xs cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Brand Logo (< lg viewports) */}
          <Link href="/dashboard" className="lg:hidden shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Logo size={18} color="#FFFFFF" />
            </div>
          </Link>

          {/* Search / Command Palette Trigger */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="relative flex items-center justify-between w-full max-w-[170px] sm:max-w-xs md:max-w-sm pl-8 sm:pl-9 pr-2.5 py-1.5 text-xs sm:text-sm bg-background border border-border/70 rounded-xl text-muted-foreground hover:text-foreground hover:border-emerald-500/40 transition-all shadow-2xs cursor-pointer text-left"
          >
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <span className="truncate">Search or jump to...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60">
              <span className="text-[9px]">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 shrink-0">
          {/* Buy Me a Coffee button */}
          <a
            href={BUY_ME_A_COFFEE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors shadow-2xs"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Buy Me a Coffee</span>
          </a>

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="w-9 h-9 rounded-xl border border-border/70 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shadow-2xs cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 animate-in spin-in-90 duration-200" />
            )}
          </button>

          {/* Notification Bell with Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              aria-label="Notifications"
              className="w-9 h-9 rounded-xl border border-border/70 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shadow-2xs relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-background">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:max-w-sm sm:w-80 bg-card border border-border/80 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-foreground">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {notificationsList.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    <p>No notifications yet.</p>
                    <p className="text-[11px] opacity-75 mt-0.5">You are completely up to date!</p>
                  </div>
                ) : (
                  notificationsList.map((notif) => {
                    const isUnread = notif.status === "unread";
                    const targetHref = notif.resourceId
                      ? `/resources/${notif.resourceId}`
                      : "/notifications";

                    return (
                      <Link
                        key={notif.id}
                        href={targetHref}
                        onClick={() => setNotificationsOpen(false)}
                        className={`flex items-start gap-2.5 p-2 rounded-xl transition-colors text-left ${
                          isUnread
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            notif.severity === "critical"
                              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
                              : notif.severity === "warning"
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400"
                              : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {notif.severity === "critical" ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : notif.severity === "warning" ? (
                            <Clock className="w-3.5 h-3.5" />
                          ) : (
                            <Info className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="space-y-0.5 text-xs flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-semibold text-foreground truncate">{notif.title}</p>
                            {isUnread && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-muted-foreground text-[11px] line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>

              <div className="pt-2 mt-2 border-t border-border/50 text-center">
                <Link
                  href="/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  View All Notifications &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 pl-1 pr-1.5 sm:pl-1.5 sm:pr-2 py-1 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/60 cursor-pointer"
          >
            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center overflow-hidden ring-1 ring-border shadow-xs shrink-0">
              {userInitials || <User className="w-4 h-4" />}
            </div>
            <span className="hidden sm:inline text-sm font-medium text-foreground">
              {userName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground transition-transform" />
          </button>

          {/* Profile & Workspace Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-64 bg-card border border-border/80 rounded-2xl shadow-lg p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
              {/* User Details */}
              <div className="px-3 py-2 border-b border-border/50">
                <p className="text-sm font-semibold text-foreground">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>

              {/* Workspaces Section */}
              <div className="py-2 border-b border-border/50">
                <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Active Workspace
                </p>
                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 text-xs font-medium">
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{currentWorkspace.name}</span>
                  </div>
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </div>

                {workspaces
                  .filter((w) => w.id !== currentWorkspace.id)
                  .map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      disabled={switchingWorkspace !== null}
                      onClick={async () => {
                        try {
                          setSwitchingWorkspace(ws.id);
                          const res = await fetch("/api/workspaces/switch", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ workspaceId: ws.id }),
                          });
                          if (res.ok) {
                            setDropdownOpen(false);
                            window.location.reload();
                          }
                        } catch (err) {
                          console.error("Failed switching workspace:", err);
                        } finally {
                          setSwitchingWorkspace(null);
                        }
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-muted/60 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors text-left disabled:opacity-50"
                    >
                      <span className="truncate">{ws.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {switchingWorkspace === ws.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        ) : (
                          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-muted">
                            {ws.role}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
              </div>

              {/* Sign Out Action */}
              <div className="pt-1">
                <form action={onSignOut}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Mobile Navigation Drawer Backdrop & Sheet */}
    {mobileMenuOpen && (
      <div className="fixed inset-0 z-50 lg:hidden">
        {/* Backdrop overlay */}
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />

        {/* Slide-over panel */}
        <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-card border-r border-border shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
          {/* Drawer Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-border/60">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                <Logo size={18} color="#FFFFFF" />
              </div>
              <span className="font-bold text-lg tracking-tight text-foreground">
                Duesora
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close mobile navigation"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Drawer Footer */}
          <div className="p-4 border-t border-border/60 space-y-3 bg-muted/20">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium truncate max-w-[150px]">{currentWorkspace.name}</span>
              <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] uppercase font-semibold">
                Active
              </span>
            </div>
            <a
              href={BUY_ME_A_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition-colors shadow-2xs"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Buy Me a Coffee</span>
            </a>
          </div>
        </aside>
      </div>
    )}

    {/* Global Command Palette */}
    <CommandPalette
      isOpen={commandPaletteOpen}
      onClose={() => setCommandPaletteOpen(false)}
      workspaceId={currentWorkspace.id}
    />
  </>
  );
}
