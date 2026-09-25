import { NextResponse } from "next/server";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in milliseconds
  retryAfterSeconds: number;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface WindowBucket {
  timestamps: number[];
}

// In-memory sliding window bucket store
const rateLimitStore = new Map<string, WindowBucket>();

// Predefined security rate limit configurations
export const RATE_LIMITS = {
  // Authentication, login & registration attempts: 5 requests per minute
  AUTH: { maxRequests: 5, windowMs: 60 * 1000 },
  // Critical mutations (e.g. Danger zone, delete workspace): 5 requests per minute
  STRICT: { maxRequests: 5, windowMs: 60 * 1000 },
  // Developer API key calls: 60 requests per minute
  API_KEYS: { maxRequests: 60, windowMs: 60 * 1000 },
  // Standard operational endpoints: 120 requests per minute
  STANDARD: { maxRequests: 120, windowMs: 60 * 1000 },
} as const;

/**
 * Extracts client IP address from standard reverse-proxy headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}

/**
 * Evaluates whether a request exceeds the sliding window rate limit
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.STANDARD
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let bucket = rateLimitStore.get(identifier);
  if (!bucket) {
    bucket = { timestamps: [] };
    rateLimitStore.set(identifier, bucket);
  }

  // Filter timestamps that fall outside the active window
  bucket.timestamps = bucket.timestamps.filter((ts) => ts > windowStart);

  if (bucket.timestamps.length >= config.maxRequests) {
    // Earliest timestamp inside the window determines reset time
    const oldestTimestamp = bucket.timestamps[0];
    const reset = oldestTimestamp + config.windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((reset - now) / 1000));

    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset,
      retryAfterSeconds,
    };
  }

  // Add current hit
  bucket.timestamps.push(now);

  const remaining = config.maxRequests - bucket.timestamps.length;
  const reset = now + config.windowMs;

  return {
    success: true,
    limit: config.maxRequests,
    remaining,
    reset,
    retryAfterSeconds: 0,
  };
}

/**
 * Constructs a standardized HTTP 429 Too Many Requests response with standard rate limit headers
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  requestUrl?: string
): NextResponse {
  let fallbackUrl = "http://localhost:3000/login?error=TooManyRequests";
  if (requestUrl) {
    try {
      const u = new URL(requestUrl);
      fallbackUrl = `${u.origin}/login?error=TooManyRequests`;
    } catch {
      // Keep default fallback
    }
  }

  return NextResponse.json(
    {
      url: fallbackUrl,
      error: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Please retry in ${result.retryAfterSeconds} seconds.`,
      retryAfter: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": Math.ceil(result.reset / 1000).toString(),
        "Retry-After": result.retryAfterSeconds.toString(),
      },
    }
  );
}

/**
 * Clears the in-memory rate limit store (useful for automated testing)
 */
export function resetRateLimits(): void {
  rateLimitStore.clear();
}
