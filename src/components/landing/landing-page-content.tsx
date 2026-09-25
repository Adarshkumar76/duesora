"use client";

import { useState } from "react";
import Link from "next/link";
import { LandingHero } from "@/components/landing/landing-hero";
import { InteractiveTabs } from "@/components/landing/interactive-tabs";
import { DockerCopy } from "@/components/landing/docker-copy";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Coins,
  ShieldCheck,
  Building2,
  Coffee,
  CheckCircle2,
  Sparkles,
  Lock,
  Zap,
  Heart,
  BookOpen,
  Sliders,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Check,
  Server,
  Terminal,
} from "lucide-react";
import { BUY_ME_A_COFFEE_URL, GITHUB_REPO_URL } from "@/lib/constants";
import { Logo } from "@/components/logo";
import { useTranslation } from "@/components/i18n/i18n-provider";

interface LandingPageContentProps {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

export function LandingPageContent({ user }: LandingPageContentProps) {
  const { t } = useTranslation();

  // Ramp-style interactive seat calculator
  const [teamSize, setTeamSize] = useState<number>(20);
  const estimatedSavings = Math.round(teamSize * 185); // ~$185/year average waste per seat in SaaS

  // Ramp-style decision filter
  const [decisionFilter, setDecisionFilter] = useState<"all" | "keep" | "review" | "cancel">("all");

  const sampleContracts = [
    {
      name: "Figma Organization Plan",
      category: "Design",
      cost: "$90.00/mo",
      seats: "18 / 24 active",
      decision: "review",
      savings: "Save $360/yr",
      badge: "6 Idle Seats",
      action: "Trim Seats",
    },
    {
      name: "Datadog APM Staging Cluster",
      category: "Monitoring",
      cost: "$240.00/mo",
      seats: "Legacy environment",
      decision: "cancel",
      savings: "Save $2,880/yr",
      badge: "Zero Traffic in 45d",
      action: "Decommission",
    },
    {
      name: "Google Workspace Enterprise",
      category: "Productivity",
      cost: "$72.00/mo",
      seats: "12 / 12 active",
      decision: "keep",
      savings: "Fully Utilized",
      badge: "Essential",
      action: "Auto-renew",
    },
    {
      name: "AWS US-East Production RDS",
      category: "Infrastructure",
      cost: "$114.50/mo",
      seats: "PostgreSQL 16 Multi-AZ",
      decision: "keep",
      savings: "Reserved Instance",
      badge: "Production Core",
      action: "Auto-renew",
    },
  ];

  const filteredContracts =
    decisionFilter === "all"
      ? sampleContracts
      : sampleContracts.filter((c) => c.decision === decisionFilter);

  return (
    <>
      <main className="flex-1">
        {/* ================= HERO SECTION (with Supabase-Style Living Demo) ================= */}
        <LandingHero user={user} />

        {/* ================= TECH STACK RIBBON ================= */}
        <section className="border-y border-border/60 bg-muted/20 py-8 px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground text-center md:text-left">
              {t("landing.techStackTitle")}
            </p>
            <div className="flex items-center gap-6 sm:gap-8 flex-wrap justify-center text-xs font-bold text-foreground/80">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Next.js 15
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> PostgreSQL 16
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Redis Cache
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500" /> Docker Ready
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" /> TailwindCSS v4
              </span>
            </div>
          </div>
        </section>

        {/* ================= RAMP-STYLE FINANCIAL & ASSET TELEMETRY ================= */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Ramp-Style Financial Telemetry
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Eliminate zombie SaaS and rogue renewals
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Modern companies lose thousands annually to unattended trials and forgotten seat licenses. Duesora enforces structured decision workflows.
            </p>
          </div>

          {/* Interactive Ramp Matrix & Calculator Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: Interactive Decision Matrix (Col 7) */}
            <div className="lg:col-span-7 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground">The Renewal Decision Engine</h3>
                  <p className="text-xs text-muted-foreground">
                    Classify contracts ahead of billing: Keep, Renegotiate Seats, or Cancel.
                  </p>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 text-xs">
                  {(["all", "keep", "review", "cancel"] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setDecisionFilter(filter)}
                      className={`px-2.5 py-1 rounded-lg font-semibold uppercase text-[10px] tracking-wider transition-all cursor-pointer ${
                        decisionFilter === filter
                          ? "bg-card text-foreground shadow-2xs font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contracts List */}
              <div className="space-y-2.5">
                {filteredContracts.map((contract) => (
                  <div
                    key={contract.name}
                    className="p-3.5 rounded-2xl border border-border/70 bg-background/50 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{contract.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            contract.decision === "cancel"
                              ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300/40"
                              : contract.decision === "review"
                              ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300/40"
                              : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40"
                          }`}
                        >
                          {contract.badge}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {contract.category} • {contract.seats}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <span className="text-xs font-bold text-foreground block">{contract.cost}</span>
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {contract.savings}
                        </span>
                      </div>

                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-muted/80 border border-border/60 text-foreground">
                        {contract.action}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Interactive Seat Waste Calculator (Col 5) */}
            <div className="lg:col-span-5 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Interactive Waste Calculator</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Drag the slider to match your team headcount and see how much annual subscription waste Duesora prevents.
                </p>
              </div>

              {/* Slider Controller */}
              <div className="space-y-4 p-5 rounded-2xl border border-border/60 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Team Headcount</span>
                  <span className="text-sm font-black text-foreground font-mono bg-card px-2.5 py-1 rounded-lg border border-border/60">
                    {teamSize} Members
                  </span>
                </div>

                <input
                  type="range"
                  min="5"
                  max="150"
                  step="5"
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />

                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>5 members (Seed)</span>
                  <span>75 members</span>
                  <span>150+ members (Scale)</span>
                </div>
              </div>

              {/* Result Card */}
              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-1 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Estimated Annual Capital Saved
                </span>
                <p className="text-3xl font-black text-emerald-800 dark:text-emerald-300 font-mono">
                  ${estimatedSavings.toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground ml-1">/ year</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Based on 1.8 average unused licenses per 10 employees across SaaS seats.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FEATURES BENTO GRID (Supabase Style) ================= */}
        <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {t("landing.featuresTag")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {t("landing.featuresTitle")}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t("landing.featuresSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Bento Card 1: Multi-Stage Escalation Ladder (Col 7) */}
            <div className="md:col-span-7 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6 hover:border-emerald-500/40 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shadow-xs">
                  <Bell className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {t("landing.bento1Title")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("landing.bento1Desc")}
                </p>
              </div>

              {/* Visual Card simulation */}
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    duesora.com (GoDaddy Domain)
                  </span>
                  <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full text-[10px]">
                    {t("landing.bento1Badge")}
                  </span>
                </div>
                <div className="w-full bg-border/60 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full w-4/5" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t("landing.bento1Note")}
                </p>
              </div>
            </div>

            {/* Bento Card 2: Multi-Currency Minor-Integer Math (Col 5) */}
            <div className="md:col-span-5 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6 hover:border-emerald-500/40 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  <Coins className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {t("landing.bento2Title")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("landing.bento2Desc")}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/30 p-4 space-y-2">
                <div className="flex justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  <span>{t("landing.bento2Tag")}</span>
                  <span>{t("landing.bento2Accuracy")}</span>
                </div>
                <p className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
                  amountMinor: 124875 &rarr; $1,248.75
                </p>
              </div>
            </div>

            {/* Bento Card 3: Multi-Tenant Workspaces (Col 5) */}
            <div className="md:col-span-5 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6 hover:border-emerald-500/40 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {t("landing.bento3Title")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("landing.bento3Desc")}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/50">
                  <span className="font-semibold text-foreground">Acme Agency Workspace</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Owner</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/50">
                  <span className="font-semibold text-foreground">Personal Side Projects</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">Admin</span>
                </div>
              </div>
            </div>

            {/* Bento Card 4: Automated SSL & Domain Health (Col 7) */}
            <div className="md:col-span-7 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6 hover:border-emerald-500/40 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {t("landing.bento4Title")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("landing.bento4Desc")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{t("landing.bento4CertChain")}</span>
                  <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t("landing.bento4CertValid")}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{t("landing.bento4AutoRenew")}</span>
                  <p className="text-xs font-bold text-foreground">{t("landing.bento4AutoRenewVal")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= INTERACTIVE CATEGORY SHOWCASE ================= */}
        <section id="categories" className="py-20 bg-muted/20 border-y border-border/60 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {t("landing.categoriesTag")}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {t("landing.categoriesTitle")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                {t("landing.categoriesSubtitle")}
              </p>
            </div>

            <InteractiveTabs />
          </div>
        </section>

        {/* ================= SELF-HOSTING & OPEN SOURCE ================= */}
        <section id="self-host" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {t("landing.selfHostTag")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {t("landing.selfHostTitle")}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t("landing.selfHostSubtitle")}
            </p>
          </div>

          {/* Docker Run Box */}
          <DockerCopy />

          {/* Value Props Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
            <div className="p-5 rounded-2xl border border-border/70 bg-card space-y-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-bold text-foreground">{t("landing.zeroTrackingTitle")}</h4>
              <p className="text-xs text-muted-foreground">
                {t("landing.zeroTrackingDesc")}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border/70 bg-card space-y-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-bold text-foreground">{t("landing.lightningFastTitle")}</h4>
              <p className="text-xs text-muted-foreground">
                {t("landing.lightningFastDesc")}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border/70 bg-card space-y-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-bold text-foreground">{t("landing.freeForeverTitle")}</h4>
              <p className="text-xs text-muted-foreground">
                {t("landing.freeForeverDesc")}
              </p>
            </div>
          </div>
        </section>

        {/* ================= HIGH-IMPACT PRE-FOOTER CTA ================= */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="relative rounded-3xl p-8 sm:p-14 bg-linear-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white overflow-hidden shadow-2xl shadow-emerald-900/30 text-center space-y-6">
            {/* Background Texture Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />

            <div className="space-y-3 max-w-2xl mx-auto relative z-10">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                {t("landing.preFooterTitle")}
              </h2>
              <p className="text-sm sm:text-base text-emerald-50 leading-relaxed">
                {t("landing.preFooterSubtitle")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 relative z-10">
              <Link href="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 rounded-2xl bg-white text-emerald-900 hover:bg-slate-100 font-extrabold text-sm shadow-lg shadow-black/10 cursor-pointer"
                >
                  {t("landing.createFreeWorkspace")}
                </Button>
              </Link>

              <a
                href={BUY_ME_A_COFFEE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-sm transition-colors shadow-lg shadow-black/10"
              >
                <Coffee className="w-4 h-4 text-amber-950" />
                <span>{t("landing.support")}</span>
              </a>
            </div>

            <p className="text-xs text-emerald-100/90 relative z-10">
              {t("landing.preFooterBadge")}
            </p>
          </div>
        </section>
      </main>

      {/* ================= COMPREHENSIVE FOOTER ================= */}
      <footer className="border-t border-border/60 bg-card/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Logo size={28} withGlow />
            <span className="font-extrabold tracking-tight text-lg text-foreground">
              Duesora
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              &copy; {new Date().getFullYear()} Duesora. {t("landing.allRightsReserved")}
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs font-semibold text-muted-foreground flex-wrap justify-center">
            <a href="#features" className="hover:text-foreground transition-colors">
              {t("landing.features")}
            </a>
            <a href="#categories" className="hover:text-foreground transition-colors">
              {t("landing.categories")}
            </a>
            <a href="#self-host" className="hover:text-foreground transition-colors">
              {t("landing.selfHost")}
            </a>
            <Link href="/api/docs">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg border-border/70 bg-card hover:bg-muted/70 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Docs &amp; API</span>
              </Button>
            </Link>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              {t("landing.github")}
            </a>
            <a
              href={BUY_ME_A_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-500 transition-colors"
            >
              {t("landing.support")}
            </a>
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <a
              className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
              target="_blank"
              rel="noopener noreferrer"
              href="https://adarshportfolio.onrender.com/"
            >
              <span>{t("landing.builtWith")}</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>{t("landing.by")}</span>
              <span className="font-medium underline underline-offset-2">Adarsh Kumar</span>
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
