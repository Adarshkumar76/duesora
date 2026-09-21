import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/workspaces/[workspaceId]/resources/export/route";
import { POST } from "@/app/api/workspaces/[workspaceId]/resources/import/route";
import { auth } from "@/auth";
import {
  exportWorkspaceResources,
  previewImport,
  commitImport,
} from "@/lib/import-export/service";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/import-export/service", () => ({
  exportWorkspaceResources: vi.fn(),
  previewImport: vi.fn(),
  commitImport: vi.fn(),
}));

describe("API: Workspace Import & Export Routes", () => {
  const context = {
    params: Promise.resolve({ workspaceId: "ws-test-456" }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/workspaces/[workspaceId]/resources/export", () => {
    it("returns 401 UNAUTHORIZED when session is missing", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-456/resources/export?format=csv");
      const response = await GET(request, context);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(exportWorkspaceResources).not.toHaveBeenCalled();
    });

    it("returns 403 FORBIDDEN when user lacks viewer permissions", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-unauthorized" },
      } as never);

      vi.mocked(exportWorkspaceResources).mockRejectedValue(new Error("FORBIDDEN"));

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-456/resources/export?format=csv");
      const response = await GET(request, context);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("returns CSV file attachment with proper headers", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-authorized" },
      } as never);

      vi.mocked(exportWorkspaceResources).mockResolvedValue({
        content: "Name,Type\nItem,subscription",
        contentType: "text/csv; charset=utf-8",
        filename: "duesora_resources_2026-09-21.csv",
      });

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-456/resources/export?format=csv");
      const response = await GET(request, context);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
      expect(response.headers.get("Content-Disposition")).toContain("duesora_resources_2026-09-21.csv");

      const text = await response.text();
      expect(text).toBe("Name,Type\nItem,subscription");
      expect(exportWorkspaceResources).toHaveBeenCalledWith("user-authorized", "ws-test-456", "csv");
    });

    it("returns JSON file attachment when format=json", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-authorized" },
      } as never);

      const jsonString = JSON.stringify({ version: "1.0", resources: [] });
      vi.mocked(exportWorkspaceResources).mockResolvedValue({
        content: jsonString,
        contentType: "application/json; charset=utf-8",
        filename: "duesora_resources_2026-09-21.json",
      });

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-456/resources/export?format=json");
      const response = await GET(request, context);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
      expect(exportWorkspaceResources).toHaveBeenCalledWith("user-authorized", "ws-test-456", "json");
    });
  });

  describe("POST /api/workspaces/[workspaceId]/resources/import", () => {
    it("returns 401 UNAUTHORIZED when session is missing", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-456/resources/import", {
        method: "POST",
        body: JSON.stringify({ mode: "preview", content: "Name,Type\nApp,subscription" }),
      });
      const response = await POST(request, context);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 400 when preview mode is requested without content", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-authorized" },
      } as never);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-456/resources/import", {
        method: "POST",
        body: JSON.stringify({ mode: "preview" }),
      });
      const response = await POST(request, context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 with preview result on preview mode", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-authorized" },
      } as never);

      const mockPreviewResult = {
        totalRows: 1,
        validCount: 1,
        invalidCount: 0,
        duplicateCount: 0,
        validRows: [
          {
            rowIndex: 1,
            data: {
              name: "Figma",
              type: "subscription" as const,
              category: "Design",
              provider: "Figma",
              websiteUrl: null,
              amountMinor: 1200,
              currency: "USD",
              billingCycle: "monthly" as const,
              renewalDate: null,
              autoRenew: true,
              tags: [],
            },
            isDuplicate: false,
          },
        ],
        invalidRows: [],
      };

      vi.mocked(previewImport).mockResolvedValue(mockPreviewResult);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-456/resources/import", {
        method: "POST",
        body: JSON.stringify({
          mode: "preview",
          format: "csv",
          content: "Name,Type\nFigma,subscription",
        }),
      });

      const response = await POST(request, context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.validCount).toBe(1);
      expect(previewImport).toHaveBeenCalledWith(
        "user-authorized",
        "ws-test-456",
        "Name,Type\nFigma,subscription",
        "csv"
      );
    });

    it("returns 200 with commit result on commit mode", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-authorized" },
      } as never);

      vi.mocked(commitImport).mockResolvedValue({
        importedCount: 2,
        failedCount: 0,
      });

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-456/resources/import", {
        method: "POST",
        body: JSON.stringify({
          mode: "commit",
          rows: [
            { name: "App 1", type: "subscription", tags: [] },
            { name: "App 2", type: "domain", tags: [] },
          ],
        }),
      });

      const response = await POST(request, context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.importedCount).toBe(2);
      expect(commitImport).toHaveBeenCalled();
    });

    it("returns 400 when commit mode is called without rows array", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-authorized" },
      } as never);

      const request = new NextRequest("http://localhost:3000/api/workspaces/ws-test-456/resources/import", {
        method: "POST",
        body: JSON.stringify({ mode: "commit" }),
      });

      const response = await POST(request, context);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
