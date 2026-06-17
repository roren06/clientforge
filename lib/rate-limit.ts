import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

type RateLimitOptions = {
  key: string;
  limit: number;
  window: `${number} s` | `${number} m` | `${number} h` | `${number} d`;
  message?: string;
};

type MemoryEntry = {
  count: number;
  resetAt: number;
};

const memoryStore = new Map<string, MemoryEntry>();
const upstashLimiters = new Map<string, Ratelimit>();

function getIpAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function getWindowMs(window: RateLimitOptions["window"]) {
  const [amount, unit] = window.split(" ");
  const value = Number(amount);

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 60 * 1000;
  }
}

function getUpstashLimiter(options: RateLimitOptions) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  const cacheKey = `${options.key}:${options.limit}:${options.window}`;
  const cached = upstashLimiters.get(cacheKey);

  if (cached) {
    return cached;
  }

  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(options.limit, options.window),
    prefix: `clientforge:${options.key}`,
  });

  upstashLimiters.set(cacheKey, limiter);
  return limiter;
}

function buildRateLimitResponse(message?: string, reset?: number) {
  const retryAfter = reset
    ? Math.max(1, Math.ceil((reset - Date.now()) / 1000))
    : 60;

  return NextResponse.json(
    { error: message || "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
      },
    }
  );
}

export async function rateLimit(
  request: Request,
  options: RateLimitOptions & { identifier?: string }
) {
  const identifier = options.identifier || getIpAddress(request);
  const key = `${options.key}:${identifier}`;
  const upstashLimiter = getUpstashLimiter(options);

  if (upstashLimiter) {
    const result = await upstashLimiter.limit(identifier);

    if (!result.success) {
      return buildRateLimitResponse(options.message, result.reset);
    }

    return null;
  }

  const now = Date.now();
  const windowMs = getWindowMs(options.window);
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return null;
  }

  if (entry.count >= options.limit) {
    return buildRateLimitResponse(options.message, entry.resetAt);
  }

  entry.count += 1;
  return null;
}

export function rateLimitKey(...parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(":");
}
