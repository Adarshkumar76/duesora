import { z } from "zod";
import { resourceTypeSchema } from "@/lib/resources/validation";
import { stripHtml, sanitizeString, isSafeUrl } from "@/lib/security/sanitize";

export const importRowSchema = z.object({
  name: z
    .string()
    .transform((val) => stripHtml(val))
    .pipe(
      z
        .string()
        .min(1, "Resource name is required")
        .max(200, "Resource name must be 200 characters or less")
        .refine((val) => !/[<>]/.test(val), {
          message: "Name cannot contain HTML tags",
        })
    ),
  type: resourceTypeSchema,
  category: z
    .string()
    .transform((val) => stripHtml(val))
    .pipe(z.string().max(60))
    .nullable()
    .optional()
    .default(null),
  provider: z
    .string()
    .transform((val) => stripHtml(val))
    .pipe(z.string().max(120))
    .nullable()
    .optional()
    .default(null),
  websiteUrl: z
    .string()
    .transform((val) => sanitizeString(val))
    .pipe(
      z
        .string()
        .max(2048)
        .refine((val) => val === "" || isSafeUrl(val), {
          message: "Website URL must use http or https protocol",
        })
    )
    .nullable()
    .optional()
    .default(null),
  amountMinor: z.number().int().min(0).nullable().optional().default(null),
  currency: z
    .string()
    .transform((val) => val.trim().toUpperCase())
    .pipe(z.string().length(3))
    .optional()
    .default("USD"),
  billingCycle: z
    .enum(["yearly", "monthly", "quarterly", "one_time", "lifetime"])
    .optional()
    .default("yearly"),
  renewalDate: z
    .string()
    .nullable()
    .optional()
    .default(null),
  autoRenew: z.boolean().optional().default(true),
  tags: z.array(z.string()).optional().default([]),
});

export type ValidatedImportRow = z.infer<typeof importRowSchema>;

/**
 * Normalizes a raw key-value record from CSV or JSON into the standard format before Zod validation.
 */
export function normalizeRawRow(raw: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  // Normalize keys
  const keys = Object.keys(raw);
  const findVal = (...aliases: string[]) => {
    for (const alias of aliases) {
      const matchKey = keys.find(
        (k) => k.toLowerCase().replace(/[^a-z0-9]/g, "") === alias.toLowerCase().replace(/[^a-z0-9]/g, "")
      );
      if (matchKey && raw[matchKey] !== undefined && raw[matchKey] !== null && raw[matchKey] !== "") {
        return raw[matchKey];
      }
    }
    return undefined;
  };

  // 1. Name
  const rawName = findVal("name", "resourcename", "asset", "domain", "title");
  normalized.name = typeof rawName === "string" ? rawName.trim() : "";

  // 2. Type
  const rawType = findVal("type", "resourcetype", "kind", "category_type");
  normalized.type = mapResourceType(rawType);

  // 3. Category
  const rawCategory = findVal("category", "group", "tag_category");
  normalized.category = typeof rawCategory === "string" ? rawCategory.trim() : null;

  // 4. Provider
  const rawProvider = findVal("provider", "registrar", "vendor", "host", "issuer");
  normalized.provider = typeof rawProvider === "string" ? rawProvider.trim() : null;

  // 5. Website URL
  const rawUrl = findVal("websiteurl", "url", "website", "link", "externalurl");
  normalized.websiteUrl = typeof rawUrl === "string" ? rawUrl.trim() : null;

  // 6. Amount & Currency
  const rawAmount = findVal("amount", "amountminor", "cost", "price");
  const rawCurrency = findVal("currency", "curr");
  const { amountMinor, currency } = parsePrice(rawAmount, rawCurrency);
  normalized.amountMinor = amountMinor;
  normalized.currency = currency;

  // 7. Billing Cycle
  const rawCycle = findVal("billingcycle", "cycle", "interval", "frequency");
  normalized.billingCycle = mapBillingCycle(rawCycle);

  // 8. Renewal Date
  const rawRenewal = findVal("renewaldate", "renewal", "expiry", "nextrenewal", "expires_at", "due_date");
  normalized.renewalDate = parseRenewalDate(rawRenewal);

  // 9. Auto Renew
  const rawAutoRenew = findVal("autorenew", "auto_renew", "automatic");
  normalized.autoRenew = parseBoolean(rawAutoRenew, true);

  // 10. Tags
  const rawTags = findVal("tags", "tag", "labels");
  normalized.tags = parseTags(rawTags);

  return normalized;
}

function mapResourceType(raw: unknown): string {
  if (typeof raw !== "string") return "custom";
  const val = raw.toLowerCase().trim();
  if (val.includes("domain")) return "domain";
  if (val.includes("ssl") || val.includes("cert")) return "ssl_certificate";
  if (val.includes("sub") || val.includes("saas")) return "subscription";
  if (val.includes("host") || val.includes("vps")) return "hosting";
  if (val.includes("cloud") || val.includes("aws") || val.includes("server")) return "cloud_service";
  if (val.includes("license") || val.includes("software")) return "software_license";
  if (val.includes("contract")) return "contract";
  if (val.includes("warranty")) return "warranty";
  if (val.includes("doc")) return "document";
  return "custom";
}

function mapBillingCycle(raw: unknown): string {
  if (typeof raw !== "string") return "yearly";
  const val = raw.toLowerCase().trim();
  if (val.includes("month")) return "monthly";
  if (val.includes("quarter")) return "quarterly";
  if (val.includes("one") || val.includes("once")) return "one_time";
  if (val.includes("life")) return "lifetime";
  return "yearly";
}

function parsePrice(
  rawAmount: unknown,
  rawCurrency: unknown
): { amountMinor: number | null; currency: string } {
  let currency = typeof rawCurrency === "string" && rawCurrency.trim().length === 3
    ? rawCurrency.trim().toUpperCase()
    : "USD";

  if (rawAmount === null || rawAmount === undefined || rawAmount === "") {
    return { amountMinor: null, currency };
  }

  if (typeof rawAmount === "number") {
    // If integer and >= 100, could be minor units, but check if fractional
    return { amountMinor: Math.round(rawAmount * 100), currency };
  }

  if (typeof rawAmount === "string") {
    let str = rawAmount.trim();
    // Detect currency symbol
    if (str.includes("₹")) { currency = "INR"; str = str.replace(/₹/g, ""); }
    else if (str.includes("$")) { currency = "USD"; str = str.replace(/\$/g, ""); }
    else if (str.includes("€")) { currency = "EUR"; str = str.replace(/€/g, ""); }
    else if (str.includes("£")) { currency = "GBP"; str = str.replace(/£/g, ""); }

    const cleanNum = parseFloat(str.replace(/[^0-9.]/g, ""));
    if (!isNaN(cleanNum) && cleanNum >= 0) {
      return { amountMinor: Math.round(cleanNum * 100), currency };
    }
  }

  return { amountMinor: null, currency };
}

function parseRenewalDate(raw: unknown): string | null {
  if (!raw) return null;
  try {
    const d = new Date(String(raw));
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

function parseBoolean(raw: unknown, defaultVal: boolean): boolean {
  if (raw === undefined || raw === null || raw === "") return defaultVal;
  if (typeof raw === "boolean") return raw;
  const str = String(raw).toLowerCase().trim();
  return str === "true" || str === "1" || str === "yes" || str === "y";
}

function parseTags(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((t) => String(t).trim().replace(/^#/, ""))
      .filter((t) => t.length > 0);
  }
  if (typeof raw === "string") {
    return raw
      .split(/[,;|]/)
      .map((t) => t.trim().replace(/^#/, ""))
      .filter((t) => t.length > 0);
  }
  return [];
}
