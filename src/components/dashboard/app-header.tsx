"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Bell, ChevronDown, LogOut, Check, Building2, User } from "lucide-react";

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

export function AppHeader({
  user,
  currentWorkspace,
  workspaces = [],
  onSignOut,
}: AppHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userName = user.name || "Adarsh Kumar";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 border-b border-border/70 bg-card/60 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input Bar matching mockup */}
      <div className="relative w-72 sm:w-96">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search resources, domains..."
          className="w-full pl-9 pr-4 py-1.5 text-sm bg-background border border-border/70 rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs"
        />
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="w-9 h-9 rounded-xl border border-border/70 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shadow-2xs"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* User Profile Dropdown Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/60"
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

                {workspaces.filter((w) => w.id !== currentWorkspace.id).map((ws) => (
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
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
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
