import { handlers } from "@/auth";
import { NextRequest } from "next/server";
import {
  getClientIp,
  checkRateLimit,
  createRateLimitResponse,
  RATE_LIMITS,
} from "@/lib/security/rate-limiter";

export const { GET } = handlers;

export async function POST(req: NextRequest) {
  const pathname = req.nextUrl?.pathname || "";

  // Apply rate limiting to credential login attempts (prevent brute-force sign-in)
  if (pathname.includes("/callback/credentials") || pathname.includes("/signin/credentials")) {
    const clientIp = getClientIp(req);
    const rateLimitCheck = checkRateLimit(`login:${clientIp}`, RATE_LIMITS.AUTH);
    if (!rateLimitCheck.success) {
      return createRateLimitResponse(rateLimitCheck);
    }
  }

  return handlers.POST(req);
}