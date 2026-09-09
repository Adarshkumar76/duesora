import Link from "next/link";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { HeroPreview } from "@/components/landing/hero-preview";
import { InteractiveTabs } from "@/components/landing/interactive-tabs";
import { DockerCopy } from "@/components/landing/docker-copy";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Coins,
  ShieldCheck,
  Building2,
  ArrowRight,
  Coffee,
  CheckCircle2,
  Sparkles,
  Lock,
  Zap,
  Heart,
} from "lucide-react";
import { BUY_ME_A_COFFEE_URL, GITHUB_REPO_URL } from "@/lib/constants";
import { Logo } from "@/components/logo";

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

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-emerald-500/20 selection:text-emerald-700 relative overflow-x-hidden">
      {/* Subtle Background Radial Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-teal-500/10 dark:bg-teal-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      {/* Sticky Glass Navbar */}
      <LandingNavbar />

      <main className="flex-1">
        {/* ================= HERO SECTION ================= */}
        <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
          {/* Announcement Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/50 backdrop-blur-md text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-2xs hover:border-emerald-500/50 transition-colors">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Duesora v1.0 • 100% Free & Open-Source Asset & Renewal Tracker</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">&rarr;</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-foreground">
              Know what you own. <br />
              <span className="bg-linear-to-r from-emerald-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Never miss what&apos;s due.
              </span>
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The centralized command center for developers, agencies, and businesses to monitor domains, SSL certificates, cloud servers, and SaaS subscriptions without surprise charges or sudden downtime.
            </p>
          </div>

          {/* CTA Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/register">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-7 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 gap-2 cursor-pointer transition-all hover:scale-102"
              >
                <span>Start Tracking Free</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-7 rounded-2xl border-border/80 hover:bg-muted font-bold text-sm cursor-pointer transition-all"
              >
                <span>Explore Live Dashboard</span>
              </Button>
            </Link>

            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-5 rounded-2xl border border-border/80 bg-card/60 hover:bg-muted text-foreground text-sm font-semibold transition-all"
            >
              <GithubIcon className="w-4 h-4" />
              <span>Star on GitHub</span>
            </a>
          </div>

          {/* Social Proof Checklist */}
          <div className="flex items-center justify-center gap-6 sm:gap-8 text-xs font-semibold text-muted-foreground pt-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              100% Free & Open Source
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Zero Telemetry or Data Lock-In
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Minor-Integer Financial Math
            </span>
          </div>

          {/* 3D-Perspective Hero Preview */}
          <div className="pt-6 sm:pt-10">
            <HeroPreview />
          </div>
        </section>

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
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>by Adarsh Kumar</span>
          </div>
        </div>
      </footer>
    </div>
  );
}