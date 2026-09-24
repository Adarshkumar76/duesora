import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { exchangeRates } from "@/db/exchange-rates-schema";
import {
  BASE_RATES_TO_USD,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
  FX_CURRENCIES,
  type FxCurrency,
} from "./rates";

export { FX_CURRENCIES, type FxCurrency };

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const TIMEOUT_MS = 6000; // 6s timeout

interface RatesCache {
  rates: Record<string, number>;
  lastSyncedAt: Date;
  expiresAt: number;
}

let inMemoryCache: RatesCache | null = null;

export function clearExchangeRatesCache(): void {
  inMemoryCache = null;
}

/**
 * Fetches real-time exchange rates from open ExchangeRate-API.
 * Converts API rates (units per 1 USD) into our canonical rateToUsd (USD per 1 unit).
 */
export async function fetchExternalExchangeRates(): Promise<{
  rates: Record<string, number>;
  source: string;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`FX API responded with status ${res.status}`);
    }

    const data = await res.json();
    if (!data?.rates || typeof data.rates !== "object") {
      throw new Error("Invalid response format from FX provider");
    }

    const computedRates: Record<string, number> = {
      USD: 1.0,
    };

    for (const curr of FX_CURRENCIES) {
      if (curr === "USD") continue;
      const unitsPerUsd = data.rates[curr];
      if (typeof unitsPerUsd === "number" && unitsPerUsd > 0) {
        // e.g. If 1 USD = 83.5 INR, then 1 INR = (1 / 83.5) USD = 0.011976 USD
        computedRates[curr] = Number((1 / unitsPerUsd).toFixed(6));
      } else if (BASE_RATES_TO_USD[curr]) {
        computedRates[curr] = BASE_RATES_TO_USD[curr];
      }
    }

    return {
      rates: computedRates,
      source: "open.er-api.com",
    };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export interface SyncRatesResult {
  success: boolean;
  rates: Record<string, number>;
  lastSyncedAt: Date;
  source: string;
  count: number;
  error?: string;
}

/**
 * Synchronizes real-time exchange rates, upserts them into PostgreSQL, and refreshes the cache.
 * Has complete fallback resilience: if network fails, falls back to DB cached rates or static baseline.
 */
export async function syncExchangeRates(force = false): Promise<SyncRatesResult> {
  const now = new Date();

  // Return fresh cache if not forced
  if (!force && inMemoryCache && inMemoryCache.expiresAt > Date.now()) {
    return {
      success: true,
      rates: inMemoryCache.rates,
      lastSyncedAt: inMemoryCache.lastSyncedAt,
      source: "memory-cache",
      count: Object.keys(inMemoryCache.rates).length,
    };
  }

  try {
    const { rates, source } = await fetchExternalExchangeRates();
    const db = getDb();

    // Upsert into exchange_rates table
    for (const [curr, rate] of Object.entries(rates)) {
      await db
        .insert(exchangeRates)
        .values({
          currency: curr,
          rateToUsd: rate,
          source,
          fetchedAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: exchangeRates.currency,
          set: {
            rateToUsd: rate,
            source,
            fetchedAt: now,
            updatedAt: now,
          },
        });
    }

    inMemoryCache = {
      rates,
      lastSyncedAt: now,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    return {
      success: true,
      rates,
      lastSyncedAt: now,
      source,
      count: Object.keys(rates).length,
    };
  } catch (syncErr) {
    // Graceful fallback 1: Load last stored rates from database
    try {
      const db = getDb();
      const rows = await db.select().from(exchangeRates);

      if (rows.length > 0) {
        const dbRates: Record<string, number> = { USD: 1.0 };
        let mostRecentDate = new Date(0);

        for (const row of rows) {
          dbRates[row.currency] = row.rateToUsd;
          if (row.fetchedAt > mostRecentDate) {
            mostRecentDate = row.fetchedAt;
          }
        }

        // Cache fallback rates for 10 minutes
        inMemoryCache = {
          rates: dbRates,
          lastSyncedAt: mostRecentDate,
          expiresAt: Date.now() + 10 * 60 * 1000,
        };

        return {
          success: true,
          rates: dbRates,
          lastSyncedAt: mostRecentDate,
          source: "database-cached",
          count: Object.keys(dbRates).length,
          error: syncErr instanceof Error ? syncErr.message : "Live sync failed, using cached rates",
        };
      }
    } catch {
      // ignore db error, proceed to fallback 2
    }

    // Graceful fallback 2: Baseline constants
    const baselineRates: Record<string, number> = { ...BASE_RATES_TO_USD };
    inMemoryCache = {
      rates: baselineRates,
      lastSyncedAt: now,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    return {
      success: true,
      rates: baselineRates,
      lastSyncedAt: now,
      source: "baseline-constants",
      count: Object.keys(baselineRates).length,
      error: syncErr instanceof Error ? syncErr.message : "Network and database offline, using baseline",
    };
  }
}

/**
 * Returns the effective exchange rates map for conversions and reporting.
 */
export async function getEffectiveExchangeRates(): Promise<{
  rates: Record<string, number>;
  lastSyncedAt: Date;
  source: string;
}> {
  if (inMemoryCache && inMemoryCache.expiresAt > Date.now()) {
    return {
      rates: inMemoryCache.rates,
      lastSyncedAt: inMemoryCache.lastSyncedAt,
      source: "memory-cache",
    };
  }

  const result = await syncExchangeRates(false);
  return {
    rates: result.rates,
    lastSyncedAt: result.lastSyncedAt,
    source: result.source,
  };
}
