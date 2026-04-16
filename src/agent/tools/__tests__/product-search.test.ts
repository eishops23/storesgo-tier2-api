// Agent Suite — product search tool tests (Phase 0 Part C)

import { describe, it, expect, vi } from 'vitest';
import { searchProductsTool } from '../catalog/product-search.js';
import type { ToolContext } from '../types.js';

function makeMockPrisma(products: any[] = [], count?: number): any {
  return {
    product: {
      findMany: vi.fn().mockResolvedValue(products),
      count: vi.fn().mockResolvedValue(count ?? products.length),
    },
  };
}

function makeCtx(prisma: any): ToolContext {
  return {
    sessionId: 'sess-1',
    featureKey: 'cs_chat',
    conversationId: 'conv-1',
    messageId: 'msg-1',
    prisma,
  };
}

describe('search_products tool', () => {
  it('has correct metadata', () => {
    expect(searchProductsTool.name).toBe('search_products');
    expect(searchProductsTool.requiredAutonomy).toBe('L0');
    expect(searchProductsTool.reversible).toBe(true);
    expect(searchProductsTool.tags).toContain('read');
    expect(searchProductsTool.tags).toContain('product');
  });

  it('returns products matching query', async () => {
    const products = [
      { id: 1, name: 'Jerk Seasoning', slug: 'jerk-seasoning', priceCents: 599, currency: 'USD', imageUrl: null, sellerId: 1, categoryId: 5, isActive: true },
      { id: 2, name: 'Jerk Sauce', slug: 'jerk-sauce', priceCents: 799, currency: 'USD', imageUrl: null, sellerId: 2, categoryId: 5, isActive: true },
    ];
    const prisma = makeMockPrisma(products, 15);
    const ctx = makeCtx(prisma);

    const result = await searchProductsTool.execute({ query: 'jerk', limit: 10 }, ctx);

    expect(result.products).toHaveLength(2);
    expect(result.totalFound).toBe(15);
    expect(result.query).toBe('jerk');
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          name: { contains: 'jerk', mode: 'insensitive' },
        }),
        take: 10,
      }),
    );
  });

  it('applies categoryId filter when provided', async () => {
    const prisma = makeMockPrisma([]);
    const ctx = makeCtx(prisma);

    await searchProductsTool.execute({ query: 'rice', limit: 5, categoryId: 42 }, ctx);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ categoryId: 42 }),
      }),
    );
  });

  it('respects limit parameter', async () => {
    const prisma = makeMockPrisma([]);
    const ctx = makeCtx(prisma);

    await searchProductsTool.execute({ query: 'test', limit: 25 }, ctx);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 25 }),
    );
  });

  it('returns empty results when nothing matches', async () => {
    const prisma = makeMockPrisma([], 0);
    const ctx = makeCtx(prisma);

    const result = await searchProductsTool.execute({ query: 'zzzzz', limit: 10 }, ctx);

    expect(result.products).toHaveLength(0);
    expect(result.totalFound).toBe(0);
  });

  it('propagates Prisma errors', async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockRejectedValue(new Error('DB connection failed')),
        count: vi.fn().mockRejectedValue(new Error('DB connection failed')),
      },
    };
    const ctx = makeCtx(prisma);

    await expect(
      searchProductsTool.execute({ query: 'test', limit: 10 }, ctx),
    ).rejects.toThrow('DB connection failed');
  });

  it('validates args with Zod schema', () => {
    // Valid
    expect(searchProductsTool.argsSchema.safeParse({ query: 'rice' }).success).toBe(true);
    expect(searchProductsTool.argsSchema.safeParse({ query: 'rice', limit: 5 }).success).toBe(true);
    expect(searchProductsTool.argsSchema.safeParse({ query: 'rice', categoryId: 10 }).success).toBe(true);

    // Invalid
    expect(searchProductsTool.argsSchema.safeParse({}).success).toBe(false);
    expect(searchProductsTool.argsSchema.safeParse({ query: '' }).success).toBe(false);
    expect(searchProductsTool.argsSchema.safeParse({ query: 'x', limit: 0 }).success).toBe(false);
    expect(searchProductsTool.argsSchema.safeParse({ query: 'x', limit: 51 }).success).toBe(false);
  });
});
