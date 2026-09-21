import { describe, it, expect } from "vitest";
import { convertCurrency, normalizeRecurringCost } from "@/lib/currency/rates";

describe("Currency Rates & Conversion", () => {
  it("returns same amount for identical source and target currencies", () => {
    expect(convertCurrency(1000, "USD", "USD")).toBe(1000);
    expect(convertCurrency(5000, "EUR", "EUR")).toBe(5000);
    expect(convertCurrency(83000, "INR", "INR")).toBe(83000);
  });

  it("handles zero, null, and negative amounts gracefully", () => {
    expect(convertCurrency(0, "USD", "EUR")).toBe(0);
    expect(convertCurrency(null, "USD", "EUR")).toBe(0);
    expect(convertCurrency(-500, "USD", "EUR")).toBe(0);
  });

  it("converts USD to EUR and vice versa accurately", () => {
    // 100 USD (10000 cents) -> EUR rate 1.08 -> ~9259 EUR cents
    const inEur = convertCurrency(10000, "USD", "EUR");
    expect(inEur).toBe(9259);

    // 100 EUR (10000 cents) -> USD rate 1.08 -> ~10800 USD cents
    const inUsd = convertCurrency(10000, "EUR", "USD");
    expect(inUsd).toBe(10800);
  });

  it("converts USD to INR and vice versa accurately", () => {
    // 10 USD (1000 cents) -> INR rate 0.012 -> 10 / 0.012 = ~833.33 INR (83333 paise)
    const inInr = convertCurrency(1000, "USD", "INR");
    expect(inInr).toBe(83333);

    // 83333 INR paise -> USD rate 0.012 -> 83333 * 0.012 = ~1000 USD cents
    const inUsd = convertCurrency(83333, "INR", "USD");
    expect(inUsd).toBe(1000);
  });
});

describe("normalizeRecurringCost", () => {
  it("normalizes monthly billing cycle", () => {
    const res = normalizeRecurringCost(2000, "monthly");
    expect(res.monthlyMinor).toBe(2000);
    expect(res.yearlyMinor).toBe(24000);
  });

  it("normalizes quarterly billing cycle", () => {
    const res = normalizeRecurringCost(6000, "quarterly");
    expect(res.monthlyMinor).toBe(2000);
    expect(res.yearlyMinor).toBe(24000);
  });

  it("normalizes yearly billing cycle", () => {
    const res = normalizeRecurringCost(12000, "yearly");
    expect(res.monthlyMinor).toBe(1000);
    expect(res.yearlyMinor).toBe(12000);
  });

  it("normalizes one-time or non-recurring cycles to zero", () => {
    const res = normalizeRecurringCost(15000, "one_time");
    expect(res.monthlyMinor).toBe(0);
    expect(res.yearlyMinor).toBe(0);
  });
});
