import { describe, expect, it } from "vitest";
import { parseCsv, serializeCsv, sanitizeCsvCell } from "@/lib/import-export/csv";

describe("CSV Serializer and Parser", () => {
  describe("sanitizeCsvCell (Formula Injection Defense)", () => {
    it("neutralizes formula trigger characters with leading apostrophe", () => {
      expect(sanitizeCsvCell("=1+1")).toBe("'=1+1");
      expect(sanitizeCsvCell("+cmd|' /C calc'!A0")).toBe("'+cmd|' /C calc'!A0");
      expect(sanitizeCsvCell("-5")).toBe("'-5");
      expect(sanitizeCsvCell("@SUM(A1:A10)")).toBe("'@SUM(A1:A10)");
      expect(sanitizeCsvCell("\tmalicious")).toBe("'\tmalicious");
      expect(sanitizeCsvCell("\rmalicious")).toBe("\"'\rmalicious\"");
    });

    it("leaves safe strings and numbers untouched", () => {
      expect(sanitizeCsvCell("Regular Name")).toBe("Regular Name");
      expect(sanitizeCsvCell("domain.com")).toBe("domain.com");
      expect(sanitizeCsvCell("100.50")).toBe("100.50");
      expect(sanitizeCsvCell("")).toBe("");
    });
  });

  describe("serializeCsv", () => {
    it("formats standard tabular data into RFC-4180 CSV with CRLF endings", () => {
      const headers = ["Name", "Type", "Amount"];
      const rows = [
        ["GitHub", "subscription", "10.00"],
        ["Vercel", "hosting", "20.00"],
      ];

      const csv = serializeCsv(headers, rows);
      expect(csv).toContain("Name,Type,Amount\r\n");
      expect(csv).toContain("GitHub,subscription,10.00\r\n");
      expect(csv).toContain("Vercel,hosting,20.00");
    });

    it("escapes internal quotes and wraps multi-line content", () => {
      const headers = ["Title", "Notes"];
      const rows = [
        ['Quoted "Word"', "Line 1\nLine 2"],
      ];

      const csv = serializeCsv(headers, rows);
      expect(csv).toContain('"Quoted ""Word"""');
      expect(csv).toContain('"Line 1\nLine 2"');
    });
  });

  describe("parseCsv", () => {
    it("parses valid RFC-4180 CSV text into headers and rows", () => {
      const csv = 'Name,Type,Amount\r\n"GitHub Enterprise",subscription,"21.00"\r\n"AWS",cloud_service,"150.00"';
      const { headers, rows } = parseCsv(csv);

      expect(headers).toEqual(["Name", "Type", "Amount"]);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual(["GitHub Enterprise", "subscription", "21.00"]);
      expect(rows[1]).toEqual(["AWS", "cloud_service", "150.00"]);
    });

    it("handles CRLF line breaks correctly", () => {
      const csv = "Name,Type\r\nStripe,custom\r\nGoogle Cloud,cloud_service\r\n";
      const { headers, rows } = parseCsv(csv);

      expect(headers).toEqual(["Name", "Type"]);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual(["Stripe", "custom"]);
    });

    it("strips formula injection escape apostrophes on parse", () => {
      const csv = 'Name,Amount\n"\'=SUM(A1:A2)",100';
      const { rows } = parseCsv(csv);

      expect(rows[0][0]).toBe("=SUM(A1:A2)");
    });

    it("handles empty lines without throwing", () => {
      const csv = "\n\nName,Type\n\nApp,subscription\n\n";
      const { headers, rows } = parseCsv(csv);

      expect(headers).toEqual(["Name", "Type"]);
      expect(rows).toHaveLength(1);
    });
  });
});
