"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  Database,
  Bell,
  CheckCircle2,
  Terminal,
  Shield,
  Zap,
  ArrowRight,
  Server,
  Cpu,
} from "lucide-react";

export function TelemetryPipeline() {
  const [activeStep, setActiveStep] = useState(0);

  // Live streaming log lines
  const [logs, setLogs] = useState<string[]>([
    "02:14:02 [PROBE] duesora.com ICANN RDAP whois query -> 200 OK (22ms)",
    "02:14:03 [TLS] Handshake: Let's Encrypt R10 (Valid 78 days remaining)",
    "02:14:04 [LEDGER] Converted amountMinor: 1299 USD -> Deterministic ledger updated",
    "02:14:05 [RULES] Cycle check: 11 days remaining -> Armed for T-7d webhook",
  ]);

  useEffect(() => {
    const pipelineTimer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2800);

    return () => clearInterval(pipelineTimer);
  }, []);

  useEffect(() => {
    const logInterval = setInterval(() => {
      const now = new Date().toTimeString().split(" ")[0];
      const mockEvents = [
        `${now} [PROBE] api.duesora.dev -> Cloudflare Edge OK (14ms)`,
        `${now} [DNSSEC] Validation status: SECURE (Algorithm 13 ECDSAP256SHA256)`,
        `${now} [SEATS] Figma Org: 18/24 active licenses -> Flagged 6 idle seats`,
        `${now} [ACME] *.duesora.com wildcard cert auto-renew verified`,
        `${now} [DISPATCH] Slack #devops webhook payload 200 OK (19ms)`,
      ];
      const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
      setLogs((prev) => [randomEvent, ...prev.slice(0, 4)]);
    }, 3200);

    return () => clearInterval(logInterval);
  }, []);

  const steps = [
    {
      title: "1. Global Expiry Probes",
      subtitle: "Autonomous RDAP & TLS",
      description: "Sub-second ICANN whois checks and automated TLS certificate validation across registrars.",
      icon: Globe,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    },
    {
      title: "2. Deterministic Ledger",
      subtitle: "PostgreSQL Minor Math",
      description: "Integer math prevents penny rounding drift across USD, EUR, GBP, and INR.",
      icon: Database,
      color: "text-teal-500",
      bg: "bg-teal-500/10",
      border: "border-teal-500/30",
    },
    {
      title: "3. Escalation Rules",
      subtitle: "Multi-Stage Timing",
      description: "T-30d executive digest, T-14d Slack/Discord notification, and T-24h emergency pager.",
      icon: Bell,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
    },
    {
      title: "4. Autonomous Dispatch",
      subtitle: "Webhooks & 1-Click Renew",
      description: "Push alerts to team channels with 1-click renewal approval or seat trimming action.",
      icon: Zap,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    },
  ];

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Supabase &amp; Ramp Architecture
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Autonomous telemetry in constant motion
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Watch how Duesora scans, calculates, and escalates renewals in real time without human intervention.
        </p>
      </div>

      {/* 4 Interactive Pipeline Stages */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCurrent = activeStep === idx;

          return (
            <div
              key={step.title}
              onClick={() => setActiveStep(idx)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-4 ${
                isCurrent
                  ? "border-emerald-500 bg-card shadow-xl shadow-emerald-500/10 scale-102"
                  : "border-border/70 bg-card/60 hover:bg-card hover:border-border"
              }`}
            >
              {/* Active step glow aura */}
              {isCurrent && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-2xl ${step.bg} ${step.color} flex items-center justify-center shrink-0 border ${step.border}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {isCurrent ? (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Cycle
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Step 0{idx + 1}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-foreground">{step.title}</h4>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {step.subtitle}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Step indicator bar */}
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCurrent ? "bg-emerald-500 w-full" : "bg-transparent w-0"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Streaming Console Terminal (Supabase/Ramp style) */}
      <div className="rounded-3xl border border-border/80 bg-zinc-950 text-zinc-100 overflow-hidden shadow-2xl shadow-black/20">
        <div className="h-10 px-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-zinc-300">
              telemetry.duesora.internal &bull; Live Telemetry Feed
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">
              STREAMING (24ms)
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 font-mono text-xs space-y-2 overflow-x-auto">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 transition-all ${
                index === 0
                  ? "text-emerald-400 font-bold animate-in fade-in slide-in-from-left-2 duration-300"
                  : "text-zinc-400 opacity-80"
              }`}
            >
              <span className="text-zinc-600 select-none">&gt;</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
