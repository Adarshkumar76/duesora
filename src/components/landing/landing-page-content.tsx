"use client";

import { useState } from "react";
import Link from "next/link";
import { LandingHero } from "@/components/landing/landing-hero";
import { TelemetryPipeline } from "@/components/landing/telemetry-pipeline";
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
  Lock,
  Zap,
  Heart,
  BookOpen,
  Sliders,
  ArrowRight,
  Database,
  Server,
  Layers,
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

  // Seat calculator
  const [teamSize, setTeamSize] = useState<number>(20);
  const estimatedSavings = Math.round(teamSize * 185);

  // Decision filter
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
        {/* ================= HERO SECTION (Asymmetric Split Layout) ================= */}
        <LandingHero user={user} />

        {/* ================= TECHNICAL SPECIFICATIONS RIBBON ================= */}
        <section className="border-y border-border bg-card/60 py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              {t("landing.techStackTitle")}
            </p>
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs font-mono text-foreground/80">
              <span className="px-2 py-0.5 rounded-[4px] bg-muted border border-border">Next.js 16</span>
              <span className="px-2 py-0.5 rounded-[4px] bg-muted border border-border">React 19</span>
              <span className="px-2 py-0.5 rounded-[4px] bg-muted border border-border">PostgreSQL 16</span>
              <span className="px-2 py-0.5 rounded-[4px] bg-muted border border-border">Drizzle ORM</span>
              <span className="px-2 py-0.5 rounded-[4px] bg-muted border border-border">Tailwind v4</span>
              <span className="px-2 py-0.5 rounded-[4px] bg-muted border border-border">Docker Ready</span>
            </div>
          </div>
        </section>

        {/* ================= FINANCIAL TELEMETRY & DECISION ENGINE ================= */}
        <section className="py-14 sm:py-18 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 text-left">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Autonomous Financial Telemetry
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Eliminate zombie SaaS and rogue renewals
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Modern companies lose thousands annually to unattended trials and forgotten seat licenses. Duesora enforces structured decision workflows.
            </p>
          </div>

          {/* Interactive Decision Matrix & Waste Calculator Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Col: Interactive Decision Matrix (Col 7) */}
            <div className="lg:col-span-7 rounded-[8px] border border-border bg-card p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">
                    The Renewal Decision Engine
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Classify contracts ahead of billing: Keep, Renegotiate Seats, or Cancel.
                  </p>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-[6px] border border-border text-xs shrink-0">
                  {(["all", "keep", "review", "cancel"] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setDecisionFilter(filter)}
                      className={`px-2 py-0.5 rounded-[4px] text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                        decisionFilter === filter
                          ? "bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.03)] font-semibold border border-border/60"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contracts List */}
              <div className="space-y-2">
                {filteredContracts.map((contract) => (
                  <div
                    key={contract.name}
                    className="p-3 rounded-[6px] border border-border bg-background hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-foreground">{contract.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono border ${
                            contract.decision === "cancel"
                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
                              : contract.decision === "review"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                              : "bg-teal-500/10 text-teal-800 dark:text-teal-300 border-teal-500/30"
                          }`}
                        >
                          {contract.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {contract.category} · {contract.seats}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-mono tabular-nums font-semibold text-foreground block">
                          {contract.cost}
                        </span>
                        <span className="text-[10px] font-mono text-primary font-medium">
                          {contract.savings}
                        </span>
                      </div>

                      <span className="px-2.5 py-1 rounded-[5px] text-xs font-medium bg-card border border-border text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        {contract.action}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Interactive Seat Waste Calculator (Col 5) */}
            <div className="lg:col-span-5 rounded-[8px] border border-border bg-card p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">
                    Interactive Waste Calculator
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Adjust team headcount to forecast annual subscription waste Duesora prevents through license audits.
                </p>
              </div>

              {/* Slider Controller */}
              <div className="space-y-3 p-4 rounded-[6px] border border-border bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Team Headcount</span>
                  <span className="text-xs font-mono tabular-nums font-bold text-foreground bg-card px-2 py-0.5 rounded-[4px] border border-border">
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
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-teal-700"
                />

                <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                  <span>5 members</span>
                  <span>75 members</span>
                  <span>150+ scale</span>
                </div>
              </div>

              {/* Result Card */}
              <div className="p-3.5 rounded-[6px] border border-border bg-muted/30 space-y-1 text-left">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                  Estimated Annual Capital Saved
                </span>
                <p className="text-2xl font-bold font-mono tabular-nums text-foreground">
                  ${estimatedSavings.toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground ml-1">/ year</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Based on 1.8 unused seats per 10 employees across industry SaaS subscriptions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= TELEMETRY PIPELINE IN MOTION ================= */}
        <TelemetryPipeline />

        {/* ================= SYSTEM CAPABILITIES / EDITORIAL GRID ================= */}
        <section id="features" className="py-14 sm:py-18 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 text-left">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                {t("landing.featuresTag")}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {t("landing.featuresTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t("landing.featuresSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Bento Card 1: Multi-Stage Escalation Ladder (Col 7) */}
            <div className="md:col-span-7 rounded-[8px] border border-border bg-card p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Bell className="w-4 h-4" />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                    Escalation Pipeline
                  </span>
                </div>
                <h3 className="text-base font-bold tracking-tight text-foreground">
                  {t("landing.bento1Title")}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("landing.bento1Desc")}
                </p>
              </div>

              {/* Timeline Simulation */}
              <div className="rounded-[6px] border border-border bg-muted/20 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="font-mono text-foreground text-xs">
                    duesora.com (GoDaddy Domain)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-card border border-border text-foreground">
                    {t("landing.bento1Badge")}
                  </span>
                </div>
                <div className="w-full bg-border/60 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full w-4/5" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t("landing.bento1Note")}
                </p>
              </div>
            </div>

            {/* Bento Card 2: Multi-Currency Minor-Integer Math (Col 5) */}
            <div className="md:col-span-5 rounded-[8px] border border-border bg-card p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Coins className="w-4 h-4" />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                    Deterministic Math
                  </span>
                </div>
                <h3 className="text-base font-bold tracking-tight text-foreground">
                  {t("landing.bento2Title")}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("landing.bento2Desc")}
                </p>
              </div>

              <div className="rounded-[6px] border border-border bg-muted/20 p-3.5 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>{t("landing.bento2Tag")}</span>
                  <span className="text-primary font-medium">{t("landing.bento2Accuracy")}</span>
                </div>
                <p className="text-foreground font-semibold tabular-nums">
                  amount_minor: 124875 → $1,248.75
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Zero float rounding drift across multi-currency conversions.
                </p>
              </div>
            </div>

            {/* Bento Card 3: Multi-Tenant Workspaces (Col 5) */}
            <div className="md:col-span-5 rounded-[8px] border border-border bg-card p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Building2 className="w-4 h-4" />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                    Access Isolation
                  </span>
                </div>
                <h3 className="text-base font-bold tracking-tight text-foreground">
                  {t("landing.bento3Title")}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("landing.bento3Desc")}
                </p>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-[5px] bg-background border border-border">
                  <span className="font-medium text-foreground">Acme Agency Workspace</span>
                  <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono bg-muted text-foreground border border-border">
                    Owner
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-[5px] bg-background border border-border">
                  <span className="font-medium text-foreground">Personal Side Projects</span>
                  <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono bg-muted text-muted-foreground border border-border">
                    Admin
                  </span>
                </div>
              </div>
            </div>

            {/* Bento Card 4: Automated SSL & Domain Health (Col 7) */}
            <div className="md:col-span-7 rounded-[8px] border border-border bg-card p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                    Autonomous Probes
                  </span>
                </div>
                <h3 className="text-base font-bold tracking-tight text-foreground">
                  {t("landing.bento4Title")}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("landing.bento4Desc")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-[6px] border border-border bg-muted/20 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                    {t("landing.bento4CertChain")}
                  </span>
                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t("landing.bento4CertValid")}</span>
                  </p>
                </div>
                <div className="p-3 rounded-[6px] border border-border bg-muted/20 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                    {t("landing.bento4AutoRenew")}
                  </span>
                  <p className="text-xs font-mono font-semibold text-foreground">
                    {t("landing.bento4AutoRenewVal")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CATEGORY SHOWCASE ================= */}
        <section id="categories" className="py-14 sm:py-18 bg-muted/20 border-y border-border px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-8 text-left">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  {t("landing.categoriesTag")}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {t("landing.categoriesTitle")}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("landing.categoriesSubtitle")}
              </p>
            </div>

            <InteractiveTabs />
          </div>
        </section>

        {/* ================= SELF-HOSTING & OPEN SOURCE ================= */}
        <section id="self-host" className="py-14 sm:py-18 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 text-left">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                {t("landing.selfHostTag")}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {t("landing.selfHostTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t("landing.selfHostSubtitle")}
            </p>
          </div>

          {/* Docker Run Box */}
          <div className="max-w-4xl">
            <DockerCopy />
          </div>

          {/* Value Props Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-[8px] border border-border bg-card space-y-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <Lock className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-semibold text-foreground">{t("landing.zeroTrackingTitle")}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("landing.zeroTrackingDesc")}
              </p>
            </div>

            <div className="p-4 rounded-[8px] border border-border bg-card space-y-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <Zap className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-semibold text-foreground">{t("landing.lightningFastTitle")}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("landing.lightningFastDesc")}
              </p>
            </div>

            <div className="p-4 rounded-[8px] border border-border bg-card space-y-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <Layers className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-semibold text-foreground">{t("landing.freeForeverTitle")}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("landing.freeForeverDesc")}
              </p>
            </div>
          </div>
        </section>

        {/* ================= RESTRAINED PRE-FOOTER CTA ================= */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="rounded-[8px] border border-border bg-card p-6 sm:p-10 shadow-[0_1px_3px_rgba(0,0,0,0.03)] text-left flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  Deterministic Control
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {t("landing.preFooterTitle")}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("landing.preFooterSubtitle")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <Link href="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-9.5 px-4 rounded-[6px] bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer"
                >
                  {t("landing.createFreeWorkspace")}
                </Button>
              </Link>

              <a
                href={BUY_ME_A_COFFEE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9.5 px-3.5 rounded-[6px] border border-border bg-card hover:bg-muted text-foreground text-xs font-medium transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                <Coffee className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{t("landing.support")}</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ================= EDITORIAL FOOTER ================= */}
      <footer className="border-t border-border bg-card/60 py-8 px-4 sm:px-6 lg:px-8 text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <Logo size={22} color="#0F766E" />
            <span className="font-semibold tracking-tight text-sm text-foreground">
              Duesora
            </span>
            <span className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Duesora. {t("landing.allRightsReserved")}
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs font-medium text-muted-foreground flex-wrap">
            <a href="#features" className="hover:text-foreground transition-colors">
              {t("landing.features")}
            </a>
            <a href="#categories" className="hover:text-foreground transition-colors">
              {t("landing.categories")}
            </a>
            <a href="#self-host" className="hover:text-foreground transition-colors">
              {t("landing.selfHost")}
            </a>
            <Link href="/api/docs" className="hover:text-foreground transition-colors flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-primary" />
              <span>Documentation</span>
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
              className="hover:text-foreground transition-colors"
            >
              {t("landing.support")}
            </a>
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <a
              className="hover:text-foreground transition-colors inline-flex items-center gap-1"
              target="_blank"
              rel="noopener noreferrer"
              href="https://adarshportfolio.onrender.com/"
            >
              <span>{t("landing.builtWith")}</span>
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
              <span>{t("landing.by")}</span>
              <span className="font-medium underline underline-offset-2">Adarsh Kumar</span>
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
