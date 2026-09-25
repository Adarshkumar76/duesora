export interface ExtractedInvoiceMetadata {
  vendorName: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null; // ISO YYYY-MM-DD
  renewalDate: string | null; // ISO YYYY-MM-DD
  amountMinor: number | null; // in cents
  currency: string;
  billingCycle: "monthly" | "yearly" | "quarterly" | null;
  confidence: {
    vendor: "high" | "medium" | "low";
    amount: "high" | "medium" | "low";
    date: "high" | "medium" | "low";
    billingCycle: "high" | "medium" | "low";
  };
  rawSnippets: {
    vendorSnippet?: string;
    amountSnippet?: string;
    dateSnippet?: string;
  };
}

const KNOWN_VENDORS = [
  { name: "Amazon Web Services", patterns: [/amazon\s+web\s+services/i, /aws/i] },
  { name: "Google Cloud", patterns: [/google\s+cloud/i, /google\s+workspace/i, /google\s+ireland/i, /google\s+llc/i] },
  { name: "GitHub", patterns: [/github,\s+inc/i, /github/i] },
  { name: "Cloudflare", patterns: [/cloudflare,\s+inc/i, /cloudflare/i] },
  { name: "Slack", patterns: [/slack\s+technologies/i, /slack/i] },
  { name: "Figma", patterns: [/figma,\s+inc/i, /figma/i] },
  { name: "Vercel", patterns: [/vercel\s+inc/i, /vercel/i] },
  { name: "Datadog", patterns: [/datadog,\s+inc/i, /datadog/i] },
  { name: "Atlassian", patterns: [/atlassian/i, /jira/i, /confluence/i] },
  { name: "Microsoft", patterns: [/microsoft\s+azure/i, /microsoft\s+365/i, /microsoft\s+corporation/i] },
  { name: "DigitalOcean", patterns: [/digitalocean/i] },
  { name: "Stripe", patterns: [/stripe,\s+inc/i, /stripe\s+payments/i] },
  { name: "Zoom", patterns: [/zoom\s+video\s+communications/i, /zoom/i] },
  { name: "OpenAI", patterns: [/openai,\s+l\.?l\.?c\.?/i, /openai/i] },
  { name: "Anthropic", patterns: [/anthropic,\s+pbc/i, /anthropic/i] },
  { name: "Notion", patterns: [/notion\s+labs/i, /notion/i] },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  "$": "USD",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
  "₹": "INR",
  "A$": "AUD",
  "C$": "CAD",
};

/**
 * Parses raw text from an invoice, receipt, or billing document
 * and extracts standard subscription metadata.
 */
export function extractInvoiceMetadata(text: string): ExtractedInvoiceMetadata {
  const cleanText = text.replace(/\r\n/g, "\n");

  let vendorName: string | null = null;
  let vendorConfidence: "high" | "medium" | "low" = "low";
  let vendorSnippet: string | undefined;

  // 1. Identify Vendor
  for (const v of KNOWN_VENDORS) {
    for (const pattern of v.patterns) {
      const match = cleanText.match(pattern);
      if (match) {
        vendorName = v.name;
        vendorConfidence = "high";
        vendorSnippet = match[0];
        break;
      }
    }
    if (vendorName) break;
  }

  // Fallback vendor extraction: "Billed By: ...", "Vendor: ...", or "From: ..."
  if (!vendorName) {
    const fromMatch = cleanText.match(/(?:billed\s+by|from|vendor|seller|service\s+provider):\s*([^\n,]{2,40})/i);
    if (fromMatch && fromMatch[1]) {
      vendorName = fromMatch[1].trim();
      vendorConfidence = "medium";
      vendorSnippet = fromMatch[0];
    }
  }

  // 2. Identify Invoice Number
  let invoiceNumber: string | null = null;
  const invMatch = cleanText.match(/(?:invoice\s*(?:#|no\.?|number|id)|receipt\s*(?:#|no\.?|id)):?\s*([A-Za-z0-9\-_]{3,30})/i);
  if (invMatch && invMatch[1]) {
    invoiceNumber = invMatch[1].trim();
  }

  // 3. Identify Currency and Amount
  let amountMinor: number | null = null;
  let currency = "USD";
  let amountConfidence: "high" | "medium" | "low" = "low";
  let amountSnippet: string | undefined;

  // Search for Total / Amount Due patterns
  const totalRegexes = [
    /(?:total\s+amount|amount\s+due|total\s+due|grand\s+total|balance\s+due|payment\s+amount|charge\s+amount|total)[\s:]*([$€£¥₹A-Za-z]{1,3})?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)\s*([A-Z]{3})?/i,
    /([$€£¥₹])\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/,
  ];

  for (const regex of totalRegexes) {
    const match = cleanText.match(regex);
    if (match) {
      amountSnippet = match[0];
      const rawSymbol = match[1] || "";
      const rawNumber = match[2];
      const codeSuffix = match[3];

      if (codeSuffix && ["USD", "EUR", "GBP", "JPY", "INR", "CAD", "AUD"].includes(codeSuffix.toUpperCase())) {
        currency = codeSuffix.toUpperCase();
      } else if (CURRENCY_SYMBOLS[rawSymbol]) {
        currency = CURRENCY_SYMBOLS[rawSymbol];
      }

      if (rawNumber) {
        const normalized = parseFloat(rawNumber.replace(/,/g, ""));
        if (!isNaN(normalized) && normalized > 0) {
          amountMinor = Math.round(normalized * 100);
          amountConfidence = "high";
          break;
        }
      }
    }
  }

  // 4. Identify Dates (Invoice Date & Next Renewal/Due Date)
  let invoiceDate: string | null = null;
  let renewalDate: string | null = null;
  let dateConfidence: "high" | "medium" | "low" = "low";
  let dateSnippet: string | undefined;

  const dateMatch = cleanText.match(/(?:invoice\s+date|date\s+of\s+issue|issue\s+date|billing\s+date|date):\s*([0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2}|[0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4}|[A-Za-z]{3,9}\s+[0-9]{1,2},?\s+[0-9]{4})/i);
  if (dateMatch && dateMatch[1]) {
    const parsed = parseDateString(dateMatch[1]);
    if (parsed) {
      invoiceDate = parsed;
      dateConfidence = "high";
      dateSnippet = dateMatch[0];
    }
  }

  const nextDueMatch = cleanText.match(/(?:due\s+date|next\s+renewal|next\s+charge|service\s+period\s+to|valid\s+until|renewal\s+date):\s*([0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2}|[0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4}|[A-Za-z]{3,9}\s+[0-9]{1,2},?\s+[0-9]{4})/i);
  if (nextDueMatch && nextDueMatch[1]) {
    const parsed = parseDateString(nextDueMatch[1]);
    if (parsed) {
      renewalDate = parsed;
    }
  }

  // 5. Identify Billing Cycle
  let billingCycle: "monthly" | "yearly" | "quarterly" | null = null;
  let cycleConfidence: "high" | "medium" | "low" = "low";

  if (/annual|yearly|per\s+year|\/yr|\/year/i.test(cleanText)) {
    billingCycle = "yearly";
    cycleConfidence = "high";
  } else if (/quarterly|per\s+quarter|\/qtr/i.test(cleanText)) {
    billingCycle = "quarterly";
    cycleConfidence = "high";
  } else if (/monthly|per\s+month|\/mo|\/month/i.test(cleanText)) {
    billingCycle = "monthly";
    cycleConfidence = "high";
  } else {
    // Default to monthly if an invoice date is found
    billingCycle = "monthly";
    cycleConfidence = "medium";
  }

  // If renewalDate is missing, calculate it based on invoiceDate + billingCycle
  if (invoiceDate && !renewalDate && billingCycle) {
    const invD = new Date(invoiceDate);
    if (!isNaN(invD.getTime())) {
      if (billingCycle === "monthly") {
        invD.setMonth(invD.getMonth() + 1);
      } else if (billingCycle === "quarterly") {
        invD.setMonth(invD.getMonth() + 3);
      } else if (billingCycle === "yearly") {
        invD.setFullYear(invD.getFullYear() + 1);
      }
      renewalDate = invD.toISOString().slice(0, 10);
    }
  }

  return {
    vendorName,
    invoiceNumber,
    invoiceDate,
    renewalDate,
    amountMinor,
    currency,
    billingCycle,
    confidence: {
      vendor: vendorConfidence,
      amount: amountConfidence,
      date: dateConfidence,
      billingCycle: cycleConfidence,
    },
    rawSnippets: {
      vendorSnippet,
      amountSnippet,
      dateSnippet,
    },
  };
}

/**
 * Helper to safely parse multiple date string formats into YYYY-MM-DD
 */
function parseDateString(raw: string): string | null {
  const trimmed = raw.trim().replace(/[.,;]$/, "");

  // Try standard ISO or JS Date parsing
  const d = new Date(trimmed);
  if (!isNaN(d.getTime()) && d.getFullYear() > 2000 && d.getFullYear() < 2100) {
    return d.toISOString().slice(0, 10);
  }

  // Match DD/MM/YYYY or MM/DD/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashMatch) {
    const [, p1, p2, year] = slashMatch;
    // Prefer YYYY-MM-DD
    const iso = `${year}-${p1.padStart(2, "0")}-${p2.padStart(2, "0")}`;
    const parsed = new Date(iso);
    if (!isNaN(parsed.getTime())) {
      return iso;
    }
  }

  return null;
}
