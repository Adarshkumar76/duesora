"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { GITHUB_REPO_URL } from "@/lib/constants";
import { HeroPreview } from "@/components/landing/hero-preview";
import { useTranslation } from "@/components/i18n/i18n-provider";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

interface LandingHeroProps {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

export function LandingHero({ user }: LandingHeroProps) {
  const { t } = useTranslation();

  return (
    <section className="relative pt-10 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
      {/* Announcement Pill Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/50 backdrop-blur-md text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-2xs hover:border-emerald-500/50 transition-colors">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Open Source Release v1.0 • Autonomous Renewal &amp; Spend Telemetry</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-bold">&rarr;</span>
      </div>

      {/* Main Headline */}
      <div className="space-y-4 max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-foreground">
          Autonomous asset intelligence. <br />
          <span className="bg-linear-to-r from-emerald-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
            Zero surprise renewals.
          </span>
        </h1>
        <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          The open-source command center for engineering &amp; finance. Track domain portfolios, SSL certificates, SaaS seat waste, and cloud infrastructure with mathematical precision.
        </p>
      </div>

      {/* CTA Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {user ? (
          <Link href="/dashboard">
            <Button
              size="lg"
              className="w-full sm:w-auto h-12 px-7 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 gap-2 cursor-pointer transition-all hover:scale-102"
            >
              <span>{t("landing.goToDashboard")}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        ) : (
          <>
            <Link href="/register">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-7 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 gap-2 cursor-pointer transition-all hover:scale-102"
              >
                <span>{t("landing.startTrackingFree")}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-7 rounded-2xl border-border/80 hover:bg-muted font-bold text-sm cursor-pointer transition-all"
              >
                <span>{t("landing.signIn")}</span>
              </Button>
            </Link>
          </>
        )}

        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-5 rounded-2xl border border-border/80 bg-card/60 hover:bg-muted text-foreground text-sm font-semibold transition-all shadow-2xs"
        >
          <GithubIcon className="w-4 h-4" />
          <span>Star on GitHub</span>
        </a>
      </div>

      {/* Ramp-Style Precision Metrics Strip */}
      <div className="pt-2 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
        <div className="p-3 rounded-2xl border border-border/70 bg-card/60 shadow-2xs">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Precision Math</p>
          <p className="text-base sm:text-lg font-black text-foreground">100% Deterministic</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Integer cents ledger</p>
        </div>
        <div className="p-3 rounded-2xl border border-border/70 bg-card/60 shadow-2xs">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">DNS &amp; TLS Probes</p>
          <p className="text-base sm:text-lg font-black text-foreground">Sub-Second</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">ICANN &amp; ACME verified</p>
        </div>
        <div className="p-3 rounded-2xl border border-border/70 bg-card/60 shadow-2xs">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Self-Host Ready</p>
          <p className="text-base sm:text-lg font-black text-foreground">Zero Lock-In</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">100% PostgreSQL schema</p>
        </div>
        <div className="p-3 rounded-2xl border border-border/70 bg-card/60 shadow-2xs">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Escalation Ladder</p>
          <p className="text-base sm:text-lg font-black text-foreground">30d &rarr; 7d &rarr; 24h</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Slack, Discord, Email</p>
        </div>
      </div>

      {/* Social Proof Checklist */}
      <div className="flex items-center justify-center gap-6 sm:gap-8 text-xs font-semibold text-muted-foreground pt-1 flex-wrap">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {t("landing.freeForever")}
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {t("landing.noTelemetry")}
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {t("landing.accurateMath")}
        </span>
      </div>

      {/* 3D-Perspective Live Interactive Hero Demo */}
      <div className="pt-4 sm:pt-6">
        <HeroPreview />
      </div>
    </section>
  );
}
