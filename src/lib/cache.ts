// =============================================================================
// 🚀 STORESGO REDIS CACHE LAYER — Enterprise Query Cache
// =============================================================================
// Location: src/lib/cache.ts
// Cache-aside pattern with TTL. Eliminates repeated COUNT(*) and hot-path hits.
// Uses the already-installed `redis` v5.10.0 package.
// =============================================================================

import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | null = null;
let isConnected = false;

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const KEY_PREFIX = "sg:";

// TTL presets (seconds)
export const TTL = {
  SHORT: 30,       // product counts, homepage sections
  MEDIUM: 120,     // buy-seo pages, category detail
  LONG: 600,       // category tree, store stats
} as const;

export async function initCache(): Promise<void> {
  if (client && isConnected) return;
  try {
    client = createClient({ url: REDIS_URL });
    client.on("error", (err) => {
      console.error("[Cache] Redis error:", err.message);
      isConnected = false;
    });
    client.on("connect", () => {
      isConnected = true;
    });
    await client.connect();
    console.log("[Cache] Redis connected");
  } catch (err) {
    console.error("[Cache] Redis connect failed:", (err as Error).message);
    client = null;
    isConnected = false;
  }
}

async function cacheGet<T>(key: string): Promise<T | null> {
  if (!client || !isConnected) return null;
  try {
    const raw = await client.get(KEY_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw as string) as T;
  } catch {
    return null;
  }
}

async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!client || !isConnected) return;
  try {
    await client.set(KEY_PREFIX + key, JSON.stringify(value), { EX: ttlSeconds });
  } catch {
    // Cache is optional — DB is source of truth
  }
}

/**
 * Cache-aside: get from cache or compute + cache.
 * If Redis is down, falls through to fn() directly — never blocks.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;
  const result = await fn();
  cacheSet(key, result, ttlSeconds); // fire-and-forget
  return result;
}

export function isCacheReady(): boolean {
  return isConnected;
}
