import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as extractPost } from "@/app/api/workspaces/[workspaceId]/resources/[resourceId]/documents/extract/route";
import { POST as applyPost } from "@/app/api/workspaces/[workspaceId]/resources/[resourceId]/documents/apply-extraction/route";
import * as authModule from "@/auth";
import * as workspaceAuth from "@/lib/auth/workspace";
import * as dbModule from "@/db";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth/workspace", () => ({
  requireWorkspaceRole: vi.fn(),
}));

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

describe("API: Invoice Metadata Extraction & Confirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/workspaces/[id]/resources/[id]/documents/extract", () => {
    it("returns 401 when not authenticated", async () => {
      vi.mocked(authModule.auth).mockResolvedValue(null as unknown as Awaited<ReturnType<typeof authModule.auth>>);

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws1/resources/r1/documents/extract", {
        method: "POST",
        body: JSON.stringify({ text: "Hello world" }),
      });

      const res = await extractPost(req, {
        params: Promise.resolve({ workspaceId: "ws1", resourceId: "r1" }),
      });

      expect(res.status).toBe(401);
    });

    it("extracts invoice metadata from provided raw text", async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: { id: "user_1", email: "tester@example.com" },
        expires: "2099-01-01",
      } as unknown as Awaited<ReturnType<typeof authModule.auth>>);
      vi.mocked(workspaceAuth.requireWorkspaceRole).mockResolvedValue({
        id: "m_1",
        workspaceId: "ws1",
        userId: "user_1",
        role: "member",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const invoiceText = `
        GitHub, Inc.
        Invoice Date: 2026-05-10
        Due Date: 2026-06-10
        Total Due: $21.00 USD
        GitHub Pro Monthly
      `;

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws1/resources/r1/documents/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: invoiceText }),
      });

      const res = await extractPost(req, {
        params: Promise.resolve({ workspaceId: "ws1", resourceId: "r1" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.metadata.vendorName).toBe("GitHub");
      expect(json.metadata.amountMinor).toBe(2100);
      expect(json.metadata.currency).toBe("USD");
      expect(json.metadata.billingCycle).toBe("monthly");
    });
  });

  describe("POST /api/workspaces/[id]/resources/[id]/documents/apply-extraction", () => {
    it("updates resource with verified extraction parameters", async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: { id: "user_1", email: "admin@example.com" },
        expires: "2099-01-01",
      } as unknown as Awaited<ReturnType<typeof authModule.auth>>);
      vi.mocked(workspaceAuth.requireWorkspaceRole).mockResolvedValue({
        id: "m_1",
        workspaceId: "ws1",
        userId: "user_1",
        role: "member",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updatedRecord = {
        id: "res_123",
        workspaceId: "ws1",
        amountMinor: 4900,
        currency: "USD",
        billingCycle: "monthly",
      };

      const fakeDb = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([updatedRecord]),
            }),
          }),
        }),
      };
      vi.mocked(dbModule.getDb).mockReturnValue(fakeDb as unknown as ReturnType<typeof dbModule.getDb>);

      const req = new NextRequest("http://localhost:3000/api/workspaces/ws1/resources/res_123/documents/apply-extraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountMinor: 4900,
          currency: "USD",
          billingCycle: "monthly",
          renewalDate: "2026-10-15",
        }),
      });

      const res = await applyPost(req, {
        params: Promise.resolve({ workspaceId: "ws1", resourceId: "res_123" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.amountMinor).toBe(4900);
    });
  });
});
