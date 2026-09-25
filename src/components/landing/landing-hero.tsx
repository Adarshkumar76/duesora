"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
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
  const [rotatingIndex, setRotatingIndex] = useState(0);

  const rotatingPhrases = [
    t("landing.zeroSurpriseRenewals"),
    t("landing.zeroExpiredSsl"),
    t("landing.zeroWastedSeats"),
    t("landing.zeroDnsDowntime"),
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setRotatingIndex((prev) => (prev + 1) % rotatingPhrases.length);
    }, 3400);
    return () => clearInterval(timer);
  }, [rotatingPhrases.length]);

  return (
    <section className="relative pt-10 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
      {/* Announcement Pill Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/50 backdrop-blur-md text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-2xs hover:border-emerald-500/50 transition-colors animate-in fade-in duration-500">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>{t("landing.heroPill")}</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-bold">&rarr;</span>
      </div>

      {/* Main Headline with Dynamic Animation */}
      <div className="space-y-4 max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-foreground">
          <span className="block animate-in fade-in slide-in-from-top-2 duration-500">
            {t("landing.headline")}
          </span>
          <span className="relative inline-flex items-center justify-center mt-2 min-h-[1.25em]">
            <span
              key={rotatingIndex}
              className="bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-300 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-2 duration-500 drop-shadow-xs"
            >
              {rotatingPhrases[rotatingIndex]}
            </span>
            <span className="inline-block w-1.5 h-7 sm:h-12 ml-2 sm:ml-3 bg-emerald-500 rounded-full animate-pulse align-middle" />
          </span>
        </h1>
        <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in duration-700">
          {t("landing.subheadline")}
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
          <span>{t("landing.starOnGithub")}</span>
        </a>
      </div>

      {/* Precision Metrics Strip */}
      <div className="pt-2 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
        <div className="p-3 rounded-2xl border border-border/70 bg-card/60 shadow-2xs hover:border-emerald-500/40 transition-colors">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("landing.bento2Tag")}</p>
          <p className="text-base sm:text-lg font-black text-foreground">100% {t("landing.bento2Accuracy")}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{t("landing.accurateMath")}</p>
        </div>
        <div className="p-3 rounded-2xl border border-border/70 bg-card/60 shadow-2xs hover:border-emerald-500/40 transition-colors">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("landing.tabDomains")}</p>
          <p className="text-base sm:text-lg font-black text-foreground">Sub-Second</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">ICANN &amp; TLS 1.3</p>
        </div>
        <div className="p-3 rounded-2xl border border-border/70 bg-card/60 shadow-2xs hover:border-emerald-500/40 transition-colors">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("landing.selfHost")}</p>
          <p className="text-base sm:text-lg font-black text-foreground">{t("landing.freeForever")}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">PostgreSQL Schema</p>
        </div>
        <div className="p-3 rounded-2xl border border-border/70 bg-card/60 shadow-2xs hover:border-emerald-500/40 transition-colors">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Escalation</p>
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
          <Sparkles className="w-4 h-4 text-emerald-600" />
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
