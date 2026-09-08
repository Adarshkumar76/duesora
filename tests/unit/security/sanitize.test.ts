import { describe, it, expect } from "vitest";
import {
  sanitizeString,
  stripHtml,
  escapeHtml,
  sanitizeEmail,
  isSafeUrl,
  sanitizeUrl,
} from "@/lib/security/sanitize";

describe("Security Sanitization Utility", () => {
  describe("sanitizeString", () => {
    it("strips null bytes used in poisoning attacks", () => {
      const malicious = "admin\0' OR 1=1--";
      expect(sanitizeString(malicious)).toBe("admin' OR 1=1--");
    });

    it("strips invisible control characters", () => {
      const controlChars = "\x01\x02Hello\x1F World\x7F";
      expect(sanitizeString(controlChars)).toBe("Hello World");
    });

    it("trims excess whitespace", () => {
      expect(sanitizeString("   valid input   ")).toBe("valid input");
    });
  });

  describe("stripHtml", () => {
    it("removes <script> tags and their contents", () => {
      const xss = "Hello <script>alert('xss')</script>World";
      expect(stripHtml(xss)).toBe("Hello World");
    });

    it("removes nested/complex script tags", () => {
      const complex = "Test<SCRIPT SRC=http://evil.com/xss.js></SCRIPT>";
      expect(stripHtml(complex)).toBe("Test");
    });

    it("removes HTML tags like <img> with onerror event handlers", () => {
      const imgXss = '<img src="x" onerror="alert(1)">Image';
      expect(stripHtml(imgXss)).toBe("Image");
    });

    it("removes inline javascript: links", () => {
      const jsLink = '<a href="javascript:alert(1)">Click here</a>';
      expect(stripHtml(jsLink)).toBe("Click here");
    });

    it("removes iframe elements", () => {
      const iframe = '<iframe src="http://attacker.com"></iframe>Safe';
      expect(stripHtml(iframe)).toBe("Safe");
    });
  });

  describe("escapeHtml", () => {
    it("escapes dangerous HTML characters", () => {
      const raw = '<div class="test" data=\'val\'>&/</div>';
      const escaped = escapeHtml(raw);
      expect(escaped).not.toContain("<");
      expect(escaped).not.toContain(">");
      expect(escaped).not.toContain('"');
      expect(escaped).toContain("&lt;div");
      expect(escaped).toContain("&amp;&#x2F;");
    });
  });

  describe("sanitizeEmail", () => {
    it("removes CRLF injection characters", () => {
      const crlf = "attacker@example.com\r\nBcc: victim@example.com";
      expect(sanitizeEmail(crlf)).toBe("attacker@example.combcc: victim@example.com");
    });

    it("converts email to lowercase and trims whitespace", () => {
      expect(sanitizeEmail("   User@Domain.COM  ")).toBe("user@domain.com");
    });
  });

  describe("isSafeUrl & sanitizeUrl", () => {
    it("allows standard http and https URLs", () => {
      expect(isSafeUrl("https://example.com")).toBe(true);
      expect(isSafeUrl("http://localhost:3000")).toBe(true);
      expect(sanitizeUrl("https://google.com/path")).toBe("https://google.com/path");
    });

    it("rejects javascript: pseudo-protocol", () => {
      expect(isSafeUrl("javascript:alert(1)")).toBe(false);
      expect(sanitizeUrl("javascript:alert(1)")).toBe(null);
    });

    it("rejects data: URI schemes", () => {
      expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBe(null);
    });

    it("rejects vbscript: and file: schemes", () => {
      expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
      expect(isSafeUrl("file:///etc/passwd")).toBe(false);
    });
  });
});
