import { describe, it, expect } from "vitest";
import { packTarGz, unpackTarGz, computeSha256 } from "@/cli/archive";

describe("CLI Pure Node.js Archive Engine", () => {
  it("computes accurate SHA-256 checksums", () => {
    const hash = computeSha256(Buffer.from("test-content"));
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(computeSha256(Buffer.from("test-content"))).toBe(hash);
  });

  it("packs and extracts files in tar.gz format without data corruption", () => {
    const entries = [
      {
        path: "manifest.json",
        data: Buffer.from(JSON.stringify({ version: "0.1.0", test: true }, null, 2), "utf8"),
      },
      {
        path: "database.json",
        data: Buffer.from(JSON.stringify({ users: [{ id: "1", name: "Alice" }] }), "utf8"),
      },
      {
        path: "attachments/sample.pdf",
        data: Buffer.from("PDF-MOCK-BINARY-CONTENT-12345", "utf8"),
      },
    ];

    const tarGzBuffer = packTarGz(entries);
    expect(tarGzBuffer.length).toBeGreaterThan(0);

    const extracted = unpackTarGz(tarGzBuffer);
    expect(extracted.length).toBe(3);

    const manifestEntry = extracted.find((e) => e.path === "manifest.json");
    expect(manifestEntry).toBeDefined();
    expect(JSON.parse(manifestEntry!.data.toString("utf8"))).toEqual({ version: "0.1.0", test: true });

    const dbEntry = extracted.find((e) => e.path === "database.json");
    expect(dbEntry).toBeDefined();
    expect(JSON.parse(dbEntry!.data.toString("utf8"))).toEqual({ users: [{ id: "1", name: "Alice" }] });

    const fileEntry = extracted.find((e) => e.path === "attachments/sample.pdf");
    expect(fileEntry).toBeDefined();
    expect(fileEntry!.data.toString("utf8")).toBe("PDF-MOCK-BINARY-CONTENT-12345");
  });

  it("handles empty files and nested folders properly", () => {
    const entries = [
      {
        path: "nested/folder/note.txt",
        data: Buffer.from("hello deep world", "utf8"),
      },
    ];

    const archive = packTarGz(entries);
    const extracted = unpackTarGz(archive);

    expect(extracted.length).toBe(1);
    expect(extracted.find((e) => e.path === "nested/folder/note.txt")?.data.toString("utf8")).toBe(
      "hello deep world"
    );
  });
});

