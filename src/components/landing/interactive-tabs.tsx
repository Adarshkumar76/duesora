"use client";

import { useState } from "react";
import { Globe, RefreshCw, Shield, Server, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CategoryData {
  id: string;
  label: string;
  icon: typeof Globe;
  description: string;
  items: Array<{
    name: string;
    provider: string;
    renewalDate: string;
    amount: string;
    cycle: string;
    status: string;
    tag: string;
  }>;
}

const CATEGORIES: CategoryData[] = [
  {
    id: "domains",
    label: "Domains",
    icon: Globe,
    description: "Track your domain portfolio across GoDaddy, Namecheap, Cloudflare, and Route 53 with automated ICANN expiry checks.",
    items: [
      {
        name: "duesora.com",
        provider: "GoDaddy",
        renewalDate: "May 20, 2026",
        amount: "$12.99",
        cycle: "yearly",
        status: "active",
        tag: "Primary Brand",
      },
      {
        name: "api.duesora.dev",
        provider: "Cloudflare",
        renewalDate: "Jun 14, 2026",
        amount: "$9.15",
        cycle: "yearly",
        status: "active",
        tag: "Production API",
      },
      {
        name: "duesora.org",
        provider: "Namecheap",
        renewalDate: "Aug 02, 2026",
        amount: "$14.48",
        cycle: "yearly",
        status: "active",
        tag: "Open Source Hub",
      },
    ],
  },
  {
    id: "subscriptions",
    label: "SaaS Subscriptions",
    icon: RefreshCw,
    description: "Centralize Google Workspace, GitHub Enterprise, Figma, and OpenAI licenses to eliminate unused team seat costs.",
    items: [
      {
        name: "Google Workspace Enterprise",
        provider: "Google Cloud",
        renewalDate: "May 24, 2026",
        amount: "$72.00",
        cycle: "monthly",
        status: "active",
        tag: "12 Seats Active",
      },
      {
        name: "GitHub Team & Actions",
        provider: "GitHub",
        renewalDate: "Jun 01, 2026",
        amount: "$44.00",
        cycle: "monthly",
        status: "active",
        tag: "CI/CD Pipeline",
      },
      {
        name: "Figma Organization Plan",
        provider: "Figma",
        renewalDate: "Jul 15, 2026",
        amount: "$90.00",
        cycle: "monthly",
        status: "active",
        tag: "Design System",
      },
    ],
  },
  {
    id: "cloud",
    label: "Cloud & Hosting",
    icon: Server,
    description: "Monitor AWS EC2, DigitalOcean droplets, Vercel Pro, and VPS servers with accurate monthly billing forecasts.",
    items: [
      {
        name: "AWS US-East Production RDS",
        provider: "Amazon Web Services",
        renewalDate: "Jun 01, 2026",
        amount: "$114.50",
        cycle: "monthly",
        status: "active",
        tag: "PostgreSQL 16 Multi-AZ",
      },
      {
        name: "DigitalOcean Kubernetes Worker",
        provider: "DigitalOcean",
        renewalDate: "Jun 10, 2026",
        amount: "$48.00",
        cycle: "monthly",
        status: "active",
        tag: "Compute Cluster",
      },
      {
        name: "Vercel Pro Enterprise Edge",
        provider: "Vercel",
        renewalDate: "Jul 01, 2026",
        amount: "$20.00",
        cycle: "monthly",
        status: "active",
        tag: "Frontend Hosting",
      },
    ],
  },
  {
    id: "ssl",
    label: "SSL & Security",
    icon: Shield,
    description: "Prevent sudden HTTPS browser warnings with multi-stage certificate renewal alerts (30 days, 7 days, 24 hours).",
    items: [
      {
        name: "*.duesora.com Wildcard SSL",
        provider: "Let's Encrypt / Certbot",
        renewalDate: "Jun 16, 2026",
        amount: "Free",
        cycle: "quarterly",
        status: "active",
        tag: "Auto-renewed via ACME",
      },
      {
        name: "Payment Gateway EV Cert",
        provider: "DigiCert",
        renewalDate: "Dec 10, 2026",
        amount: "$199.00",
        cycle: "yearly",
        status: "active",
        tag: "Extended Validation",
      },
      {
        name: "Cloudflare Origin CA Certificate",
        provider: "Cloudflare",
        renewalDate: "Sep 22, 2030",
        amount: "Free",
        cycle: "lifetime",
        status: "active",
        tag: "Edge Protection",
      },
    ],
  },
];

export function InteractiveTabs() {
  const [activeTab, setActiveTab] = useState("domains");
  const currentCategory = CATEGORIES.find((c) => c.id === activeTab) || CATEGORIES[0];

  return (
    <div className="space-y-8">
      {/* Category Pills Header */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = cat.id === activeTab;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-102"
                  : "bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Description */}
      <p className="text-center text-sm text-muted-foreground max-w-xl mx-auto">
        {currentCategory.description}
      </p>

      {/* Items Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {currentCategory.items.map((item) => (
          <div
            key={item.name}
            className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-xs space-y-4 hover:border-emerald-500/40 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {item.tag}
                </span>
                <h4 className="text-base font-bold text-foreground truncate">
                  {item.name}
                </h4>
                <p className="text-xs text-muted-foreground">{item.provider}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                Active
              </span>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground block">Next Renewal</span>
                <span className="text-xs font-semibold text-foreground">
                  {item.renewalDate}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground block capitalize">{item.cycle}</span>
                <span className="text-sm font-extrabold text-foreground">
                  {item.amount}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom link to Add Resource */}
      <div className="text-center pt-2">
        <Link href="/register">
          <Button
            variant="outline"
            className="rounded-2xl border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Track your custom assets in Duesora</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
