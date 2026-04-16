// ======================================================
// ⚡ STORESGO BACKEND — SIMPLE IN-MEMORY CACHE
// ======================================================

const cache = new Map<string, any>();

export default {
  get(key: string) {
    return cache.get(key);
  },
  set(key: string, value: any, ttl = 60000) {
    cache.set(key, value);
    setTimeout(() => cache.delete(key), ttl);
  },
  clear() {
    cache.clear();
  },
};
