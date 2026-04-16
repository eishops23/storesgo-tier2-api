// Agent Suite — CS Chat store context cache (Phase 1 Prompt 3)

import { getPrisma } from '../../storage/prisma-client.js';
import { createChildLogger } from '../../observability/index.js';

const log = createChildLogger({ subsystem: 'cs-chat-context' });

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface StoreContext {
  productCount: number;
  activeSellerCount: number;
  categoryCount: number;
  orderCount: number;
  sellerNames: string[];
  categoryNames: string[];
  cachedAt: number;
}

let cached: StoreContext | null = null;

export async function getStoreContext(): Promise<StoreContext> {
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  const prisma = getPrisma();

  const [productCount, sellerCount, categoryCount, orderCount, sellers, categories] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.seller.count({ where: { isApproved: true } }),
    prisma.category.count(),
    prisma.order.count(),
    prisma.seller.findMany({
      where: { isApproved: true },
      select: { storeName: true },
      take: 10,
    }),
    prisma.category.findMany({
      where: { parentId: null },
      select: { name: true },
      take: 20,
    }),
  ]);

  cached = {
    productCount,
    activeSellerCount: sellerCount,
    categoryCount,
    orderCount,
    sellerNames: sellers.map((s: any) => s.storeName),
    categoryNames: categories.map((c: any) => c.name),
    cachedAt: Date.now(),
  };

  log.info(
    { productCount, sellerCount, categoryCount },
    'Store context cache refreshed',
  );

  return cached;
}

export function _clearStoreContextCache(): void {
  cached = null;
}
