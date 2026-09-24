import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  clearExchangeRatesCache,
  fetchExternalExchangeRates,
  syncExchangeRates,
  getEffectiveExchangeRates,
} from "@/lib/currency/sync";
import { convertCurrency, BASE_RATES_TO_USD } from "@/lib/currency/rates";
import { getDb } from "@/db";

vi.mock("@/db", () => {
  const insertMock = vi.fn();
  const selectMock = vi.fn();
  return {
    getDb: vi.fn(() => ({
      insert: insertMock,
      select: selectMock,
    })),
  };
});

describe("Unit: FX Currency Sync Engine", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    clearExchangeRatesCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("fetchExternalExchangeRates", () => {
    it("successfully fetches rates and computes inverted rateToUsd", async () => {
      // 1 USD = 0.92 EUR -> 1 EUR = 1 / 0.92 = 1.086957 USD
      // 1 USD = 83.5 INR -> 1 INR = 1 / 83.5 = 0.011976 USD
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: "success",
          rates: {
            EUR: 0.92,
            GBP: 0.78,
            INR: 83.5,
            CAD: 1.35,
            AUD: 1.52,
            JPY: 155.0,
            SGD: 1.34,
          },
        }),
      });

      const result = await fetchExternalExchangeRates();
      expect(result.source).toBe("open.er-api.com");
      expect(result.rates.USD).toBe(1.0);
      expect(result.rates.EUR).toBeCloseTo(1 / 0.92, 4);
      expect(result.rates.INR).toBeCloseTo(1 / 83.5, 4);
      expect(result.rates.GBP).toBeCloseTo(1 / 0.78, 4);
    });

    it("throws an error when external API returns non-200", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      });

      await expect(fetchExternalExchangeRates()).rejects.toThrow(
        "FX API responded with status 503"
      );
    });

    it("throws an error when response payload is malformed", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ result: "error" }),
      });

      await expect(fetchExternalExchangeRates()).rejects.toThrow(
        "Invalid response format from FX provider"
      );
    });
  });

  describe("syncExchangeRates", () => {
    it("upserts rates to database and caches in memory", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          rates: {
            EUR: 0.92,
            GBP: 0.78,
            INR: 83.5,
          },
        }),
      });

      const onConflictDoUpdateMock = vi.fn().mockResolvedValue([]);
      const valuesMock = vi.fn(() => ({
        onConflictDoUpdate: onConflictDoUpdateMock,
      }));
      const dbMock = {
        insert: vi.fn(() => ({ values: valuesMock })),
        select: vi.fn(),
      };
      vi.mocked(getDb).mockReturnValue(dbMock as never);

      const result = await syncExchangeRates(true);

      expect(result.success).toBe(true);
      expect(result.source).toBe("open.er-api.com");
      expect(result.rates.USD).toBe(1.0);
      expect(result.count).toBeGreaterThan(0);
      expect(dbMock.insert).toHaveBeenCalled();

      // Subsequent call with force=false should use memory cache
      const cachedResult = await syncExchangeRates(false);
      expect(cachedResult.source).toBe("memory-cache");
    });

    it("gracefully falls back to database-cached rates when API fetch fails", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network connection timeout"));

      const mockDbRows = [
        { currency: "EUR", rateToUsd: 1.075, fetchedAt: new Date("2026-09-20") },
        { currency: "GBP", rateToUsd: 1.27, fetchedAt: new Date("2026-09-21") },
        { currency: "INR", rateToUsd: 0.0121, fetchedAt: new Date("2026-09-21") },
      ];

      const fromMock = vi.fn().mockResolvedValue(mockDbRows);
      const dbMock = {
        insert: vi.fn(),
        select: vi.fn(() => ({ from: fromMock })),
      };
      vi.mocked(getDb).mockReturnValue(dbMock as never);

      const result = await syncExchangeRates(true);

      expect(result.success).toBe(true);
      expect(result.source).toBe("database-cached");
      expect(result.rates.EUR).toBe(1.075);
      expect(result.rates.GBP).toBe(1.27);
      expect(result.rates.USD).toBe(1.0);
    });

    it("gracefully falls back to baseline constants when API and DB both fail", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network offline"));

      const fromMock = vi.fn().mockRejectedValue(new Error("Database connection refused"));
      const dbMock = {
        insert: vi.fn(),
        select: vi.fn(() => ({ from: fromMock })),
      };
      vi.mocked(getDb).mockReturnValue(dbMock as never);

      const result = await syncExchangeRates(true);

      expect(result.success).toBe(true);
      expect(result.source).toBe("baseline-constants");
      expect(result.rates.USD).toBe(1.0);
      expect(result.rates.EUR).toBe(BASE_RATES_TO_USD.EUR);
    });
  });

  describe("getEffectiveExchangeRates", () => {
    it("returns effective rates via memory cache or sync", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          rates: { EUR: 0.95 },
        }),
      });

      const onConflictDoUpdateMock = vi.fn().mockResolvedValue([]);
      const valuesMock = vi.fn(() => ({
        onConflictDoUpdate: onConflictDoUpdateMock,
      }));
      const dbMock = {
        insert: vi.fn(() => ({ values: valuesMock })),
        select: vi.fn(),
      };
      vi.mocked(getDb).mockReturnValue(dbMock as never);

      const effective = await getEffectiveExchangeRates();
      expect(effective.rates).toBeDefined();
      expect(effective.rates.USD).toBe(1.0);

      // Calling again uses memory cache
      const cached = await getEffectiveExchangeRates();
      expect(cached.source).toBe("memory-cache");
    });
  });

  describe("convertCurrency with dynamic rates", () => {
    it("uses customRates when supplied to override default baseline rates", () => {
      const liveRates = {
        USD: 1.0,
        EUR: 1.15, // boosted EUR rate
        INR: 0.015,
      };

      // 100 EUR (10000 cents) at 1.15 rate -> 11500 USD cents
      const converted = convertCurrency(10000, "EUR", "USD", liveRates);
      expect(converted).toBe(11500);

      // Without customRates -> uses BASE_RATES_TO_USD (EUR = 1.08 -> 10800)
      const baseConverted = convertCurrency(10000, "EUR", "USD");
      expect(baseConverted).toBe(10800);
    });
  });
});
