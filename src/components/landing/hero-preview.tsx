"use client";

import { useState, useEffect } from "react";
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

  // Auto-playing video simulation loop with smooth step progress filling
  useEffect(() => {
    if (!isPlaying) return;

    const stepDurationMs = 6500;
    const intervalTickMs = 50;
    const increment = (intervalTickMs / stepDurationMs) * 100;

    const interval = setInterval(() => {
      setStepProgress((prev) => {
        if (prev + increment >= 100) {
          // Switch to next step
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

  // Currency symbols & rates
  const currencyRates = {
    USD: { symbol: "$", rate: 1.0, formatted: "$1,248.00" },
    EUR: { symbol: "€", rate: 0.92, formatted: "€1,148.16" },
    GBP: { symbol: "£", rate: 0.79, formatted: "£985.92" },
    INR: { symbol: "₹", rate: 86.5, formatted: "₹1,07,952" },
  };

  const stepsList: { id: DemoStep; label: string; icon: typeof Globe; tag: string }[] = [
    { id: "domains", label: "01. ICANN & TLS Probe", icon: Globe, tag: "Live Handshake" },
    { id: "saas", label: "02. SaaS Waste Detector", icon: RefreshCw, tag: "Seat Audit" },
    { id: "alerts", label: "03. 24ms Escalation", icon: Bell, tag: "Slack Webhook" },
    { id: "ledger", label: "04. Precision Ledger", icon: Activity, tag: "Zero Drift" },
  ];

  return (
    <div className="relative mx-auto max-w-5xl rounded-3xl p-1.5 sm:p-3 bg-linear-to-b from-emerald-500/25 via-border/50 to-border/20 border border-emerald-500/30 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl">
      {/* Ambient Glow Blob */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/15 blur-3xl rounded-full pointer-events-none -z-10" />

      {/* Floating Micro-Card 1: Unused Seat Trim */}
      <div className="hidden lg:flex absolute -left-10 top-28 z-20 items-center gap-3 p-3 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-xl shadow-black/10 animate-float-slow">
        <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <TrendingDown className="w-4 h-4" />
        </div>
        <div className="text-left space-y-0.5">
          <p className="text-[11px] font-bold text-foreground">Duesora Seat Optimizer</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Trimmed 6 idle seats &bull; -$360/yr</p>
        </div>
      </div>

      {/* Floating Micro-Card 2: Sub-second Escalation */}
      <div className="hidden lg:flex absolute -right-10 bottom-16 z-20 items-center gap-3 p-3 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-xl shadow-black/10 animate-float-reverse">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4" />
        </div>
        <div className="text-left space-y-0.5">
          <p className="text-[11px] font-bold text-foreground">Autonomous Escalation</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Slack &bull; Discord &bull; 24ms</p>
        </div>
      </div>

      {/* Main Glass Mockup Window */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-inner">
        {/* Top Control Bar: Video Player / Interactive Simulator Mode */}
        <div className="border-b border-border/60 bg-muted/40 px-3 sm:px-4 py-2 space-y-2">
          {/* Top Row: Browser Controls + Live Simulator Badge */}
          <div className="flex items-center justify-between gap-2">
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

            {/* Video-style Live Simulation Badge & Controls */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Simulation Demo</span>
              </div>

              <button
                type="button"
                onClick={() => setIsPlaying((prev) => !prev)}
                title={isPlaying ? "Pause Video Walkthrough" : "Play Video Walkthrough"}
                className="p-1 px-2 rounded-lg border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3 h-3 text-emerald-500" />
                    <span className="hidden sm:inline">Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-emerald-500" />
                    <span className="hidden sm:inline">Play</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReplay}
                title="Restart Walkthrough"
                className="p-1 rounded-lg border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Bottom Row: Story Progress Scrubbers (Instagram/Ramp Video Style) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {stepsList.map((step) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  className={`text-left p-1.5 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? "bg-background/90 border-emerald-500/40 shadow-xs"
                      : "border-transparent hover:bg-background/40 opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* Progress Line */}
                  <div className="w-full bg-muted h-1 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full transition-all duration-75 ${
                        isActive
                          ? "bg-emerald-500"
                          : activeStep !== step.id
                          ? "bg-transparent"
                          : "bg-emerald-500/40"
                      }`}
                      style={{
                        width: isActive ? `${stepProgress}%` : "0%",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className={`truncate flex items-center gap-1 ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      <Icon className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="truncate">{step.label}</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground hidden sm:inline-block">
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
          <div className="p-4 sm:p-6 space-y-5 animate-in fade-in-50 duration-300">
            {/* Header Telemetry */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-foreground">
                    Autonomous ICANN RDAP &amp; TLS Handshake Engine
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
                    60 FPS Telemetry
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Probes registry RDAP endpoints and validates SSL/TLS handshake certificates automatically.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  DNSSEC &amp; TLS 1.3 Verified
                </span>
              </div>
            </div>

            {/* Radar Simulation & Live Ticker Card */}
            <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-4">
              {/* Laser Scan Beam */}
              <div className="absolute inset-x-0 h-0.5 bg-linear-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.9)] pointer-events-none animate-scan-beam" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Radar Scanner Graphic */}
                  <div className="relative w-14 h-14 rounded-full border border-emerald-500/40 bg-zinc-950/80 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                    <div className="absolute inset-0 rounded-full border border-emerald-500/20 scale-75" />
                    <div className="absolute inset-0 rounded-full border border-emerald-500/20 scale-50" />
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-emerald-500/20 to-emerald-400/40 animate-radar-sweep pointer-events-none" />
                    <Globe className="w-6 h-6 text-emerald-400 relative z-10" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-base sm:text-lg font-mono font-extrabold text-foreground">
                        duesora.com
                      </span>
                      <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                        ICANN RDAP &bull; TLS 1.3
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Auto-renew armed via registrar API. Next scheduled billing trigger at T-7 days.
                    </p>
                  </div>
                </div>

                {/* Live Countdown Clock */}
                <div className="flex items-center gap-2 bg-background/90 p-2.5 rounded-xl border border-border/80 shadow-2xs shrink-0">
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

              {/* Real-time Probe Terminal Stream */}
              <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800 font-mono text-[11px] text-zinc-300 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-zinc-800 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3 h-3 text-emerald-400" />
                    <span>Live Verification Stream</span>
                  </span>
                  <span className="text-emerald-400">Latency: 18ms</span>
                </div>
                <div className="pt-1 space-y-0.5 text-zinc-400">
                  <p className="text-zinc-200">
                    <span className="text-emerald-400">&gt;</span> [RDAP] Querying whois.verisign-grs.com for duesora.com... <span className="text-emerald-400 font-bold">200 OK</span>
                  </p>
                  <p>
                    <span className="text-emerald-400">&gt;</span> [TLS] Handshake: SAN *.duesora.com, Cipher: TLS_AES_256_GCM_SHA384
                  </p>
                  <p>
                    <span className="text-emerald-400">&gt;</span> [EXPIRY] Valid until 2026-05-20T00:00:00Z &bull; Escalation armed at T-30d
                  </p>
                </div>
              </div>

              {/* Progress timeline */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>Cycle Progress (Yearly: May 20, 2025 &rarr; May 20, 2026)</span>
                  <span className="text-emerald-600 dark:text-emerald-400">96.8% Elapsed</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div className="bg-linear-to-r from-emerald-500 to-amber-500 h-full rounded-full w-[96.8%]" />
                </div>
              </div>
            </div>

            {/* Monitored Assets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: "api.duesora.dev", registrar: "Cloudflare", expires: "Jun 14, 2026", cost: "$9.15/yr", status: "Healthy" },
                { name: "duesora.org", registrar: "Namecheap", expires: "Aug 02, 2026", cost: "$14.48/yr", status: "Healthy" },
                { name: "staging.duesora.app", registrar: "Route 53", expires: "Jul 10, 2026", cost: "$12.00/yr", status: "Auto-renew" },
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

        {/* ================= STEP 2: SAAS SEAT WASTE & OPTIMIZER ================= */}
        {activeStep === "saas" && (
          <div className="p-4 sm:p-6 space-y-5 animate-in fade-in-50 duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-foreground">
                    Autonomous SaaS Seat &amp; License Audit
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/40">
                    Waste Detection
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Identifies zombie seats, dormant team accounts, and contract renewals before card charging.
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

            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Monthly SaaS Burn</span>
                <p className="text-xl sm:text-2xl font-black text-foreground">
                  {optimizedSeats ? "$176.00" : "$206.00"}
                </p>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" />
                  {optimizedSeats ? "Saved $30/mo" : "6 Idle Seats Detected"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Annual Run-Rate</span>
                <p className="text-xl sm:text-2xl font-black text-foreground">
                  {currencyRates[activeCurrency].formatted}
                </p>
                <span className="text-[10px] text-muted-foreground font-semibold">100% Deterministic</span>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Audited Contracts</span>
                <p className="text-xl sm:text-2xl font-black text-foreground">12 / 12</p>
                <span className="text-[10px] text-emerald-600 font-semibold">All Policies Compliant</span>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Actionable Savings</span>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {optimizedSeats ? "$0.00 Waste" : "$360.00 / yr"}
                </p>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {optimizedSeats ? "Optimized" : "1-Click trim ready"}
                </span>
              </div>
            </div>

            {/* Interactive Seat Optimization Table */}
            <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/30 border-b border-border/60 flex items-center justify-between text-xs font-bold text-muted-foreground">
                <span>Contract &amp; Team Licenses</span>
                <span>Billing Rate</span>
                <span>Automated Action</span>
              </div>

              <div className="divide-y divide-border/60 text-xs">
                {/* Figma Contract */}
                <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">Figma Organization Plan</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        optimizedSeats ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700" : "bg-amber-100 dark:bg-amber-950 text-amber-700"
                      }`}>
                        {optimizedSeats ? "6 Seats Trimmed" : "6 Idle Seats Flagged"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {optimizedSeats ? "18 / 18 seats active (Optimized)" : "18 active / 24 paid seats (6 unassigned for >45d)"}
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-foreground">
                    {optimizedSeats ? "$60.00/mo" : "$90.00/mo"}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setOptimizedSeats((prev) => !prev)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        optimizedSeats
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40"
                          : "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{optimizedSeats ? "✓ 6 Seats Trimmed (-$360/yr)" : "Trim 6 Idle Seats (-$30/mo)"}</span>
                    </button>
                  </div>
                </div>

                {/* Google Workspace */}
                <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-foreground">Google Workspace Enterprise</span>
                    <p className="text-[11px] text-muted-foreground">12 / 12 seats utilized across engineering &bull; Zero waste</p>
                  </div>
                  <div className="text-xs font-semibold text-foreground">$72.00/mo</div>
                  <div>
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      Approved &bull; Keep
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: AUTONOMOUS ESCALATION ENGINE ================= */}
        {activeStep === "alerts" && (
          <div className="p-4 sm:p-6 space-y-5 animate-in fade-in-50 duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-foreground">
                    Multi-Stage Escalation Ladder
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
                    24ms Webhook Latency
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Zero surprise renewals. Automated alerts dispatched across 3 stages: 30 days, 7 days, and 24 hours.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTriggerAlert}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simulate Webhook Trigger</span>
              </button>
            </div>

            {/* Simulated Live Incoming Slack / Discord Notification Card */}
            <div className="relative rounded-2xl border border-emerald-500/30 bg-zinc-950 p-4 text-zinc-100 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-zinc-200">#devops-finance-alerts</span>
                  <span className="text-[10px] text-zinc-500">&bull; Slack Incoming Webhook</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  HTTP 200 &bull; 24ms
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    T-7 Days Critical Alert
                  </span>
                  <p className="text-xs font-bold text-zinc-100">
                    AWS Production RDS Multi-AZ Renewal
                  </p>
                </div>
                <p className="text-xs text-zinc-400">
                  Annual contract renewal scheduled for <strong>$1,374.00/yr</strong> on June 1st. Automated decision rule matched:
                </p>
              </div>

              {/* Action buttons inside simulated notification */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={handleTriggerAlert}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>1-Click Approve Renewal</span>
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Decommission / Downgrade
                </button>
              </div>

              {simulatedAlertSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Decision confirmed &amp; logged into Duesora immutable audit ledger!</span>
                  </span>
                </div>
              )}
            </div>

            {/* 3 Escalation Stages */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

        {/* ================= STEP 4: INTEGER-PRECISION LEDGER & CLI ================= */}
        {activeStep === "ledger" && (
          <div className="p-4 sm:p-6 space-y-5 animate-in fade-in-50 duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-foreground">
                    Deterministic Integer-Cents Ledger &amp; REST API
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
                    Zero Float Drift
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Stored as exact minor units (cents) to eliminate IEEE 754 floating-point rounding errors.
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

            {/* Telemetry Visual Graph + Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 p-4 rounded-xl border border-border/70 bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-foreground">Spend Telemetry &amp; Burn Projection</span>
                    <p className="text-[11px] text-muted-foreground">12-Month deterministic curve</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    $14,976.00 / yr
                  </span>
                </div>

                {/* Animated SVG Sparkline */}
                <div className="relative h-28 w-full pt-2">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="ledgerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,80 Q 80,75 140,55 T 280,45 T 380,25 T 500,20 L 500,100 L 0,100 Z"
                      fill="url(#ledgerGrad)"
                    />
                    <path
                      d="M 0,80 Q 80,75 140,55 T 280,45 T 380,25 T 500,20"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* Animated Pulsing Pointer on current point */}
                    <circle cx="380" cy="25" r="4.5" fill="#10b981" className="animate-ping" />
                    <circle cx="380" cy="25" r="4" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
                  </svg>
                </div>
              </div>

              {/* Minor Units Summary */}
              <div className="p-4 rounded-xl border border-border/70 bg-card space-y-2.5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground">Database Storage Schema</span>
                  <div className="mt-2 space-y-1.5 font-mono text-[11px]">
                    <div className="p-2 rounded bg-muted/60 flex justify-between">
                      <span className="text-muted-foreground">amount_minor:</span>
                      <strong className="text-foreground">124800</strong>
                    </div>
                    <div className="p-2 rounded bg-muted/60 flex justify-between">
                      <span className="text-muted-foreground">currency:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">USD</strong>
                    </div>
                    <div className="p-2 rounded bg-muted/60 flex justify-between">
                      <span className="text-muted-foreground">drift_error:</span>
                      <strong className="text-foreground">0.0000</strong>
                    </div>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                  ✓ Passed ISO 4217 Decimal Integrity
                </div>
              </div>
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
              <span>32 Monitored Assets Active</span>
            </span>
            <span className="hidden sm:inline-block text-border">|</span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <span>Next Check In:</span>
              <strong className="text-foreground font-mono">00:04:12</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer">
              Explore Live API Docs &rarr;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
