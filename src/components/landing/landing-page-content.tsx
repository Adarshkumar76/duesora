"use client";

import { useState } from "react";
import Link from "next/link";
import { LandingHero } from "@/components/landing/landing-hero";
import { DockerCopy } from "@/components/landing/docker-copy";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Lock,
  CreditCard,
  Server,
  Cloud,
  Key,
  FileText,
  ShieldCheck,
  Cpu,
  Bookmark,
  Bell,
  Coins,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { Logo } from "@/components/logo";

interface LandingPageContentProps {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

export function LandingPageContent({ user }: LandingPageContentProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  const trackableCategories = [
    {
      title: "Domain Names",
      desc: "Monitor ICANN expirations, registrar renewal dates, and auto-renew status across Namecheap, Cloudflare, GoDaddy, and Route 53.",
      icon: Globe,
    },
    {
      title: "SSL & TLS Certificates",
      desc: "Track Let's Encrypt 90-day certificates, custom Wildcard certificates, and intermediate chains before browser warnings trigger.",
      icon: Lock,
    },
    {
      title: "SaaS Subscriptions",
      desc: "Manage recurring subscriptions for Figma, Linear, GitHub, Slack, Notion, and Google Workspace with seat counts and monthly costs.",
      icon: CreditCard,
    },
    {
      title: "Hosting & VPS",
      desc: "Keep track of dedicated servers, Hetzner boxes, DigitalOcean droplets, Vercel deployments, and monthly billing cycles.",
      icon: Server,
    },
    {
      title: "Cloud Infrastructure",
      desc: "Catalog AWS RDS databases, Google Cloud instances, S3 storage commitments, and Reserved Instance renewal windows.",
      icon: Cloud,
    },
    {
      title: "API Plans & Credits",
      desc: "Track OpenAI, Anthropic, Resend, Twilio, and Stripe credits, prepaid balances, and monthly plan renewals.",
      icon: Key,
    },
    {
      title: "Software Licenses",
      desc: "Record JetBrains, Ableton, Adobe, and desktop developer software licenses, seat allocations, and upgrade renewal dates.",
      icon: Cpu,
    },
    {
      title: "Vendor Contracts & MSAs",
      desc: "Store master service agreements, notice period deadlines, auto-renew opt-out clauses, and key contact details.",
      icon: FileText,
    },
    {
      title: "Warranties & Equipment",
      desc: "Track company hardware warranties, AppleCare coverage, office leases, and physical equipment support contracts.",
      icon: ShieldCheck,
    },
    {
      title: "Custom Resources",
      desc: "Define custom tracking items for compliance deadlines, trademark renewals, tax filings, or specialized industry certificates.",
      icon: Bookmark,
    },
  ];

  const faqs = [
    {
      question: "How is Duesora deployed and hosted?",
      answer: "Duesora is self-hostable software designed for private infrastructure. You can run it on your own servers with zero vendor lock-in, recurring SaaS subscription fees, or feature gates.",
    },
    {
      question: "How do I self-host Duesora?",
      answer: "You can run Duesora with a single Docker command using Docker Compose. A pre-built container image and compose configuration are provided, requiring only standard PostgreSQL and environment variables.",
    },
    {
      question: "Can I import my existing spreadsheet or data?",
      answer: "Yes. Duesora includes a built-in CSV import and export tool. You can map your existing spreadsheets into Duesora with columns for name, category, renewal date, cost, and provider.",
    },
    {
      question: "Which notification channels are supported for alerts?",
      answer: "Duesora supports automated multi-channel notifications via Email (SMTP or Resend), Discord Webhooks, Slack Incoming Webhooks, Telegram Bots, Microsoft Teams, custom Webhooks, and self-hosted ntfy servers.",
    },
    {
      question: "Can I sync renewals with my calendar?",
      answer: "Yes. Every workspace generates a private, tokenized .ics iCalendar subscription link that you can subscribe to in Google Calendar, Apple Calendar, or Microsoft Outlook.",
    },
    {
      question: "Does Duesora send any data back to external servers?",
      answer: "No. Duesora does not contain any third-party tracking scripts, analytics cookies, or telemetry pings. When you self-host Duesora, your database and asset data remain entirely within your private environment.",
    },
  ];

  return (
    <>
      <main className="flex-1">
        {/* ================= HERO SECTION ================= */}
        <LandingHero user={user} />

        {/* ================= WHAT YOU CAN TRACK ================= */}
        <section id="track" className="py-14 sm:py-18 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 text-left border-t border-border">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block">
              Asset Ledger
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight text-foreground">
              What you can track with Duesora
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              From everyday SaaS subscriptions to critical production TLS certificates, Duesora gives you one single place to record ownership, renewal dates, and costs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trackableCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.title}
                  className="p-4 sm:p-5 rounded-[8px] border border-border bg-card hover:border-foreground/20 transition-colors space-y-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[6px] bg-muted/80 border border-border flex items-center justify-center shrink-0 text-primary">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">
                      {cat.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= HOW DUESORA WORKS ================= */}
        <section id="how-it-works" className="py-14 sm:py-18 bg-muted/20 border-y border-border px-4 sm:px-6 lg:px-8 text-left">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="space-y-2 max-w-2xl">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block">
                Workflow
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight text-foreground">
                How Duesora works
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Simple, straightforward steps to eliminate surprise charges and expired infrastructure.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="p-6 rounded-[8px] border border-border bg-card space-y-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-primary">
                    01
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">Input</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  Add what you own
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter your domains, subscriptions, licenses, and certificates through a clean form or bulk-import your existing records using CSV.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-[8px] border border-border bg-card space-y-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-primary">
                    02
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">Ownership</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  Set deadlines and owners
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Specify renewal intervals, notice period deadlines (e.g. 30 days before auto-renew), costs, and designate who on your team is responsible.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-[8px] border border-border bg-card space-y-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-primary">
                    03
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">Action</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  Get notified before charges
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Receive alerts in Slack, Discord, Telegram, or email well before billing takes place. Review unused seats, renegotiate, or cancel on time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CORE FEATURES OVERVIEW ================= */}
        <section id="features" className="py-14 sm:py-18 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 text-left">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block">
              Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight text-foreground">
              Built for precision and clarity
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No bloated enterprise gimmicks. Just the tools you need to stay organized and financially disciplined.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Feature 1: Cost Tracking */}
            <div className="p-6 rounded-[8px] border border-border bg-card space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2.5 text-primary">
                <Coins className="w-5 h-5" />
                <h3 className="text-base font-semibold text-foreground">
                  Predictable Cost &amp; Recurring Spend Tracking
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Track costs across multiple currencies (USD, EUR, GBP, INR) with deterministic integer-minor arithmetic. See your total monthly and annual recurring commitments at a glance without float rounding errors.
              </p>
            </div>

            {/* Feature 2: Multi-Channel Reminders */}
            <div className="p-6 rounded-[8px] border border-border bg-card space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2.5 text-primary">
                <Bell className="w-5 h-5" />
                <h3 className="text-base font-semibold text-foreground">
                  Multi-Channel Notification Dispatch
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Connect your team’s existing communication tools. Send upcoming renewal digests and critical expiration warnings to Slack channels, Discord servers, Telegram groups, ntfy topics, or via SMTP email.
              </p>
            </div>

            {/* Feature 3: Workspace Teams & Roles */}
            <div className="p-6 rounded-[8px] border border-border bg-card space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2.5 text-primary">
                <Building2 className="w-5 h-5" />
                <h3 className="text-base font-semibold text-foreground">
                  Workspaces &amp; Role-Based Access Control
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Organize assets across isolated workspaces for different companies, clients, or personal projects. Invite team members with Owner, Admin, Member, or Viewer roles to delegate ownership responsibly.
              </p>
            </div>

            {/* Feature 4: Calendar Sync */}
            <div className="p-6 rounded-[8px] border border-border bg-card space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2.5 text-primary">
                <Calendar className="w-5 h-5" />
                <h3 className="text-base font-semibold text-foreground">
                  Live Calendar Integration (.ics)
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Never miss an event on your personal schedule. Subscribe to your workspace’s dynamic .ics feed directly in Google Calendar, Apple Calendar, or Outlook to view upcoming deadlines alongside your meetings.
              </p>
            </div>
          </div>
        </section>

        {/* ================= PRIVATE DEPLOYMENT & SELF-HOSTING ================= */}
        <section id="self-host" className="py-14 sm:py-18 bg-muted/20 border-y border-border px-4 sm:px-6 lg:px-8 text-left">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="space-y-2 max-w-2xl">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block">
                Deployment
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight text-foreground">
                Run it on your own terms
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Deploy Duesora anywhere Docker runs. Keep your internal infrastructure inventory and renewal dates completely confidential.
              </p>
            </div>

            {/* Docker Run Copy Widget */}
            <div className="max-w-3xl">
              <DockerCopy />
            </div>

            {/* Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-[8px] border border-border bg-card space-y-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Full Data Sovereignty</span>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your data is stored directly in your own PostgreSQL database with complete privacy and control.
                </p>
              </div>

              <div className="p-5 rounded-[8px] border border-border bg-card space-y-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Private &amp; Customizable</span>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Configure and extend the platform to fit your company’s workflow within your private environment.
                </p>
              </div>

              <div className="p-5 rounded-[8px] border border-border bg-card space-y-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Lightweight &amp; Fast</span>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Built on modern Next.js 16, React 19, and Drizzle ORM for instant page transitions and minimal resource consumption.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FREQUENTLY ASKED QUESTIONS ================= */}
        <section id="faq" className="py-14 sm:py-18 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 text-left">
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block">
              A Few Things to Know
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight text-foreground">
              Frequently asked questions
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Clear answers to common questions about Duesora, licensing, and deployment.
            </p>
          </div>

          <div className="divide-y divide-border border border-border rounded-[8px] bg-card overflow-hidden">
            {faqs.map((faq, idx) => (
              <div key={faq.question} className="p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between text-left gap-4 font-semibold text-sm text-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${openFaqIndex === idx ? "rotate-180 text-primary" : ""
                      }`}
                  />
                </button>
                {openFaqIndex === idx && (
                  <p className="pt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ================= CALL TO ACTION ================= */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="rounded-[8px] border border-border bg-card p-6 sm:p-10 shadow-[0_1px_3px_rgba(0,0,0,0.03)] text-left flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight text-foreground">
                Start tracking your renewals today
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Take control of your domains, subscriptions, and certificates in minutes. Private and self-hostable.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <Link href="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-10 px-5 rounded-[6px] bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>

              <Link href="/api/docs" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-10 px-4 rounded-[6px] border border-border bg-card hover:bg-muted text-foreground text-xs font-medium transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1.5 text-primary" />
                  <span>API Documentation</span>
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ================= CLEAN FOOTER ================= */}
      <footer className="border-t border-border bg-card/60 py-8 px-4 sm:px-6 lg:px-8 text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <Logo size={22} color="#0F766E" />
            <span className="font-semibold tracking-tight text-sm text-foreground">
              Duesora
            </span>
            <span className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Duesora. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs font-medium text-muted-foreground flex-wrap">
            <a href="#track" className="hover:text-foreground transition-colors">
              What to Track
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#self-host" className="hover:text-foreground transition-colors">
              Self-Host
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
            <Link href="/api/docs" className="hover:text-foreground transition-colors flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-primary" />
              <span>API Documentation</span>
            </Link>
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <a
              className="hover:text-foreground transition-colors inline-flex items-center gap-1"
              target="_blank"
              rel="noopener noreferrer"
              href="https://adarshportfolio.onrender.com/"
            >
              <span>Built by</span>
              <span className="font-medium underline underline-offset-2">Adarsh Kumar</span>
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
