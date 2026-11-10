"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  Database,
  Bell,
  Terminal,
  Zap,
} from "lucide-react";

export function TelemetryPipeline() {
  const [activeStep, setActiveStep] = useState(0);

  // Live streaming log lines
  const [logs, setLogs] = useState<string[]>([
    "02:14:02 [PROBE] duesora.com ICANN RDAP query → 200 OK (22ms)",
    "02:14:03 [TLS] Handshake: Let's Encrypt R10 (Valid 78 days remaining)",
    "02:14:04 [LEDGER] Converted amountMinor: 1299 USD → Deterministic ledger updated",
    "02:14:05 [RULES] Cycle check: 11 days remaining → Armed for T-7d webhook",
  ]);

  useEffect(() => {
    const pipelineTimer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 3200);

    return () => clearInterval(pipelineTimer);
  }, []);

  useEffect(() => {
    const logInterval = setInterval(() => {
      const now = new Date().toTimeString().split(" ")[0];
      const mockEvents = [
        `${now} [PROBE] api.duesora.dev → Cloudflare Edge OK (14ms)`,
        `${now} [DNSSEC] Validation status: SECURE (Algorithm 13 ECDSAP256SHA256)`,
        `${now} [SEATS] Figma Org: 18/24 active licenses → Flagged 6 idle seats`,
        `${now} [ACME] *.duesora.com wildcard cert auto-renew verified`,
        `${now} [DISPATCH] Slack #finance-alerts webhook payload 200 OK (19ms)`,
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
    },
    {
      title: "2. Deterministic Ledger",
      subtitle: "PostgreSQL Minor Units",
      description: "Exact integer cents prevent penny rounding drift across USD, EUR, GBP, and INR.",
      icon: Database,
    },
    {
      title: "3. Escalation Rules",
      subtitle: "Multi-Stage Timing",
      description: "T-30d executive digest, T-14d Slack notification, and T-24h emergency pager.",
      icon: Bell,
    },
    {
      title: "4. Autonomous Dispatch",
      subtitle: "Webhooks & 1-Click Renew",
      description: "Push alerts to team channels with 1-click renewal approval or seat trimming action.",
      icon: Zap,
    },
  ];

  return (
    <section className="py-14 sm:py-18 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 text-left">
      {/* Editorial Header */}
      <div className="space-y-2 max-w-2xl">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
            Telemetry Architecture
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Autonomous telemetry in constant motion
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Watch how Duesora scans registrars, computes integer balances, and dispatches webhook escalations in real time.
        </p>
      </div>

      {/* Asymmetric Split: 4 Stages on Left, Live Terminal on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: 4 Interactive Pipeline Stages (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCurrent = activeStep === idx;

            return (
              <div
                key={step.title}
                onClick={() => setActiveStep(idx)}
                className={`p-3.5 rounded-[8px] border transition-colors cursor-pointer space-y-1.5 ${
                  isCurrent
                    ? "border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                    : "border-border/60 bg-card/40 hover:bg-card hover:border-border text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                    <h4 className={`text-xs font-semibold ${isCurrent ? "text-foreground font-bold" : "text-foreground/80"}`}>
                      {step.title}
                    </h4>
                  </div>
                  <span className={`text-[10px] font-mono ${isCurrent ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                    {isCurrent ? "Active" : `0${idx + 1}`}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed pl-5.5">
                  {step.description}
                </p>

                {/* Progress hairline */}
                <div className="w-full bg-border/40 h-0.5 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isCurrent ? "bg-primary w-full" : "bg-transparent w-0"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Live Streaming Terminal (7 cols) */}
        <div className="lg:col-span-7 rounded-[8px] border border-border bg-zinc-950 dark:bg-black text-zinc-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col justify-between">
          <div className="h-9 px-3.5 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono font-semibold text-zinc-300">
                telemetry.duesora.internal · stdout
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="tabular-nums">STREAMING · 18ms</span>
            </div>
          </div>

          <div className="p-4 font-mono text-xs space-y-2 flex-1 overflow-x-auto">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 transition-colors ${
                  index === 0
                    ? "text-emerald-400 font-semibold"
                    : "text-zinc-400 opacity-80"
                }`}
              >
                <span className="text-zinc-600 select-none shrink-0">&gt;</span>
                <span className="tabular-nums leading-relaxed">{log}</span>
              </div>
            ))}
          </div>

          <div className="h-8 px-3.5 border-t border-zinc-900 bg-zinc-950/90 flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>Daemon: systemd · worker-01</span>
            <span className="tabular-nums">Load: 0.12 · Mem: 48MB</span>
          </div>
        </div>
      </div>
    </section>
  );
}
