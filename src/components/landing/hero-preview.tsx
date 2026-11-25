"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Globe,
  Lock,
  CreditCard,
  Server,
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
} from "lucide-react";

type CategoryFilter = "all" | "expiring" | "domain" | "subscription" | "ssl";

interface PreviewResource {
  id: string;
  name: string;
  category: "domain" | "subscription" | "ssl" | "hosting";
  provider: string;
  renewalDate: string;
  daysRemaining: number;
  cost: string;
  cycle: string;
  owner: string;
  status: "urgent" | "soon" | "healthy";
}

const PREVIEW_RESOURCES: PreviewResource[] = [
  {
    id: "1",
    name: "api.duesora.com",
    category: "ssl",
    provider: "Let's Encrypt / TLS 1.3",
    renewalDate: "In 3 days",
    daysRemaining: 3,
    cost: "$0.00",
    cycle: "quarterly",
    owner: "Sarah (DevOps)",
    status: "urgent",
  },
  {
    id: "2",
    name: "duesora.com",
    category: "domain",
    provider: "Namecheap Registrar",
    renewalDate: "In 18 days",
    daysRemaining: 18,
    cost: "$13.98",
    cycle: "yearly",
    owner: "Alex (Engineering)",
    status: "soon",
  },
  {
    id: "3",
    name: "Linear Standard",
    category: "subscription",
    provider: "Linear Technologies",
    renewalDate: "In 22 days",
    daysRemaining: 22,
    cost: "$60.00",
    cycle: "monthly",
    owner: "Marcus (Product)",
    status: "healthy",
  },
  {
    id: "4",
    name: "AWS RDS PostgreSQL",
    category: "hosting",
    provider: "Amazon Web Services",
    renewalDate: "In 29 days",
    daysRemaining: 29,
    cost: "$145.00",
    cycle: "monthly",
    owner: "DevOps Team",
    status: "healthy",
  },
  {
    id: "5",
    name: "JetBrains All Products",
    category: "subscription",
    provider: "JetBrains s.r.o.",
    renewalDate: "In 45 days",
    daysRemaining: 45,
    cost: "$289.00",
    cycle: "yearly",
    owner: "Lead Dev",
    status: "healthy",
  },
];

export function HeroPreview() {
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [simulatedAlert, setSimulatedAlert] = useState(false);

  const filteredItems = PREVIEW_RESOURCES.filter((item) => {
    if (filter === "all") return true;
    if (filter === "expiring") return item.daysRemaining <= 30;
    return item.category === filter;
  });

  const triggerAlertTest = () => {
    setSimulatedAlert(true);
    setTimeout(() => setSimulatedAlert(false), 4000);
  };

  const getCategoryIcon = (category: PreviewResource["category"]) => {
    switch (category) {
      case "domain":
        return <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case "ssl":
        return <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case "subscription":
        return <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case "hosting":
        return <Server className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
    }
  };

  return (
    <div className="w-full rounded-[8px] border border-border bg-card shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden text-left flex flex-col">
      {/* App Shell Header */}
      <div className="bg-muted/40 border-b border-border px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
          </div>
          <span className="text-muted-foreground font-mono text-[11px] ml-2">
            app.duesora.com / workspace / production
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={triggerAlertTest}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-[4px] border border-border bg-card hover:bg-muted text-[11px] font-medium text-foreground transition-colors cursor-pointer"
          >
            {simulatedAlert ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Alert Sent!</span>
              </>
            ) : (
              <>
                <Bell className="w-3 h-3 text-primary" />
                <span>Test Notification</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Simulated Live Alert Banner if triggered */}
      {simulatedAlert && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 px-4 py-2 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              <strong>Dispatch:</strong> Alert sent via Slack &amp; Email for <strong>api.duesora.com</strong> (Expires in 3 days).
            </span>
          </div>
          <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400">HTTP 200 OK</span>
        </div>
      )}

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-3 border-b border-border bg-card text-xs">
        <div className="p-3 border-r border-border">
          <span className="text-[11px] text-muted-foreground block">Upcoming (30d)</span>
          <span className="text-base font-bold text-foreground font-mono tabular-nums">4 Due</span>
        </div>
        <div className="p-3 border-r border-border">
          <span className="text-[11px] text-muted-foreground block">Monthly Recurring</span>
          <span className="text-base font-bold text-foreground font-mono tabular-nums">$205.00</span>
        </div>
        <div className="p-3">
          <span className="text-[11px] text-muted-foreground block">Overdue / Expired</span>
          <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">0 Clean</span>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="border-b border-border bg-muted/20 px-3 py-2 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
              filter === "all"
                ? "bg-card text-foreground font-semibold border border-border shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Resources ({PREVIEW_RESOURCES.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("expiring")}
            className={`px-2 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
              filter === "expiring"
                ? "bg-card text-foreground font-semibold border border-border shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Due Soon (4)
          </button>
          <button
            type="button"
            onClick={() => setFilter("domain")}
            className={`px-2 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
              filter === "domain"
                ? "bg-card text-foreground font-semibold border border-border shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Domains
          </button>
          <button
            type="button"
            onClick={() => setFilter("subscription")}
            className={`px-2 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
              filter === "subscription"
                ? "bg-card text-foreground font-semibold border border-border shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Subscriptions
          </button>
          <button
            type="button"
            onClick={() => setFilter("ssl")}
            className={`px-2 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
              filter === "ssl"
                ? "bg-card text-foreground font-semibold border border-border shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Certificates
          </button>
        </div>

        <Link
          href="/register"
          className="text-[11px] font-medium text-primary hover:underline hidden sm:inline-flex items-center gap-1 shrink-0"
        >
          <span>Open live app</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Realistic Resources Table */}
      <div className="overflow-x-auto divide-y divide-border">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="px-3.5 py-2.5 hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 text-xs"
          >
            {/* Name & Provider */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-7 h-7 rounded-[4px] bg-muted border border-border flex items-center justify-center shrink-0">
                {getCategoryIcon(item.category)}
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-foreground truncate block">
                  {item.name}
                </span>
                <span className="text-[11px] text-muted-foreground truncate block">
                  {item.provider} · {item.owner}
                </span>
              </div>
            </div>

            {/* Renewal Timing */}
            <div className="text-right shrink-0">
              <span
                className={`font-mono text-xs font-semibold tabular-nums block ${
                  item.status === "urgent"
                    ? "text-rose-600 dark:text-rose-400"
                    : item.status === "soon"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground"
                }`}
              >
                {item.renewalDate}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-mono">
                {item.daysRemaining <= 7 ? "Action Required" : "Scheduled"}
              </span>
            </div>

            {/* Cost & Cycle */}
            <div className="text-right shrink-0 min-w-[70px]">
              <span className="font-mono text-xs font-semibold text-foreground tabular-nums block">
                {item.cost}
              </span>
              <span className="text-[10px] text-muted-foreground">/{item.cycle}</span>
            </div>

            {/* Status Pill */}
            <div className="shrink-0 hidden sm:block">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-mono border ${
                  item.status === "urgent"
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60"
                    : item.status === "soon"
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60"
                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    item.status === "urgent"
                      ? "bg-rose-500"
                      : item.status === "soon"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                />
                {item.status === "urgent"
                  ? "Urgent"
                  : item.status === "soon"
                  ? "Upcoming"
                  : "Active"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer bar */}
      <div className="bg-muted/20 border-t border-border px-3.5 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Showing {filteredItems.length} active items in current workspace</span>
        <span className="font-mono text-[10px]">Deterministic renewals ledger</span>
      </div>
    </div>
  );
}
