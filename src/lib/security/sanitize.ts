/**
 * Security & Sanitization Utility for Duesora
 * Defends against:
 * 1. Stored & Reflected Cross-Site Scripting (XSS)
 * 2. SQL Injection / Null Byte Poisoning (\0)
 * 3. CRLF / HTTP Header / Email Injection
 * 4. Dangerous URI Schemes (javascript:, data:, vbscript:)
 */

/**
 * Strips null bytes, invalid control characters, and leading/trailing whitespace.
 * Null bytes (\0) are commonly used to exploit C-based libraries and database drivers.
 */
export function sanitizeString(val: string): string {
  if (typeof val !== "string") return "";
  return val
    // Remove null bytes and dangerous control characters (except newline \n and tab \t if needed)
    .replace(/\0/g, "")
    // Remove invisible control characters (ASCII 1-8, 11, 12, 14-31)
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
}

/**
 * Strips HTML tags, script blocks, iframe tags, event handlers (onclick, onerror),
 * and dangerous protocols to protect against stored and reflected XSS.
 */
export function stripHtml(val: string): string {
  if (typeof val !== "string") return "";
  const cleaned = sanitizeString(val);
  return cleaned
    // Remove <script>...</script> including content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove <style>...</style> including content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    // Remove all remaining HTML/XML tags
    .replace(/<\/?[^>]+(>|$)/g, "")
    // Remove dangerous URI prefixes
    .replace(/javascript\s*:/gi, "")
    .replace(/vbscript\s*:/gi, "")
    .replace(/data\s*:\s*text\/html/gi, "")
    // Remove inline event handlers like onclick=, onerror=, etc.
    .replace(/\bon\w+\s*=/gi, "")
    // Collapse multiple spaces created by removed tags into a single space
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * Escapes characters that have special meaning in HTML to prevent XSS.
 */
export function escapeHtml(val: string): string {
  if (typeof val !== "string") return "";
  return val
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Strictly sanitizes an email address.
 * Disallows newlines/CRLF (prevents email header injection) and null bytes.
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== "string") return "";
  return email
    .replace(/[\r\n\0]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Validates that a URL uses safe HTTP or HTTPS protocols.
 * Rejects javascript:, data:, file:, and other unsafe URI schemes.
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Sanitizes a URL, returning null if the scheme is dangerous.
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = sanitizeString(url);
  return isSafeUrl(trimmed) ? trimmed : null;
}
