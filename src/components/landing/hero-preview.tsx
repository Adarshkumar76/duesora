"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  RefreshCw,
  Bell,
  CheckCircle2,
  Play,
  Pause,
  Copy,
  Check,
  Zap,
  TrendingDown,
  ShieldCheck,
  Clock,
  Terminal,
  Activity,
  RotateCcw,
} from "lucide-react";

type DemoStep = "domains" | "saas" | "alerts" | "ledger";

export function HeroPreview() {
  const [activeStep, setActiveStep] = useState<DemoStep>("domains");
  const [isPlaying, setIsPlaying] = useState(true);
  const [stepProgress, setStepProgress] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [simulatedAlertSuccess, setSimulatedAlertSuccess] = useState(false);
  const [activeCurrency, setActiveCurrency] = useState<"USD" | "EUR" | "GBP" | "INR">("USD");
  const [optimizedSeats, setOptimizedSeats] = useState(false);

  // Live countdown ticker simulation for domain expiration (11 days, 14h, 22m, ticking down)
  const [secondsRemaining, setSecondsRemaining] = useState(1002145);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 1002145));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const days = Math.floor(secondsRemaining / 86400);
  const hours = Math.floor((secondsRemaining % 86400) / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  // Auto-playing simulation loop with smooth step progress filling
  useEffect(() => {
    if (!isPlaying) return;

    const stepDurationMs = 6500;
    const intervalTickMs = 50;
    const increment = (intervalTickMs / stepDurationMs) * 100;

    const interval = setInterval(() => {
      setStepProgress((prev) => {
        if (prev + increment >= 100) {
          setActiveStep((current) => {
            if (current === "domains") return "saas";
            if (current === "saas") return "alerts";
            if (current === "alerts") return "ledger";
            return "domains";
          });
          return 0;
        }
        return prev + increment;
      });
    }, intervalTickMs);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleStepClick = (step: DemoStep) => {
    setActiveStep(step);
    setStepProgress(0);
    setIsPlaying(false);
  };

  const handleReplay = () => {
    setStepProgress(0);
    setIsPlaying(true);
  };

  const handleTriggerAlert = () => {
    setSimulatedAlertSuccess(true);
    setTimeout(() => setSimulatedAlertSuccess(false), 5000);
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText("curl -s https://api.duesora.com/v1/renewals -H 'Authorization: Bearer ds_live_...'");
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const currencyRates = {
    USD: { symbol: "$", rate: 1.0, formatted: "$1,248.00" },
    EUR: { symbol: "€", rate: 0.92, formatted: "€1,148.16" },
    GBP: { symbol: "£", rate: 0.79, formatted: "£985.92" },
    INR: { symbol: "₹", rate: 86.5, formatted: "₹1,07,952" },
  };

  const stepsList: { id: DemoStep; label: string; icon: typeof Globe; tag: string }[] = [
    { id: "domains", label: "01. ICANN & TLS Probe", icon: Globe, tag: "RDAP" },
    { id: "saas", label: "02. SaaS Seat Audit", icon: RefreshCw, tag: "Seats" },
    { id: "alerts", label: "03. Escalation Rules", icon: Bell, tag: "Webhook" },
    { id: "ledger", label: "04. Precision Ledger", icon: Activity, tag: "Integer" },
  ];

  return (
    <div className="w-full rounded-[8px] border border-border bg-card text-card-foreground shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-all">
      {/* Console Top Bar */}
      <div className="border-b border-border bg-muted/30 px-3.5 py-2.5 space-y-2">
        <div className="flex items-center justify-between gap-3">
          {/* Status Indicator & Endpoint */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="font-mono text-xs font-semibold text-foreground truncate">
              console.duesora.internal
            </span>
            <span className="hidden sm:inline-block text-border">/</span>
            <span className="hidden sm:inline-block font-mono text-[11px] text-muted-foreground truncate">
              v1.0.4-audit
            </span>
          </div>

          {/* Player controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              title={isPlaying ? "Pause walkthrough" : "Play walkthrough"}
              className="h-7 px-2.5 rounded-[5px] border border-border bg-card text-foreground hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3 text-primary" />
                  <span className="text-[11px]">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-primary" />
                  <span className="text-[11px]">Play</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReplay}
              title="Restart walkthrough"
              className="h-7 w-7 rounded-[5px] border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Step Scrubber Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
          {stepsList.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(step.id)}
                className={`text-left px-2.5 py-2 rounded-[6px] border transition-colors cursor-pointer ${
                  isActive
                    ? "bg-card border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                    : "border-transparent bg-transparent hover:bg-card/50 text-muted-foreground"
                }`}
              >
                {/* Micro Progress Line */}
                <div className="w-full bg-muted h-0.5 rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full transition-all duration-75 ${
                      isActive ? "bg-primary" : "bg-transparent"
                    }`}
                    style={{ width: isActive ? `${stepProgress}%` : "0%" }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`truncate flex items-center gap-1.5 font-medium ${isActive ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                    <Icon className="w-3 h-3 text-primary shrink-0" />
                    <span className="truncate text-[11px]">{step.label}</span>
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground hidden lg:inline">
                    {step.tag}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= STEP 1: DOMAIN & TLS RADAR PROBE ================= */}
      {activeStep === "domains" && (
        <div className="p-4 sm:p-5 space-y-4 animate-subtle-fade text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/80">
            <div>
              <h4 className="text-sm font-semibold tracking-tight text-foreground">
                Authoritative ICANN RDAP &amp; TLS Handshake Engine
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sub-second RDAP queries, TLS 1.3 certificate status, and registrar renewal state.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>TLS 1.3 · Valid Chain</span>
            </div>
          </div>

          {/* Primary Asset Inspection Panel */}
          <div className="p-3.5 rounded-[6px] border border-border bg-muted/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-foreground">duesora.com</span>
                  <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono bg-card text-foreground border border-border">
                    GoDaddy · RDAP 200
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Armed for automatic registrar renewal at T-7 days. ICANN expiration in 11 days.
                </p>
              </div>

              {/* Exact Countdown Ticker */}
              <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-[6px] border border-border shrink-0">
                <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="font-mono text-xs tabular-nums text-foreground flex items-center gap-1 font-semibold">
                  <span>{days}d</span>
                  <span className="text-muted-foreground">:</span>
                  <span>{String(hours).padStart(2, "0")}h</span>
                  <span className="text-muted-foreground">:</span>
                  <span>{String(minutes).padStart(2, "0")}m</span>
                  <span className="text-muted-foreground">:</span>
                  <span className="text-primary font-bold">{String(seconds).padStart(2, "0")}s</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase ml-1">Due</span>
              </div>
            </div>

            {/* Verification Stream Terminal */}
            <div className="bg-zinc-950 dark:bg-black rounded-[6px] p-2.5 font-mono text-[11px] text-zinc-300 space-y-1 border border-zinc-800">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-zinc-800/80 pb-1">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-primary" />
                  <span>authoritative_stream.rdap</span>
                </span>
                <span className="tabular-nums text-zinc-400">RTT: 18ms</span>
              </div>
              <div className="space-y-0.5 pt-0.5 text-zinc-400">
                <p>
                  <span className="text-emerald-400">&gt;</span> query whois.verisign-grs.com [duesora.com] → <span className="text-emerald-400">200 OK</span>
                </p>
                <p>
                  <span className="text-emerald-400">&gt;</span> tls_handshake: SAN *.duesora.com · TLS_AES_256_GCM_SHA384
                </p>
                <p>
                  <span className="text-emerald-400">&gt;</span> expiry: 2026-05-20T00:00:00Z · escalation queue armed
                </p>
              </div>
            </div>

            {/* Cycle Meter */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Billing cycle elapsed (Yearly)</span>
                <span className="tabular-nums font-mono font-medium text-foreground">96.8%</span>
              </div>
              <div className="w-full bg-border/60 h-1 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full w-[96.8%]" />
              </div>
            </div>
          </div>

          {/* Monitored Assets Table */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { name: "api.duesora.dev", registrar: "Cloudflare", expires: "Jun 14, 2026", cost: "$9.15/yr", status: "Healthy" },
              { name: "duesora.org", registrar: "Namecheap", expires: "Aug 02, 2026", cost: "$14.48/yr", status: "Healthy" },
              { name: "staging.duesora.app", registrar: "Route 53", expires: "Jul 10, 2026", cost: "$12.00/yr", status: "Auto-renew" },
            ].map((domain) => (
              <div key={domain.name} className="p-2.5 rounded-[6px] border border-border bg-card space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] font-semibold text-foreground truncate">{domain.name}</span>
                  <span className="text-[10px] text-primary font-medium">{domain.status}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{domain.registrar}</span>
                  <span className="font-mono tabular-nums text-foreground">{domain.cost}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= STEP 2: SAAS SEAT WASTE & OPTIMIZER ================= */}
      {activeStep === "saas" && (
        <div className="p-4 sm:p-5 space-y-4 animate-subtle-fade text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/80">
            <div>
              <h4 className="text-sm font-semibold tracking-tight text-foreground">
                Autonomous SaaS Seat &amp; License Audit
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Surfaces unassigned seats, idle member accounts, and pending renewal deadlines.
              </p>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-[6px] border border-border text-xs">
              {(["USD", "EUR", "GBP", "INR"] as const).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setActiveCurrency(curr)}
                  className={`px-2 py-0.5 rounded-[4px] text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                    activeCurrency === curr
                      ? "bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.03)] font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {/* Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-3 rounded-[6px] border border-border bg-card space-y-0.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Monthly Burn</span>
              <p className="text-lg font-bold font-mono tabular-nums text-foreground">
                {optimizedSeats ? "$176.00" : "$206.00"}
              </p>
              <span className="text-[10px] text-primary font-medium flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" />
                {optimizedSeats ? "Saved $30/mo" : "6 Idle Seats"}
              </span>
            </div>

            <div className="p-3 rounded-[6px] border border-border bg-card space-y-0.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Annual Run-Rate</span>
              <p className="text-lg font-bold font-mono tabular-nums text-foreground">
                {currencyRates[activeCurrency].formatted}
              </p>
              <span className="text-[10px] text-muted-foreground font-mono">100% exact</span>
            </div>

            <div className="p-3 rounded-[6px] border border-border bg-card space-y-0.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Audited</span>
              <p className="text-lg font-bold font-mono tabular-nums text-foreground">12 / 12</p>
              <span className="text-[10px] text-primary font-medium">Compliant</span>
            </div>

            <div className="p-3 rounded-[6px] border border-border bg-card space-y-0.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Preventable Waste</span>
              <p className="text-lg font-bold font-mono tabular-nums text-primary">
                {optimizedSeats ? "$0.00" : "$360.00 / yr"}
              </p>
              <span className="text-[10px] text-muted-foreground font-medium">
                {optimizedSeats ? "Optimized" : "Action ready"}
              </span>
            </div>
          </div>

          {/* Interactive Seat Optimizer Ledger */}
          <div className="rounded-[6px] border border-border bg-card overflow-hidden">
            <div className="px-3 py-2 bg-muted/30 border-b border-border/80 flex items-center justify-between text-[11px] font-mono text-muted-foreground uppercase">
              <span>Subscription &amp; Team Licenses</span>
              <span>Billing Rate</span>
              <span>Optimization</span>
            </div>

            <div className="divide-y divide-border/60 text-xs">
              <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Figma Organization Plan</span>
                    <span className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono border ${
                      optimizedSeats
                        ? "bg-muted text-primary border-primary/30"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                    }`}>
                      {optimizedSeats ? "6 Seats Trimmed" : "6 Idle Seats Flagged"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {optimizedSeats ? "18 / 18 seats active (Optimized)" : "18 active / 24 paid seats (6 idle for >45d)"}
                  </p>
                </div>
                <div className="font-mono text-xs tabular-nums text-foreground font-semibold">
                  {optimizedSeats ? "$60.00/mo" : "$90.00/mo"}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setOptimizedSeats((prev) => !prev)}
                    className={`h-7 px-2.5 rounded-[5px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      optimizedSeats
                        ? "bg-card border border-border text-foreground hover:bg-muted"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    <span>{optimizedSeats ? "Reset" : "Trim 6 Idle Seats (-$30/mo)"}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-foreground">Google Workspace Enterprise</span>
                  <p className="text-[11px] text-muted-foreground">12 / 12 seats utilized across engineering</p>
                </div>
                <div className="font-mono text-xs tabular-nums text-foreground font-semibold">$72.00/mo</div>
                <div>
                  <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono text-primary bg-primary/10 border border-primary/20">
                    Approved · Keep
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 3: AUTONOMOUS ESCALATION ENGINE ================= */}
      {activeStep === "alerts" && (
        <div className="p-4 sm:p-5 space-y-4 animate-subtle-fade text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/80">
            <div>
              <h4 className="text-sm font-semibold tracking-tight text-foreground">
                Multi-Stage Escalation Ladder
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automated notification triggers dispatched at T-30d, T-7d, and T-24h.
              </p>
            </div>

            <button
              type="button"
              onClick={handleTriggerAlert}
              className="h-7 px-2.5 rounded-[5px] bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors cursor-pointer"
            >
              <Zap className="w-3 h-3" />
              <span>Trigger Test Dispatch</span>
            </button>
          </div>

          {/* Webhook notification payload preview */}
          <div className="rounded-[6px] border border-border bg-card p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-border/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs font-semibold text-foreground">#finance-renewals</span>
                <span className="text-[10px] text-muted-foreground">· Slack Incoming Webhook</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-muted text-muted-foreground border border-border">
                HTTP 200 · 24ms
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  T-7 Days Critical
                </span>
                <p className="text-xs font-semibold text-foreground">
                  AWS Production RDS Multi-AZ Renewal
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Annual commitment renewal scheduled for <strong className="text-foreground font-mono tabular-nums">$1,374.00/yr</strong> on June 1st.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTriggerAlert}
                className="h-7 px-2.5 rounded-[5px] bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Confirm Renewal</span>
              </button>
              <button
                type="button"
                className="h-7 px-2.5 rounded-[5px] border border-border text-foreground hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
              >
                Decommission
              </button>
            </div>

            {simulatedAlertSuccess && (
              <div className="p-2 rounded-[5px] bg-muted text-primary text-xs font-medium flex items-center gap-2 border border-border animate-subtle-fade">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Decision confirmed and logged to immutable audit ledger.</span>
              </div>
            )}
          </div>

          {/* 3 Escalation Stages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="p-3 rounded-[6px] border border-border bg-card space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-foreground">T-30 Days</span>
                <span className="text-[10px] font-mono text-primary">Completed</span>
              </div>
              <p className="text-xs font-medium text-foreground">Executive Digest</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Monthly cost forecast delivered to finance and workspace owners.
              </p>
            </div>

            <div className="p-3 rounded-[6px] border border-border bg-card space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-foreground">T-7 Days</span>
                <span className="text-[10px] font-mono text-amber-600 font-medium">Active</span>
              </div>
              <p className="text-xs font-medium text-foreground">Team Webhook</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Slack and Discord dispatch with 1-click renewal approval.
              </p>
            </div>

            <div className="p-3 rounded-[6px] border border-border bg-card space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-foreground">T-24 Hours</span>
                <span className="text-[10px] font-mono text-muted-foreground">Armed</span>
              </div>
              <p className="text-xs font-medium text-foreground">Emergency Pager</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Critical alerts to prevent production domains and certificates expiring.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 4: INTEGER-PRECISION LEDGER & CLI ================= */}
      {activeStep === "ledger" && (
        <div className="p-4 sm:p-5 space-y-4 animate-subtle-fade text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/80">
            <div>
              <h4 className="text-sm font-semibold tracking-tight text-foreground">
                Deterministic Integer-Cents Ledger &amp; API
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Stored as exact minor units (integer cents) to eliminate IEEE 754 rounding drift.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyCli}
              className="h-7 px-2.5 rounded-[5px] border border-border bg-card hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3 h-3 text-primary" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-muted-foreground" />
                  <span>Copy cURL</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Spend Projection */}
            <div className="md:col-span-2 p-3.5 rounded-[6px] border border-border bg-card space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-foreground">12-Month Run-Rate Projection</span>
                  <p className="text-[11px] text-muted-foreground">Deterministic billing trend</p>
                </div>
                <span className="text-xs font-mono font-bold tabular-nums text-foreground">
                  $14,976.00 / yr
                </span>
              </div>

              {/* Clean Minimal Sparkline */}
              <div className="h-20 w-full pt-1">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 80" preserveAspectRatio="none">
                  <path
                    d="M 0,65 Q 80,60 140,45 T 280,38 T 380,20 T 500,16 L 500,80 L 0,80 Z"
                    fill="currentColor"
                    className="text-primary/10"
                  />
                  <path
                    d="M 0,65 Q 80,60 140,45 T 280,38 T 380,20 T 500,16"
                    fill="none"
                    stroke="#0F766E"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="380" cy="20" r="3" fill="#0F766E" />
                </svg>
              </div>
            </div>

            {/* Schema breakdown */}
            <div className="p-3.5 rounded-[6px] border border-border bg-card space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-foreground">PostgreSQL Schema</span>
                <div className="mt-2 space-y-1 font-mono text-[11px]">
                  <div className="p-1.5 rounded-[4px] bg-muted/50 flex justify-between">
                    <span className="text-muted-foreground">amount_minor:</span>
                    <strong className="text-foreground tabular-nums">124800</strong>
                  </div>
                  <div className="p-1.5 rounded-[4px] bg-muted/50 flex justify-between">
                    <span className="text-muted-foreground">currency:</span>
                    <strong className="text-primary">USD</strong>
                  </div>
                  <div className="p-1.5 rounded-[4px] bg-muted/50 flex justify-between">
                    <span className="text-muted-foreground">penny_drift:</span>
                    <strong className="text-foreground tabular-nums">0.00</strong>
                  </div>
                </div>
              </div>
              <div className="p-1.5 rounded-[4px] bg-muted text-[10px] text-muted-foreground font-mono">
                ISO 4217 Decimal Integrity
              </div>
            </div>
          </div>

          {/* JSON REST API Response Block */}
          <div className="rounded-[6px] border border-border bg-zinc-950 dark:bg-black text-zinc-200 p-3 font-mono text-xs overflow-x-auto space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-500 pb-1.5 border-b border-zinc-800">
              <span>GET /api/v1/renewals?withinDays=30</span>
              <span className="text-emerald-400">200 OK · 14ms</span>
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

      {/* Bottom Status Ribbon */}
      <div className="h-9 border-t border-border bg-muted/20 px-3.5 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-foreground font-medium text-[11px]">32 Monitored Assets Active</span>
          <span className="text-border">·</span>
          <span className="text-[11px]">Next probe in <span className="font-mono tabular-nums font-semibold text-foreground">00:04:12</span></span>
        </div>

        <Link href="/api/docs" className="text-[11px] font-medium text-primary hover:underline">
          API Specs &rarr;
        </Link>
      </div>
    </div>
  );
}
