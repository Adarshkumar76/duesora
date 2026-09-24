"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Coins,
  RefreshCw,
  ArrowLeftRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Database,
  Globe,
} from "lucide-react";
import {
  CURRENCY_SYMBOLS,
  convertCurrency,
  FX_CURRENCIES,
  type FxCurrency,
} from "@/lib/currency/rates";

interface CurrencyRatesResponse {
  base: string;
  rates: Record<string, number>;
  source: string;
  lastUpdated: string;
  currencies: string[];
}

export function CurrencyExchangeSettings() {
  const [ratesData, setRatesData] = useState<CurrencyRatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Mini calculator state
  const [calcAmount, setCalcAmount] = useState<string>("100");
  const [calcFrom, setCalcFrom] = useState<FxCurrency>("EUR");
  const [calcTo, setCalcTo] = useState<FxCurrency>("USD");

  const fetchRates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/currency/rates");
      if (res.ok) {
        const json = await res.json();
        const payload: CurrencyRatesResponse = json.data || json;
        setRatesData(payload);
      }
    } catch {
      // silently handle fetch error on mount
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);

    try {
      const res = await fetch("/api/currency/sync", {
        method: "POST",
      });
      const json = await res.json();
      const payload = json.data || json;

      if (res.ok && payload.success) {
        setSyncMessage({
          type: "success",
          text: `Exchange rates synced successfully via ${payload.source} (${payload.count} currencies).`,
        });
        await fetchRates();
      } else {
        setSyncMessage({
          type: "error",
          text: json.error?.message || payload.error || "Failed to synchronize exchange rates.",
        });
      }
    } catch (err) {
      setSyncMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Network error during rate sync.",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSwapCurrencies = () => {
    setCalcFrom(calcTo);
    setCalcTo(calcFrom);
  };

  // Calculate live conversion
  const parsedCalcAmount = parseFloat(calcAmount);
  const amountMinor = !isNaN(parsedCalcAmount) && parsedCalcAmount > 0
    ? Math.round(parsedCalcAmount * 100)
    : 0;

  const convertedMinor = ratesData?.rates
    ? convertCurrency(amountMinor, calcFrom, calcTo, ratesData.rates)
    : convertCurrency(amountMinor, calcFrom, calcTo);

  const convertedMajor = (convertedMinor / 100).toFixed(2);

  // Conversion rate breakdown
  const fromRate = ratesData?.rates?.[calcFrom] ?? 1.0;
  const toRate = ratesData?.rates?.[calcTo] ?? 1.0;
  const directRate = toRate > 0 ? (fromRate / toRate) : 1.0;

  const getSourceBadge = (source?: string) => {
    if (!source) return null;
    if (source.includes("open.er-api.com") || source === "live") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Globe className="w-3 h-3 animate-pulse text-emerald-500" />
          Live Provider ({source})
        </span>
      );
    }
    if (source.includes("database") || source.includes("db_cache")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Database className="w-3 h-3 text-amber-500" />
          PostgreSQL Cache
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
        <Clock className="w-3 h-3 text-slate-500" />
        Baseline Fallback
      </span>
    );
  };

  return (
    <Card className="border border-border/80 bg-card rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="p-5 sm:p-6 border-b border-border/60 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                Live Exchange Rates & Currency Sync
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-2.5 h-2.5" /> Live FX
                </span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time conversion rates normalized against USD for automated workspace budget & expense calculations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="gap-2 h-9 text-xs font-semibold rounded-xl border-border hover:bg-muted/80"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-emerald-500" : ""}`} />
              {syncing ? "Syncing Rates..." : "Sync Rates Now"}
            </Button>
          </div>
        </div>

        {/* Sync message alert */}
        {syncMessage && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
              syncMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}
          >
            {syncMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{syncMessage.text}</span>
          </div>
        )}

        {/* Status bar */}
        <div className="mt-3 flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground">
          {ratesData && getSourceBadge(ratesData.source)}
          {ratesData?.lastUpdated && (
            <span className="inline-flex items-center gap-1.5" suppressHydrationWarning>
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Last updated:</span>
              <strong className="text-foreground" suppressHydrationWarning>
                {new Date(ratesData.lastUpdated).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </strong>
            </span>
          )}
          <span className="text-[11px] text-muted-foreground/80">
            • Refreshes automatically every hour via background cron & cache
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-6">
        {/* Currencies Grid */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Supported Exchange Rates (USD Baseline)
          </h4>

          {loading && !ratesData ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse border border-border/40" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {FX_CURRENCIES.map((curr) => {
                const rateToUsd = ratesData?.rates?.[curr] ?? 1.0;
                const unitsPerUsd = rateToUsd > 0 ? (1 / rateToUsd) : 1.0;
                const symbol = CURRENCY_SYMBOLS[curr] || curr;
                const isBase = curr === "USD";

                return (
                  <div
                    key={curr}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isBase
                        ? "border-emerald-500/30 bg-emerald-500/5 shadow-sm"
                        : "border-border/60 bg-muted/20 hover:border-border/90 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{curr}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded font-mono bg-muted text-muted-foreground">
                          {symbol}
                        </span>
                      </div>
                      {isBase && (
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                          Base
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs text-foreground font-medium">
                        1 {curr} ={" "}
                        <span className="font-mono font-semibold">
                          ${rateToUsd >= 1 ? rateToUsd.toFixed(4) : rateToUsd.toFixed(6)}
                        </span>{" "}
                        USD
                      </p>
                      {!isBase && (
                        <p className="text-[11px] text-muted-foreground font-mono">
                          1 USD = {unitsPerUsd >= 1 ? unitsPerUsd.toFixed(2) : unitsPerUsd.toFixed(4)} {curr}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Interactive Conversion Calculator */}
        <div className="rounded-xl border border-border/70 bg-muted/15 p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-bold text-foreground">Interactive FX Rate Calculator</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  placeholder="100.00"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="sm:col-span-3 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">From</label>
              <select
                value={calcFrom}
                onChange={(e) => setCalcFrom(e.target.value as FxCurrency)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {FX_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c} ({CURRENCY_SYMBOLS[c] || c})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1 flex justify-center pb-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleSwapCurrencies}
                title="Swap Currencies"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="sm:col-span-4 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">To</label>
              <select
                value={calcTo}
                onChange={(e) => setCalcTo(e.target.value as FxCurrency)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {FX_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c} ({CURRENCY_SYMBOLS[c] || c})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Result Output Bar */}
          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Calculated Value</p>
              <p className="text-lg font-bold text-foreground">
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {CURRENCY_SYMBOLS[calcTo] || calcTo} {convertedMajor}
                </span>{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({CURRENCY_SYMBOLS[calcFrom] || calcFrom} {parsedCalcAmount || 0} {calcFrom})
                </span>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] text-muted-foreground font-mono">
                Effective Rate: 1 {calcFrom} = {directRate >= 1 ? directRate.toFixed(4) : directRate.toFixed(6)} {calcTo}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
