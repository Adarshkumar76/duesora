"use client";

import { Sparkles, Calendar, ArrowUpRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export function HeroPreview() {
  return (
    <div className="relative mx-auto max-w-5xl rounded-3xl p-2 sm:p-3 bg-linear-to-b from-emerald-500/20 via-border/50 to-border/20 border border-emerald-500/30 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl">
      {/* Glow Ambient Blob */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/15 blur-3xl rounded-full pointer-events-none -z-10" />

      {/* App Window Container */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-inner">
        {/* Mock Window Top Bar */}
        <div className="h-10 border-b border-border/60 bg-muted/40 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-400/80 inline-block" />
            <span className="ml-2 text-xs font-semibold text-muted-foreground hidden sm:inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              app.duesora.com/dashboard
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
              Live Preview
            </span>
          </div>
        </div>

        {/* Mock Dashboard Body */}
        <div className="p-4 sm:p-6 space-y-5 bg-background/50">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base sm:text-lg font-bold text-foreground">
                  Workspace Overview
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                  Personal & Client Assets
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                All renewals synchronized across 32 registered resources
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                All Systems Protected
              </span>
            </div>
          </div>

          {/* Mini KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Resources */}
            <div className="p-3.5 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground">Total Resources</p>
              <p className="text-xl sm:text-2xl font-black text-foreground">32</p>
              <p className="text-[10px] text-emerald-600 font-semibold">+4 added this month</p>
            </div>

            {/* Renewals Due */}
            <div className="p-3.5 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground">Renewals Due</p>
              <p className="text-xl sm:text-2xl font-black text-foreground">12</p>
              <p className="text-[10px] text-muted-foreground font-medium">Next: GoDaddy (May 20)</p>
            </div>

            {/* Total Spend */}
            <div className="p-3.5 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground">Total Annual Spend</p>
              <p className="text-xl sm:text-2xl font-black text-foreground">$1,248.75</p>
              <p className="text-[10px] text-emerald-600 font-semibold">100% Minor-Integer Math</p>
            </div>

            {/* Expiring Soon */}
            <div className="p-3.5 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-muted-foreground">Expiring Soon</p>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/40">
                  <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                  Within 30 Days
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-foreground">5</p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Alerts Dispatched</p>
            </div>
          </div>

          {/* Mini Visuals Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
            {/* Mini Bar Chart */}
            <div className="md:col-span-7 p-4 rounded-xl border border-border/70 bg-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Monthly Renewals Timeline
                </span>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-emerald-600" /> Actual
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-slate-400" /> Projected
                  </span>
                </div>
              </div>

              {/* Visual Bars Simulation */}
              <div className="h-28 flex items-end justify-between px-2 pt-2">
                {[
                  { m: "Jan", a: 40, p: 25 },
                  { m: "Feb", a: 55, p: 35 },
                  { m: "Mar", a: 80, p: 45 },
                  { m: "Apr", a: 65, p: 50 },
                  { m: "May", a: 95, p: 40 },
                  { m: "Jun", a: 70, p: 35 },
                  { m: "Jul", a: 60, p: 50 },
                  { m: "Aug", a: 45, p: 55 },
                  { m: "Sep", a: 85, p: 70 },
                  { m: "Oct", a: 50, p: 35 },
                  { m: "Nov", a: 75, p: 80 },
                  { m: "Dec", a: 60, p: 40 },
                ].map((item) => (
                  <div key={item.m} className="flex flex-col items-center gap-1">
                    <div className="flex items-end gap-0.5 h-20">
                      <div
                        style={{ height: `${item.a}%` }}
                        className="w-1.5 sm:w-2.5 rounded-t-xs bg-emerald-600"
                      />
                      <div
                        style={{ height: `${item.p}%` }}
                        className="w-1.5 sm:w-2.5 rounded-t-xs bg-slate-400/80"
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{item.m}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini Category Distribution */}
            <div className="md:col-span-5 p-4 rounded-xl border border-border/70 bg-card flex flex-col justify-between space-y-3">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Asset Distribution
              </span>

              <div className="space-y-2">
                {[
                  { label: "Domains (14)", pct: "45%", color: "bg-emerald-600" },
                  { label: "Subscriptions (8)", pct: "25%", color: "bg-emerald-400" },
                  { label: "Cloud Hosting (6)", pct: "18%", color: "bg-slate-600" },
                  { label: "SSL Certificates (4)", pct: "12%", color: "bg-slate-400" },
                ].map((cat) => (
                  <div key={cat.label} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-foreground">
                      <span>{cat.label}</span>
                      <span className="text-muted-foreground">{cat.pct}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cat.color}`}
                        style={{ width: cat.pct }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-emerald-600 font-semibold">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  PostgreSQL Isolated
                </span>
                <span className="flex items-center gap-0.5 hover:underline cursor-pointer">
                  View full ledger <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
