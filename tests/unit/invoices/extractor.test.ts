import { describe, it, expect } from "vitest";
import { extractInvoiceMetadata } from "@/lib/invoices/extractor";

describe("Invoice Metadata Extractor", () => {
  it("extracts GitHub invoice metadata with amount, monthly cycle, and vendor", () => {
    const rawInvoice = `
      GitHub, Inc.
      88 Colin P Kelly Jr St
      San Francisco, CA 94107
      
      Invoice Number: INV-984210
      Invoice Date: 2026-09-01
      
      Description: GitHub Team (10 seats) - Monthly
      
      Subtotal: $40.00
      Tax: $0.00
      Total Amount: $40.00 USD
      Payment Method: Credit Card (**** 4242)
    `;

    const result = extractInvoiceMetadata(rawInvoice);
    expect(result.vendorName).toBe("GitHub");
    expect(result.confidence.vendor).toBe("high");
    expect(result.amountMinor).toBe(4000);
    expect(result.currency).toBe("USD");
    expect(result.confidence.amount).toBe("high");
    expect(result.invoiceNumber).toBe("INV-984210");
    expect(result.invoiceDate).toBe("2026-09-01");
    expect(result.billingCycle).toBe("monthly");
    expect(result.renewalDate).toBe("2026-10-01");
  });

  it("extracts AWS annual billing invoice metadata", () => {
    const rawInvoice = `
      Amazon Web Services, Inc.
      410 Terry Avenue North
      Seattle, WA 98109-5210
      
      Invoice # AWS-2026-88412
      Issue Date: 2026-01-15
      Due Date: 2027-01-15
      
      Plan: AWS Enterprise Support - Yearly Subscription
      
      Grand Total: $1,250.00
    `;

    const result = extractInvoiceMetadata(rawInvoice);
    expect(result.vendorName).toBe("Amazon Web Services");
    expect(result.amountMinor).toBe(125000);
    expect(result.billingCycle).toBe("yearly");
    expect(result.invoiceDate).toBe("2026-01-15");
    expect(result.renewalDate).toBe("2027-01-15");
  });

  it("extracts Cloudflare EUR invoice with quarterly cycle", () => {
    const rawInvoice = `
      Cloudflare, Inc.
      Invoice ID: CF-102938
      Date: 2026-03-01
      
      Cloudflare Pro Plan (Quarterly)
      
      Total Due: €60.00 EUR
    `;

    const result = extractInvoiceMetadata(rawInvoice);
    expect(result.vendorName).toBe("Cloudflare");
    expect(result.amountMinor).toBe(6000);
    expect(result.currency).toBe("EUR");
    expect(result.billingCycle).toBe("quarterly");
    expect(result.renewalDate).toBe("2026-06-01");
  });

  it("falls back to heuristics for unknown vendors with Billed by header", () => {
    const rawReceipt = `
      Billed By: Acme Analytics Corp
      Receipt # REC-554433
      Date: 2026-08-10
      
      Service: Data Ingestion API - $99.00 / month
      Total: $99.00
    `;

    const result = extractInvoiceMetadata(rawReceipt);
    expect(result.vendorName).toBe("Acme Analytics Corp");
    expect(result.confidence.vendor).toBe("medium");
    expect(result.amountMinor).toBe(9900);
    expect(result.currency).toBe("USD");
    expect(result.billingCycle).toBe("monthly");
  });
});
