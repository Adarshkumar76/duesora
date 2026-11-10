"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { GITHUB_REPO_URL } from "@/lib/constants";
import { HeroPreview } from "@/components/landing/hero-preview";
import { useTranslation } from "@/components/i18n/i18n-provider";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
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
    }, 3600);
    return () => clearInterval(timer);
  }, [rotatingPhrases.length]);

  return (
    <section className="pt-8 sm:pt-12 pb-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Editorial Headline & Value Proposition */}
        <div className="lg:col-span-5 space-y-6 text-left">
          {/* Eyebrow marker */}
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Autonomous Renewal &amp; Asset Ledger
            </span>
          </div>

          {/* Main Headline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-foreground leading-[1.12]">
              <span className="block">{t("landing.headline")}</span>
              <span className="block mt-1 text-primary">
                {rotatingPhrases[rotatingIndex]}
              </span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {t("landing.subheadline")}
            </p>
          </div>

          {/* Action Button Cluster */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            {user ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-9.5 px-4 rounded-[6px] bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer"
                >
                  <span>{t("landing.goToDashboard")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-9.5 px-4 rounded-[6px] bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer"
                  >
                    <span>{t("landing.startTrackingFree")}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>

                <Link href="/login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto h-9.5 px-3.5 rounded-[6px] text-xs font-medium cursor-pointer"
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
              className="inline-flex items-center justify-center gap-1.5 h-9.5 px-3 rounded-[6px] border border-border bg-card hover:bg-muted text-foreground text-xs font-medium transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>{t("landing.starOnGithub")}</span>
            </a>
          </div>

          {/* Key Specifications & Proof Points */}
          <div className="pt-2 border-t border-border/80 grid grid-cols-2 gap-3 text-left">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                {t("landing.bento2Tag")}
              </span>
              <p className="text-xs font-semibold text-foreground tabular-nums">
                100% {t("landing.bento2Accuracy")}
              </p>
              <p className="text-[11px] text-muted-foreground">Integer minor units</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                {t("landing.tabDomains")}
              </span>
              <p className="text-xs font-semibold text-foreground tabular-nums">
                Sub-Second RDAP
              </p>
              <p className="text-[11px] text-muted-foreground">ICANN &amp; TLS 1.3</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                {t("landing.selfHost")}
              </span>
              <p className="text-xs font-semibold text-foreground">
                {t("landing.freeForever")}
              </p>
              <p className="text-[11px] text-muted-foreground">PostgreSQL &amp; Docker</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                Escalation
              </span>
              <p className="text-xs font-semibold text-foreground tabular-nums">
                T-30d → T-7d → T-24h
              </p>
              <p className="text-[11px] text-muted-foreground">Slack, Discord, Email</p>
            </div>
          </div>

          {/* Social Proof Line */}
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 flex-wrap">
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-primary" />
              <span>{t("landing.freeForever")}</span>
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-primary" />
              <span>{t("landing.noTelemetry")}</span>
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-primary" />
              <span>{t("landing.accurateMath")}</span>
            </span>
          </div>
        </div>

        {/* Right Column: Interactive Product Console */}
        <div className="lg:col-span-7 w-full">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}
