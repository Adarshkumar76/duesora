import { NextRequest } from "next/server";
import { auth } from "@/auth";

export interface CronAuthResult {
  authorized: boolean;
  reason?: string;
  source: "cron_secret" | "session" | "dev_mode";
}

export async function verifyCronAuthorization(request: NextRequest): Promise<CronAuthResult> {
  const cronSecret = process.env.CRON_SECRET;

  // 1. Check Authorization header (Bearer token)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (cronSecret && token === cronSecret) {
      return { authorized: true, source: "cron_secret" };
    }
    if (token === "duesora-dev-cron-secret" && process.env.NODE_ENV !== "production") {
      return { authorized: true, source: "dev_mode" };
    }
  }

  // 2. Check x-cron-secret custom header
  const customHeader = request.headers.get("x-cron-secret");
  if (customHeader) {
    if (cronSecret && customHeader === cronSecret) {
      return { authorized: true, source: "cron_secret" };
    }
    if (customHeader === "duesora-dev-cron-secret" && process.env.NODE_ENV !== "production") {
      return { authorized: true, source: "dev_mode" };
    }
  }

  // 3. Check ?secret= query parameter
  const querySecret = request.nextUrl.searchParams.get("secret");
  if (querySecret) {
    if (cronSecret && querySecret === cronSecret) {
      return { authorized: true, source: "cron_secret" };
    }
    if (querySecret === "duesora-dev-cron-secret" && process.env.NODE_ENV !== "production") {
      return { authorized: true, source: "dev_mode" };
    }
  }

  // 4. Check active authenticated session (allows triggering from UI)
  try {
    const session = await auth();
    if (session?.user?.id) {
      return { authorized: true, source: "session" };
    }
  } catch {}

  // 5. Dev mode fallback when CRON_SECRET is not configured in environment
  if (!cronSecret && process.env.NODE_ENV !== "production") {
    return { authorized: true, source: "dev_mode" };
  }

  return {
    authorized: false,
    reason: "Missing or invalid cron authorization secret",
    source: "cron_secret",
  };
}
