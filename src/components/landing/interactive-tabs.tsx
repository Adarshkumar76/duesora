"use client";

import { useState } from "react";
import { Globe, RefreshCw, Shield, Server, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/i18n/i18n-provider";

interface CategoryData {
  id: string;
  labelKey: string;
  fallbackLabel: string;
  icon: typeof Globe;
  descriptionKey: string;
  fallbackDescription: string;
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
    labelKey: "landing.tabDomains",
    fallbackLabel: "Domains",
    icon: Globe,
    descriptionKey: "landing.tabDomainsDesc",
    fallbackDescription: "Track your domain portfolio across GoDaddy, Namecheap, Cloudflare, and Route 53 with automated ICANN expiry checks.",
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
    labelKey: "landing.tabSubscriptions",
    fallbackLabel: "SaaS Subscriptions",
    icon: RefreshCw,
    descriptionKey: "landing.tabSubscriptionsDesc",
    fallbackDescription: "Centralize Google Workspace, GitHub Enterprise, Figma, and OpenAI licenses to eliminate unused team seat costs.",
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
    labelKey: "landing.tabCloud",
    fallbackLabel: "Cloud & Hosting",
    icon: Server,
    descriptionKey: "landing.tabCloudDesc",
    fallbackDescription: "Monitor AWS EC2, DigitalOcean droplets, Vercel Pro, and VPS servers with accurate monthly billing forecasts.",
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
    labelKey: "landing.tabSsl",
    fallbackLabel: "SSL & Security",
    icon: Shield,
    descriptionKey: "landing.tabSslDesc",
    fallbackDescription: "Prevent sudden HTTPS browser warnings with multi-stage certificate renewal alerts (30 days, 7 days, 24 hours).",
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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("domains");
  const currentCategory = CATEGORIES.find((c) => c.id === activeTab) || CATEGORIES[0];

  return (
    <div className="space-y-6 text-left">
      {/* Category Segmented Bar & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div className="inline-flex items-center gap-1 bg-muted/60 p-1 rounded-[6px] border border-border max-w-fit flex-wrap">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = cat.id === activeTab;
            const label = t(cat.labelKey) || cat.fallbackLabel;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? "bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-primary" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground max-w-md">
          {t(currentCategory.descriptionKey) || currentCategory.fallbackDescription}
        </p>
      </div>

      {/* Items Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {currentCategory.items.map((item) => (
          <div
            key={item.name}
            className="rounded-[8px] border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3.5 hover:border-border/90 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <span className="inline-block text-[10px] uppercase font-mono font-medium tracking-wider px-1.5 py-0.5 rounded-[4px] bg-muted text-muted-foreground border border-border">
                  {item.tag}
                </span>
                <h4 className="text-sm font-semibold text-foreground truncate">
                  {item.name}
                </h4>
                <p className="text-xs text-muted-foreground">{item.provider}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary shrink-0">
                <Check className="w-3 h-3" />
                <span>{t("common.active")}</span>
              </span>
            </div>

            <div className="pt-2.5 border-t border-border/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                  {t("landing.nextRenewal")}
                </span>
                <span className="text-xs font-mono tabular-nums font-semibold text-foreground">
                  {item.renewalDate}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase font-mono block capitalize">
                  {item.cycle}
                </span>
                <span className="text-sm font-bold font-mono tabular-nums text-foreground">
                  {item.amount}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action link */}
      <div className="pt-1">
        <Link href="/register">
          <Button
            variant="outline"
            className="h-8 rounded-[6px] text-xs font-semibold gap-1.5 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <span>{t("landing.trackCustomAssets")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
