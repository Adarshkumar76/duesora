/**
 * Multi-currency conversion rates normalized against USD as base.
 * Supports USD, EUR, GBP, INR with extensible rate map.
 */
export const BASE_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.28,
  INR: 0.012,
};

export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "INR"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
};

/**
 * Converts an amount in minor units (e.g. cents, paise) from one currency to another.
 * Returns the converted amount rounded to the nearest minor unit.
 */
export function convertCurrency(
  amountMinor: number | null | undefined,
  fromCurrency: string | null | undefined,
  toCurrency: string | null | undefined
): number {
  if (!amountMinor || isNaN(amountMinor) || amountMinor <= 0) {
    return 0;
  }

  const from = (fromCurrency || "USD").toUpperCase();
  const to = (toCurrency || "USD").toUpperCase();

  if (from === to) {
    return Math.round(amountMinor);
  }

  const fromRateToUsd = BASE_RATES_TO_USD[from] ?? 1.0;
  const toRateToUsd = BASE_RATES_TO_USD[to] ?? 1.0;

  // Convert from origin to USD, then from USD to destination
  const amountInUsd = amountMinor * fromRateToUsd;
  const convertedMinor = amountInUsd / toRateToUsd;

  return Math.round(convertedMinor);
}

/**
 * Normalizes monthly/yearly recurring cost based on billing cycle.
 */
export function normalizeRecurringCost(
  amountMinor: number,
  billingCycle: string | null | undefined
): { monthlyMinor: number; yearlyMinor: number } {
  const cycle = billingCycle || "yearly";

  switch (cycle) {
    case "monthly":
      return {
        monthlyMinor: amountMinor,
        yearlyMinor: Math.round(amountMinor * 12),
      };
    case "quarterly":
      return {
        monthlyMinor: Math.round(amountMinor / 3),
        yearlyMinor: Math.round(amountMinor * 4),
      };
    case "yearly":
      return {
        monthlyMinor: Math.round(amountMinor / 12),
        yearlyMinor: amountMinor,
      };
    default:
      // one_time, lifetime, etc.
      return {
        monthlyMinor: 0,
        yearlyMinor: 0,
      };
  }
}
