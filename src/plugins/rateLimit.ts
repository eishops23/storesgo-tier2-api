/**
 * Rate Limiting Plugin for Fastify
 * Per-IP request throttling for sensitive endpoints
 */

import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

// Rate limit configuration
interface RateLimitConfig {
  max: number; // Maximum requests
  windowMs: number; // Time window in milliseconds
  message?: string;
  keyGenerator?: (request: FastifyRequest) => string;
}

// In-memory store for rate limiting (production should use Redis)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

/**
 * Default key generator - uses IP address
 */
function defaultKeyGenerator(request: FastifyRequest): string {
  // Check common proxy headers
  const forwardedFor = request.headers["x-forwarded-for"];
  if (forwardedFor) {
    const ip = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor.split(",")[0];
    return ip?.trim() || "unknown";
  }

  const realIp = request.headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  return request.ip || "unknown";
}

/**
 * Check rate limit for a request
 */
function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  // Create new entry if doesn't exist or expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    return {
      allowed: true,
      remaining: config.max - 1,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  
  if (entry.count > config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: config.max - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Create rate limit middleware with custom config
 */
export function createRateLimitMiddleware(config: Partial<RateLimitConfig> = {}) {
  const fullConfig: RateLimitConfig = {
    max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    message: "Too many requests, please try again later",
    keyGenerator: defaultKeyGenerator,
    ...config,
  };

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const key = fullConfig.keyGenerator!(request);
    const result = checkRateLimit(key, fullConfig);

    // Set rate limit headers
    reply.header("X-RateLimit-Limit", fullConfig.max);
    reply.header("X-RateLimit-Remaining", result.remaining);
    reply.header("X-RateLimit-Reset", Math.ceil(result.resetAt / 1000));

    if (!result.allowed) {
      reply.header("Retry-After", Math.ceil((result.resetAt - Date.now()) / 1000));
      
      request.log.warn({
        msg: "Rate limit exceeded",
        key,
        limit: fullConfig.max,
        windowMs: fullConfig.windowMs,
      });

      return reply.status(429).send({
        ok: false,
        error: fullConfig.message,
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      });
    }
  };
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  /**
   * Strict rate limiter for authentication endpoints
   * 5 requests per 15 minutes per IP
   */
  auth: createRateLimitMiddleware({
    max: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "Too many authentication attempts. Please try again in 15 minutes.",
  }),

  /**
   * Login rate limiter
   * 10 requests per 15 minutes per IP
   */
  login: createRateLimitMiddleware({
    max: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "Too many login attempts. Please try again later.",
  }),

  /**
   * Registration rate limiter
   * 3 requests per hour per IP
   */
  register: createRateLimitMiddleware({
    max: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many registration attempts. Please try again later.",
  }),

  /**
   * Checkout/Order rate limiter
   * 10 orders per hour per IP
   */
  checkout: createRateLimitMiddleware({
    max: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many orders placed. Please try again later.",
  }),

  /**
   * Password reset rate limiter
   * 3 requests per hour per IP
   */
  passwordReset: createRateLimitMiddleware({
    max: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many password reset attempts. Please try again later.",
  }),

  /**
   * API general rate limiter
   * 100 requests per minute per IP
   */
  api: createRateLimitMiddleware({
    max: 100,
    windowMs: 60 * 1000, // 1 minute
    message: "Too many requests. Please slow down.",
  }),

  /**
   * Bulk upload rate limiter
   * 5 uploads per hour per IP
   */
  bulkUpload: createRateLimitMiddleware({
    max: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many bulk uploads. Please try again later.",
  }),
};

/**
 * Fastify plugin to add rate limiting to the app
 */
async function rateLimitPlugin(app: FastifyInstance) {
  // Decorate app with rate limiters
  app.decorate("rateLimiters", rateLimiters);

  app.log.info("✅ Rate limiting plugin registered");
}

export default fp(rateLimitPlugin, {
  name: "rateLimit",
  fastify: "5.x",
});

// Type declaration for Fastify
declare module "fastify" {
  interface FastifyInstance {
    rateLimiters: typeof rateLimiters;
  }
}

