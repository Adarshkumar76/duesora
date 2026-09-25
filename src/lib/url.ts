/**
 * Resolves the application base URL dynamically across environments
 * (Vercel serverless, custom production domain, Docker, local development, client browser).
 *
 * Priority order:
 * 1. Explicit appUrl argument (if passed and valid)
 * 2. process.env.APP_URL (user-configured custom domain)
 * 3. process.env.NEXTAUTH_URL (NextAuth canonical URL)
 * 4. process.env.VERCEL_PROJECT_PRODUCTION_URL (Vercel production domain without protocol)
 * 5. process.env.VERCEL_URL (Vercel deployment URL without protocol)
 * 6. Browser client: window.location.origin
 * 7. Default fallback: http://localhost:3000
 */
export function getAppBaseUrl(explicitUrl?: string): string {
  if (explicitUrl && typeof explicitUrl === "string" && explicitUrl.trim().length > 0) {
    return explicitUrl.trim().replace(/\/$/, "");
  }

  if (process.env.APP_URL && process.env.APP_URL.trim().length > 0) {
    return process.env.APP_URL.trim().replace(/\/$/, "");
  }

  if (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.trim().length > 0) {
    return process.env.NEXTAUTH_URL.trim().replace(/\/$/, "");
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    const raw = process.env.VERCEL_PROJECT_PRODUCTION_URL.trim();
    const url = raw.startsWith("http") ? raw : `https://${raw}`;
    return url.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    const raw = process.env.VERCEL_URL.trim();
    const url = raw.startsWith("http") ? raw : `https://${raw}`;
    return url.replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}
