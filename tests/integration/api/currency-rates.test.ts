import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/currency/rates/route";
import { POST } from "@/app/api/currency/sync/route";
import { auth } from "@/auth";
import { getEffectiveExchangeRates, syncExchangeRates } from "@/lib/currency/sync";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/currency/sync", () => ({
  getEffectiveExchangeRates: vi.fn(),
  syncExchangeRates: vi.fn(),
}));

describe("API: /api/currency/rates and /api/currency/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/currency/rates", () => {
    it("returns 200 with currency exchange rates", async () => {
      const mockRates = {
        USD: 1.0,
        EUR: 1.085,
        GBP: 1.28,
        INR: 0.012,
      };

      vi.mocked(getEffectiveExchangeRates).mockResolvedValue({
        rates: mockRates,
        lastSyncedAt: new Date("2026-09-24T04:00:00.000Z"),
        source: "open.er-api.com",
      });

      const req = new NextRequest("http://localhost:3000/api/currency/rates");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toBeDefined();
      expect(json.data.base).toBe("USD");
      expect(json.data.rates.EUR).toBe(1.085);
      expect(json.data.source).toBe("open.er-api.com");
      expect(json.data.lastSyncedAt).toBe("2026-09-24T04:00:00.000Z");
    });

    it("returns 500 when retrieving exchange rates fails", async () => {
      vi.mocked(getEffectiveExchangeRates).mockRejectedValue(
        new Error("Database and network failed")
      );

      const req = new NextRequest("http://localhost:3000/api/currency/rates");
      const res = await GET(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error.code).toBe("INTERNAL_ERROR");
      expect(json.error.message).toBe("Database and network failed");
    });
  });

  describe("POST /api/currency/sync", () => {
    it("returns 401 when neither user session nor valid CRON_SECRET is present", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const req = new NextRequest("http://localhost:3000/api/currency/sync", {
        method: "POST",
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("allows execution when user is authenticated in session", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-test-123" } } as never);
      vi.mocked(syncExchangeRates).mockResolvedValue({
        success: true,
        rates: { USD: 1.0, EUR: 1.08 },
        lastSyncedAt: new Date("2026-09-24T04:30:00.000Z"),
        source: "open.er-api.com",
        count: 2,
      });

      const req = new NextRequest("http://localhost:3000/api/currency/sync", {
        method: "POST",
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.success).toBe(true);
      expect(json.data.count).toBe(2);
      expect(json.data.source).toBe("open.er-api.com");
      expect(syncExchangeRates).toHaveBeenCalledWith(true);
    });

    it("allows execution when Bearer token matches CRON_SECRET", async () => {
      process.env.CRON_SECRET = "test-cron-secret-123";
      vi.mocked(auth).mockResolvedValue(null as never);
      vi.mocked(syncExchangeRates).mockResolvedValue({
        success: true,
        rates: { USD: 1.0, EUR: 1.08 },
        lastSyncedAt: new Date("2026-09-24T04:30:00.000Z"),
        source: "open.er-api.com",
        count: 2,
      });

      const req = new NextRequest("http://localhost:3000/api/currency/sync", {
        method: "POST",
        headers: {
          authorization: "Bearer test-cron-secret-123",
        },
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.success).toBe(true);
    });

    it("returns 500 when synchronization service throws an error", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-admin" } } as never);
      vi.mocked(syncExchangeRates).mockRejectedValue(new Error("Fatal sync failure"));

      const req = new NextRequest("http://localhost:3000/api/currency/sync", {
        method: "POST",
      });
      const res = await POST(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error.code).toBe("INTERNAL_ERROR");
      expect(json.error.message).toBe("Fatal sync failure");
    });
  });
});
