"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import {
  LayoutGrid,
  Folder,
  Globe,
  CreditCard,
  RefreshCw,
  Calendar,
  FileText,
  Bell,
  Settings,
  GitFork,
  BookOpen,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useTranslation } from "@/components/i18n/i18n-provider";

// Shared reactive module store for sidebar collapsed state across page transitions
let globalCollapsed: boolean | null = null;
const listeners = new Set<() => void>();

function getSidebarCollapsedSnapshot(): boolean {
  if (globalCollapsed !== null) {
    return globalCollapsed;
  }
  if (typeof window !== "undefined") {
    try {
      globalCollapsed = localStorage.getItem("duesora_sidebar_collapsed") === "true";
      return globalCollapsed;
    } catch {
      // LocalStorage access fallback
    }
  }
  return false;
}

function getServerSidebarSnapshot(): boolean {
  return false;
}

function subscribeSidebar(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function setSidebarCollapsed(collapsed: boolean) {
  globalCollapsed = collapsed;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("duesora_sidebar_collapsed", String(collapsed));
    } catch {
      // LocalStorage access fallback
    }
  }
  listeners.forEach((l) => l());
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Resources", href: "/resources", icon: Folder },
  { label: "Domains", href: "/domains", icon: Globe },
  { label: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { label: "Renewals", href: "/renewals", icon: RefreshCw },
  { label: "Dependencies", href: "/dependencies", icon: GitFork },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const NAV_ITEM_I18N_KEYS: Record<string, string> = {
  "/dashboard": "nav.dashboard",
  "/resources": "nav.resources",
  "/domains": "nav.domains",
  "/subscriptions": "nav.subscriptions",
  "/renewals": "nav.renewals",
  "/dependencies": "nav.dependencies",
  "/calendar": "nav.calendar",
  "/reports": "nav.reports",
  "/notifications": "nav.notifications",
  "/settings": "nav.settings",
};

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const isCollapsed = useSyncExternalStore(
    subscribeSidebar,
    getSidebarCollapsedSnapshot,
    getServerSidebarSnapshot
  );

  const toggleCollapse = () => {
    setSidebarCollapsed(!isCollapsed);
  };

  return (
    <aside
      className={`hidden lg:flex ${
        isCollapsed ? "w-18" : "w-64"
      } border-r border-border/70 bg-card/60 backdrop-blur-sm flex-col shrink-0 sticky top-0 h-screen overflow-y-auto z-20 transition-[width] duration-200 ease-in-out select-none`}
    >
      {/* Brand Header */}
      <div
        className={`h-16 ${
          isCollapsed ? "px-2 justify-center" : "px-6 justify-start"
        } flex items-center border-b border-border/40 shrink-0`}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5"
          title={isCollapsed ? "Duesora" : undefined}
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Logo size={18} color="#FFFFFF" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg tracking-tight text-foreground truncate">
              Duesora
            </span>
          )}
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className={`flex-1 ${isCollapsed ? "px-2" : "px-3"} py-4 space-y-1 overflow-y-auto`}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const label = NAV_ITEM_I18N_KEYS[item.href]
            ? t(NAV_ITEM_I18N_KEYS[item.href])
            : item.label;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? label : undefined}
              className={`flex items-center ${
                isCollapsed ? "justify-center px-2 py-2.5" : "px-3.5 py-2.5 gap-3"
              } rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-emerald-50 text-emerald-800 font-semibold shadow-xs dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"
                }`}
              />
              {!isCollapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions: Documentation & Collapse Toggle */}
      <div className={`mt-auto p-2.5 border-t border-border/40 space-y-1 shrink-0 ${isCollapsed ? "px-2" : "px-3"}`}>
        {/* Docs Button */}
        <Link
          href="/api/docs"
          target="_blank"
          title="API Documentation"
          className={`flex items-center ${
            isCollapsed ? "justify-center px-2" : "gap-3 px-3.5"
          } py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors`}
        >
          <BookOpen className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          {!isCollapsed && (
            <>
              <span className="truncate">API Docs</span>
              <ExternalLink className="w-3 h-3 ml-auto opacity-60 text-muted-foreground" />
            </>
          )}
        </Link>

        {/* Collapse Sidebar Button */}
        <button
          type="button"
          onClick={toggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`w-full flex items-center ${
            isCollapsed ? "justify-center px-2" : "gap-3 px-3.5"
          } py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer`}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span className="truncate">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
