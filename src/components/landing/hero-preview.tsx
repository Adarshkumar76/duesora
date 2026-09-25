"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  RefreshCw,
  Bell,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Copy,
  Check,
  Zap,
  TrendingDown,
  ShieldCheck,
  Clock,
  ArrowRight,
} from "lucide-react";

type DemoTab = "domains" | "saas" | "alerts" | "api";

export function HeroPreview() {
  const [activeTab, setActiveTab] = useState<DemoTab>("domains");
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [simulatedAlertSuccess, setSimulatedAlertSuccess] = useState(false);
  const [activeCurrency, setActiveCurrency] = useState<"USD" | "EUR" | "GBP" | "INR">("USD");
  const [optimizedSeats, setOptimizedSeats] = useState(false);

  // Live countdown ticker simulation for domain expiration (11 days, 14h, 22m, seconds ticking down)
  const [secondsRemaining, setSecondsRemaining] = useState(1002145);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 1002145));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format seconds into days, hours, minutes, seconds
  const days = Math.floor(secondsRemaining / 86400);
  const hours = Math.floor((secondsRemaining % 86400) / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  // Auto-playing loop like a Supabase GIF if user is not actively clicking
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        if (prev === "domains") return "saas";
        if (prev === "saas") return "alerts";
        if (prev === "alerts") return "api";
        return "domains";
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleTabClick = (tab: DemoTab) => {
    setActiveTab(tab);
    setIsAutoPlaying(false);
  };

  const handleTriggerAlert = () => {
    setSimulatedAlertSuccess(true);
    setTimeout(() => setSimulatedAlertSuccess(false), 4500);
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText("curl -s https://api.duesora.com/v1/renewals -H 'Authorization: Bearer ds_live_...'");
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Currency symbols & rates
  const currencyRates = {
    USD: { symbol: "$", rate: 1.0, formatted: "$1,248.00" },
    EUR: { symbol: "€", rate: 0.92, formatted: "€1,148.16" },
    GBP: { symbol: "£", rate: 0.79, formatted: "£985.92" },
    INR: { symbol: "₹", rate: 86.5, formatted: "₹1,07,952" },
  };

  return (
    <div className="relative mx-auto max-w-5xl rounded-3xl p-1.5 sm:p-3 bg-linear-to-b from-emerald-500/25 via-border/50 to-border/20 border border-emerald-500/30 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl">
      {/* Glow Ambient Blob */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/15 blur-3xl rounded-full pointer-events-none -z-10" />

      {/* Main Glass Mockup Window */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-inner">
        {/* Top Control Ribbon */}
        <div className="h-12 border-b border-border/60 bg-muted/40 px-3 sm:px-4 flex items-center justify-between gap-2">
          {/* Mac-style traffic lights & simulated address */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <div className="hidden sm:flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-md bg-background/80 border border-border/60 text-[11px] font-mono text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>app.duesora.com/live-telemetry</span>
            </div>
          </div>

          {/* Interactive Navigation Tabs inside Mockup */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            <button
              type="button"
              onClick={() => handleTabClick("domains")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "domains"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Domains & TLS</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabClick("saas")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "saas"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>SaaS & Seats</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabClick("alerts")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "alerts"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Escalation</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabClick("api")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "api"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>API / CLI</span>
            </button>
          </div>

          {/* Autoplay toggle button */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAutoPlaying((prev) => !prev)}
              title={isAutoPlaying ? "Pause auto-loop" : "Resume auto-loop"}
              className="p-1.5 rounded-lg border border-border/70 text-muted-foreground hover:text-foreground text-[10px] flex items-center gap-1 cursor-pointer"
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px]">Auto-loop</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px]">Paused</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Domains & TLS Live Expiration Ticker */}
        {activeTab === "domains" && (
          <div className="p-4 sm:p-6 space-y-5 animate-in fade-in-50 duration-300">
            {/* Header Telemetry */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-foreground">
                    Domain & TLS Certificate Monitor
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
                    Live Probe Active
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Autonomous ICANN RDAP whois + Automated TLS handshake verification.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  DNSSEC & TLS 1.3 Verified
                </span>
              </div>
            </div>

            {/* Live Ticker Card */}
            <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-base sm:text-lg font-mono font-extrabold text-foreground">
                      duesora.com
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                      GoDaddy DNS • Let&apos;s Encrypt
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Auto-renew armed via ICANN API. Next billing trigger at T-7 days.
                  </p>
                </div>

                {/* Live Countdown Clock */}
                <div className="flex items-center gap-2 bg-background/90 p-2.5 rounded-xl border border-border/80 shadow-2xs">
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-bold text-foreground">
                    <span className="px-1.5 py-0.5 rounded bg-muted/80">{days}d</span>:
                    <span className="px-1.5 py-0.5 rounded bg-muted/80">
                      {String(hours).padStart(2, "0")}h
                    </span>:
                    <span className="px-1.5 py-0.5 rounded bg-muted/80">
                      {String(minutes).padStart(2, "0")}m
                    </span>:
                    <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                      {String(seconds).padStart(2, "0")}s
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold ml-1">
                    Remaining
                  </span>
                </div>
              </div>

              {/* Progress timeline */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>Cycle Progress (Yearly: May 20, 2025 &rarr; May 20, 2026)</span>
                  <span className="text-emerald-600 dark:text-emerald-400">96.8% Elapsed</span>
                </div>
                <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                  <div className="bg-linear-to-r from-emerald-500 to-amber-500 h-full rounded-full w-[96.8%]" />
                </div>
              </div>
            </div>

            {/* Domain Ledger Mini List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: "api.duesora.dev", registrar: "Cloudflare", expires: "Jun 14, 2026", cost: "$9.15/yr", status: "Healthy" },
                { name: "duesora.org", registrar: "Namecheap", expires: "Aug 02, 2026", cost: "$14.48/yr", status: "Healthy" },
                { name: "staging.duesora.app", registrar: "AWS Route 53", expires: "Jul 10, 2026", cost: "$12.00/yr", status: "Auto-renew" },
              ].map((domain) => (
                <div key={domain.name} className="p-3 rounded-xl border border-border/70 bg-card space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="font-mono text-[11px] truncate">{domain.name}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">{domain.status}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{domain.registrar}</span>
                    <span className="font-semibold text-foreground">{domain.cost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: SaaS & Seat Burn (Ramp Style) */}
        {activeTab === "saas" && (
          <div className="p-4 sm:p-6 space-y-5 animate-in fade-in-50 duration-300">
            {/* Ramp-style Metric Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-foreground">
                    SaaS Seat Leakage & Burn Telemetry
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/40">
                    Ramp-Inspired Intelligence
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Detect zombie seats, unassigned licenses, and auto-renewals before card billing.
                </p>
              </div>

              {/* Currency Selector */}
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 text-xs">
                {(["USD", "EUR", "GBP", "INR"] as const).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setActiveCurrency(curr)}
                    className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      activeCurrency === curr
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            {/* Ramp KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Monthly SaaS Burn</span>
                <p className="text-xl sm:text-2xl font-black text-foreground">
                  {optimizedSeats ? "$176.00" : "$206.00"}
                </p>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" />
                  {optimizedSeats ? "Saved $30/mo" : "3 Unused Seats Found"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Annual Run-Rate</span>
                <p className="text-xl sm:text-2xl font-black text-foreground">
                  {currencyRates[activeCurrency].formatted}
                </p>
                <span className="text-[10px] text-muted-foreground font-semibold">100% Integer Cents</span>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Renewal Decisions</span>
                <p className="text-xl sm:text-2xl font-black text-foreground">12 / 12</p>
                <span className="text-[10px] text-emerald-600 font-semibold">All Contracts Audited</span>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Actionable Savings</span>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {optimizedSeats ? "$0.00 Waste" : "$360.00 / yr"}
                </p>
                <span className="text-[10px] text-muted-foreground font-semibold">Click optimize below</span>
              </div>
            </div>

            {/* Interactive Seat Optimization Table */}
            <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/30 border-b border-border/60 flex items-center justify-between text-xs font-bold text-muted-foreground">
                <span>Contract & Seats</span>
                <span>Billing Status</span>
                <span>Decision Action</span>
              </div>

              <div className="divide-y divide-border/60 text-xs">
                {/* Figma */}
                <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-foreground">Figma Organization</span>
                    <p className="text-[11px] text-muted-foreground">
                      {optimizedSeats ? "18 / 18 seats active (Optimized)" : "18 active / 24 paid seats (6 idle)"}
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-foreground">
                    {optimizedSeats ? "$60.00/mo" : "$90.00/mo"}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setOptimizedSeats((prev) => !prev)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        optimizedSeats
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40"
                          : "bg-amber-500 hover:bg-amber-600 text-white shadow-2xs"
                      }`}
                    >
                      {optimizedSeats ? "✓ 6 Seats Trimmed" : "Trim 6 Idle Seats (-$30)"}
                    </button>
                  </div>
                </div>

                {/* Google Workspace */}
                <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-foreground">Google Workspace Enterprise</span>
                    <p className="text-[11px] text-muted-foreground">12 / 12 seats utilized across engineering</p>
                  </div>
                  <div className="text-xs font-semibold text-foreground">$72.00/mo</div>
                  <div>
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      Approved • Keep
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Auto Escalation (Supabase-Style Live Alert Simulator) */}
        {activeTab === "alerts" && (
          <div className="p-4 sm:p-6 space-y-5 animate-in fade-in-50 duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-foreground">
                    Multi-Stage Escalation Ladder
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
                    Live Demo Simulator
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Proactive reminders dispatched across 3 stages: 30 days, 7 days, and 24 hours.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTriggerAlert}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simulate Renewal Alert</span>
              </button>
            </div>

            {/* Simulated Live Alert Toast if clicked */}
            {simulatedAlertSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Dispatched webhook payload to <strong>#devops</strong> Slack &amp; Discord in <strong>24ms</strong>!
                  </span>
                </span>
                <span className="text-[10px] font-mono opacity-80">HTTP 200 OK</span>
              </div>
            )}

            {/* 3 Escalation Stages Visual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Stage 1 */}
              <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">T-30 Days</span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    Completed
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground">Executive Email Digest</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Monthly summary sent to CFO &amp; workspace owners listing all upcoming contracts.
                </p>
              </div>

              {/* Stage 2 */}
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">T-7 Days</span>
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                    Active Channel
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground">Slack &amp; Discord Webhook</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  High-visibility alert in team channel with 1-click renewal approval or cancel link.
                </p>
              </div>

              {/* Stage 3 */}
              <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">T-24 Hours</span>
                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Armed
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground">Emergency Pager &amp; Push</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Critical escalation to prevent production domains or TLS certificates dropping offline.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: REST API & CLI (Supabase Developer Experience) */}
        {activeTab === "api" && (
          <div className="p-4 sm:p-6 space-y-5 animate-in fade-in-50 duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-foreground">
                    Public REST API v1 &amp; CLI SDK
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
                    OpenAPI 3.1
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Automate renewal checks directly in GitHub Actions, Terraform, or internal DevOps bots.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyCli}
                className="px-3 py-1.5 rounded-xl border border-border/80 bg-background hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Copy cURL</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Block Window */}
            <div className="rounded-xl border border-border/70 bg-zinc-950 text-zinc-100 p-4 font-mono text-xs overflow-x-auto space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pb-2 border-b border-zinc-800">
                <span>GET /api/v1/renewals?withinDays=30</span>
                <span className="text-emerald-400">Status: 200 OK (14ms)</span>
              </div>
              <pre className="text-[11px] leading-relaxed text-zinc-300">
{`{
  "totalDue": 12,
  "currency": "USD",
  "renewals": [
    {
      "id": "res_godaddy_01",
      "name": "duesora.com",
      "category": "domain",
      "renewalDate": "2026-05-20T00:00:00Z",
      "daysRemaining": 11,
      "amountMinor": 1299,
      "status": "active"
    }
  ]
}`}
              </pre>
            </div>
          </div>
        )}

        {/* Bottom Status Ticker Ribbon */}
        <div className="h-10 border-t border-border/60 bg-muted/30 px-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>32 Assets In Sync</span>
            </span>
            <span className="hidden sm:inline-block text-border">|</span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <span>Next Check:</span>
              <strong className="text-foreground font-mono">00:04:12</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer">
              Explore API Docs &rarr;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
