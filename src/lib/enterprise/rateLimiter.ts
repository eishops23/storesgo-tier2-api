/**
 * Enterprise Distributed Rate Limiter
 * Redis-backed rate limiting that works across cluster instances
 */
import { getRedis } from "./cache.js";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

interface RateLimitConfig {
  keyPrefix: string;
  maxRequests: number;
  windowSeconds: number;
}

// Pre-configured rate limits for different endpoints
export const RATE_LIMITS = {
  // Auth endpoints - strict limits
  LOGIN: { keyPrefix: "rl:login", maxRequests: 5, windowSeconds: 60 },
  REGISTER: { keyPrefix: "rl:register", maxRequests: 3, windowSeconds: 300 },
  PASSWORD_RESET: { keyPrefix: "rl:pwreset", maxRequests: 3, windowSeconds: 600 },
  
  // API endpoints - balanced limits
  API_READ: { keyPrefix: "rl:api:read", maxRequests: 100, windowSeconds: 60 },
  API_WRITE: { keyPrefix: "rl:api:write", maxRequests: 30, windowSeconds: 60 },
  
  // Search - slightly higher
  SEARCH: { keyPrefix: "rl:search", maxRequests: 60, windowSeconds: 60 },
  
  // Checkout - protect against abuse
  CHECKOUT: { keyPrefix: "rl:checkout", maxRequests: 10, windowSeconds: 60 },
  
  // Orders - reasonable limits
  ORDERS: { keyPrefix: "rl:orders", maxRequests: 20, windowSeconds: 60 },
  
  // Webhooks - higher limits for external services
  WEBHOOK: { keyPrefix: "rl:webhook", maxRequests: 200, windowSeconds: 60 },
} as const;

/**
 * Check rate limit using Redis sliding window
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedis();
  const key = `${config.keyPrefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - (config.windowSeconds * 1000);
  
  try {
    // Use Redis transaction for atomic operations
    const multi = redis.multi();
    
    // Remove old entries outside the window
    multi.zremrangebyscore(key, 0, windowStart);
    
    // Count requests in current window
    multi.zcard(key);
    
    // Add current request
    multi.zadd(key, now.toString(), `${now}-${Math.random()}`);
    
    // Set expiry on the key
    multi.expire(key, config.windowSeconds);
    
    const results = await multi.exec();
    
    // results[1] is the count before adding current request
    const currentCount = (results?.[1]?.[1] as number) || 0;
    const allowed = currentCount < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - currentCount - 1);
    const resetAt = now + (config.windowSeconds * 1000);
    
    return {
      allowed,
      remaining,
      resetAt,
      retryAfter: allowed ? undefined : config.windowSeconds,
    };
  } catch (err) {
    console.error(`[RateLimit] Error for ${key}:`, err);
    // Fail open - allow request if Redis is down
    return { allowed: true, remaining: config.maxRequests, resetAt: now };
  }
}

/**
 * Get client identifier from request
 */
export function getClientId(request: any): string {
  // Check for authenticated user
  if (request.user?.id) {
    return `user:${request.user.id}`;
  }
  
  // Fall back to IP
  const forwarded = request.headers["x-forwarded-for"];
  if (forwarded) {
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return `ip:${ip.trim()}`;
  }
  
  const realIp = request.headers["x-real-ip"];
  if (realIp) {
    return `ip:${Array.isArray(realIp) ? realIp[0] : realIp}`;
  }
  
  return `ip:${request.ip || "unknown"}`;
}

/**
 * Fastify preHandler for rate limiting
 */
export function createRateLimitHandler(config: RateLimitConfig) {
  return async (request: any, reply: any) => {
    const clientId = getClientId(request);
    const result = await checkRateLimit(clientId, config);
    
    // Set rate limit headers
    reply.header("X-RateLimit-Limit", config.maxRequests);
    reply.header("X-RateLimit-Remaining", result.remaining);
    reply.header("X-RateLimit-Reset", result.resetAt);
    
    if (!result.allowed) {
      reply.header("Retry-After", result.retryAfter);
      return reply.status(429).send({
        ok: false,
        error: "Too many requests",
        retryAfter: result.retryAfter,
      });
    }
  };
}
