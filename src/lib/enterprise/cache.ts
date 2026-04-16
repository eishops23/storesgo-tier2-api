/* eslint-disable */
// @ts-nocheck
/**
 * Enterprise Redis Cache Layer
 */
import Redis from "ioredis";

let redisClient: any = null;

export function getRedis() {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
      maxRetriesPerRequest: null,
    });
    redisClient.on("error", (err: any) => console.error("[Redis]", err.message));
  }
  return redisClient;
}

export const CACHE_TTL = { HOMEPAGE: 60, CATEGORIES: 300, PRODUCTS_LIST: 30 } as const;
export const CACHE_KEYS = { HOMEPAGE: "cache:homepage", CATEGORIES: "cache:categories" } as const;

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await getRedis().get(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

export async function cacheSet(key: string, value: unknown, ttl: number): Promise<void> {
  try { await getRedis().setex(key, ttl, JSON.stringify(value)); } catch {}
}

export async function cacheAside<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;
  const data = await fn();
  cacheSet(key, data, ttl);
  return data;
}
