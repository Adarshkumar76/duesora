"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
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
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { BUY_ME_A_COFFEE_URL } from "@/lib/constants";

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const [searchQuery, setSearchQuery] = useState("");
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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
    <header className="h-16 border-b border-border/70 bg-card/60 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input Bar with functional submit */}
      <form onSubmit={handleSearchSubmit} className="relative w-64 sm:w-80 md:w-96">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search resources, domains... (press Enter)"
          className="w-full pl-9 pr-4 py-1.5 text-sm bg-background border border-border/70 rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs"
        />
      </form>

      {/* Right Header Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Buy Me a Coffee button */}
        <a
          href={BUY_ME_A_COFFEE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors shadow-2xs"
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
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border/80 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
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
                    onClick={() => setUnreadCount(0)}
                    className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <Link
                  href="/resources"
                  onClick={() => setNotificationsOpen(false)}
                  className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <p className="font-semibold text-foreground">Renewal Reminder</p>
                    <p className="text-muted-foreground text-[11px]">
                      Upcoming renewals scheduled within the next 30 days.
                    </p>
                    <span className="text-[10px] text-muted-foreground">Today</span>
                  </div>
                </Link>

                <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-muted/50 transition-colors text-left">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <p className="font-semibold text-foreground">Security Status Healthy</p>
                    <p className="text-muted-foreground text-[11px]">
                      All active resources and SSL certificates are protected.
                    </p>
                    <span className="text-[10px] text-muted-foreground">1 day ago</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-border/50 text-center">
                <Link
                  href="/resources"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  View All Resources &rarr;
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
            className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/60 cursor-pointer"
          >
            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center overflow-hidden ring-1 ring-border shadow-xs">
              {userInitials || <User className="w-4 h-4" />}
            </div>
            <span className="text-sm font-medium text-foreground">
              {userName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground transition-transform" />
          </button>

          {/* Profile & Workspace Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-card border border-border/80 rounded-2xl shadow-lg p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
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
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{currentWorkspace.name}</span>
                  </div>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>

                {workspaces
                  .filter((w) => w.id !== currentWorkspace.id)
                  .map((ws) => (
                    <div
                      key={ws.id}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-muted/60 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      <span>{ws.name}</span>
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-muted">
                        {ws.role}
                      </span>
                    </div>
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
  );
}
