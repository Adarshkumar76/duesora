import Link from "next/link";
import { auth } from "@/auth";
import { LandingNavbar } from "@/components/landing/landing-navbar";
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
} from "lucide-react";
import { BUY_ME_A_COFFEE_URL, GITHUB_REPO_URL } from "@/lib/constants";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-emerald-500/20 selection:text-emerald-700 relative overflow-x-hidden">
      {/* Subtle Background Radial Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-teal-500/10 dark:bg-teal-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      {/* Sticky Glass Navbar */}
      <LandingNavbar user={user} />

      <main className="flex-1">
        {/* ================= HERO SECTION ================= */}
        <LandingHero user={user} />

        {/* ================= TECH STACK RIBBON ================= */}
        <section className="border-y border-border/60 bg-muted/20 py-8 px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground text-center md:text-left">
              Engineered with modern, privacy-first developer technologies
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

        {/* ================= FEATURES BENTO GRID ================= */}
        <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Precision Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Everything you need to eliminate renewal chaos
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Designed from the ground up to prevent costly lapse fees, sudden domain hijackings, and expired SSL downtime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Bento Card 1: Zero Surprise Renewals (Col 7) */}
            <div className="md:col-span-7 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6 hover:border-emerald-500/40 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shadow-xs">
                  <Bell className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Proactive Multi-Stage Expiration Alerts
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Receive intelligent reminders at 30 days, 7 days, and 24 hours before any domain, software subscription, or SSL certificate expires.
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
                    Expires in 28 Days
                  </span>
                </div>
                <div className="w-full bg-border/60 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full w-4/5" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Auto-renewal notification dispatched to workspace admins &amp; owners.
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
                  Zero Floating-Point Errors
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  All money math is stored as integer cents/paise in PostgreSQL. Support for USD ($), EUR (&euro;), INR (&#8377;), and GBP (&pound;).
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/30 p-4 space-y-2">
                <div className="flex justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  <span>Integer Ledger Math</span>
                  <span>100% Accurate</span>
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
                  Tenant-Isolated Workspaces
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Manage internal company subscriptions, personal side-projects, and client agency portfolios in strictly isolated workspaces.
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
                  Domain &amp; SSL Certificate Health
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Monitor Let&apos;s Encrypt 90-day certificates and long-term EV certificates. Never wake up to an expired certificate error on your live store or API.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Certificate Chain</span>
                  <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Valid RSA 2048
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Auto-Renew Policy</span>
                  <p className="text-xs font-bold text-foreground">Enabled via ACME / DNS</p>
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
                Unified Portfolio
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                One dashboard for every asset category
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Click a category below to explore live examples of how Duesora tracks your renewals.
              </p>
            </div>

            <InteractiveTabs />
          </div>
        </section>

        {/* ================= SELF-HOSTING & OPEN SOURCE ================= */}
        <section id="self-host" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Complete Sovereignty
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Run on your own server in 30 seconds
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Your financial data and domain credentials stay 100% on your own hardware.
            </p>
          </div>

          {/* Docker Run Box */}
          <DockerCopy />

          {/* Value Props Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
            <div className="p-5 rounded-2xl border border-border/70 bg-card space-y-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-bold text-foreground">Zero Tracking</h4>
              <p className="text-xs text-muted-foreground">
                No third-party cookies, no telemetry beacons, and no tracking scripts.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border/70 bg-card space-y-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-bold text-foreground">Lightning Fast</h4>
              <p className="text-xs text-muted-foreground">
                Powered by Next.js Server Components and Redis cache layer for sub-50ms loads.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border/70 bg-card space-y-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-bold text-foreground">Free Forever</h4>
              <p className="text-xs text-muted-foreground">
                GPL-compatible open-source license. Community driven and developer friendly.
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
                Take control of your infrastructure renewals today.
              </h2>
              <p className="text-sm sm:text-base text-emerald-50 leading-relaxed">
                Join indie hackers, agencies, and DevOps engineers who sleep peacefully knowing no domain or server renewal will catch them by surprise.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 relative z-10">
              <Link href="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 rounded-2xl bg-white text-emerald-900 hover:bg-slate-100 font-extrabold text-sm shadow-lg shadow-black/10 cursor-pointer"
                >
                  Create Free Workspace
                </Button>
              </Link>

              <a
                href={BUY_ME_A_COFFEE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-sm transition-colors shadow-lg shadow-black/10"
              >
                <Coffee className="w-4 h-4 text-amber-950" />
                <span>Buy Me a Coffee</span>
              </a>
            </div>

            <p className="text-xs text-emerald-100/90 relative z-10">
              Free &amp; Open Source &bull; No Credit Card Required &bull; Ready in 60 Seconds
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
              &copy; {new Date().getFullYear()} Duesora. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#categories" className="hover:text-foreground transition-colors">
              Categories
            </a>
            <a href="#self-host" className="hover:text-foreground transition-colors">
              Self-Host
            </a>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <a
              href={BUY_ME_A_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-500 transition-colors"
            >
              Buy Me a Coffee
            </a>
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <a
              className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
              target="_blank"
              rel="noopener noreferrer"
              href="https://adarshportfolio.onrender.com/"
            >
              <span>Built with</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>by</span>
              <span className="font-medium underline underline-offset-2">Adarsh Kumar</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}