"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { HeroPreview } from "@/components/landing/hero-preview";

interface LandingHeroProps {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

export function LandingHero({ user }: LandingHeroProps) {
  return (
    <section className="pt-12 sm:pt-16 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Clear, Honest Value Proposition */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {/* Main Headline & Description */}
          <div className="space-y-3.5 max-w-xl">
            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-serif font-normal tracking-tight text-foreground leading-[1.1]">
              Never miss a renewal again.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Keep your domains, subscriptions, certificates, and important deadlines in one place. Know what is due, what it costs, and when to take action.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            {user ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-10 px-5 rounded-[6px] bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-10 px-5 rounded-[6px] bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>

                <Link href="/api/docs" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto h-10 px-4 rounded-[6px] text-xs font-medium border-border hover:bg-muted text-foreground cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                    <span>API Documentation</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Clean, Compact Asset Ledger Preview */}
        <div className="lg:col-span-5">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}
