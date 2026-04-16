// Agent Suite — get_seller_info tool tests (Phase 1 Prompt 2)

import { describe, it, expect, vi } from 'vitest';
import { getSellerInfoTool } from '../get-seller-info.js';
import type { ToolContext } from '../../types.js';

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    sessionId: 'sess-1',
    featureKey: 'cs_chat',
    conversationId: 'conv-1',
    messageId: 'msg-1',
    prisma: undefined as any,
    ...overrides,
  };
}

function makeMockPrisma(seller: any = null): any {
  return {
    seller: {
      findUnique: vi.fn().mockResolvedValue(seller),
    },
  };
}

const sampleSeller = {
  id: 5,
  slug: 'caribbean-spice',
  storeName: 'Caribbean Spice',
  city: 'Miami',
  state: 'FL',
  about: 'Authentic Caribbean groceries',
  _count: { products: 150 },
};

describe('get_seller_info tool', () => {
  it('has correct metadata', () => {
    expect(getSellerInfoTool.name).toBe('get_seller_info');
    expect(getSellerInfoTool.requiredAutonomy).toBe('L0');
    expect(getSellerInfoTool.tags).toContain('public');
  });

  it('looks up by slug when identifier is string', async () => {
    const prisma = makeMockPrisma(sampleSeller);
    const ctx = makeCtx({ prisma });

    await getSellerInfoTool.execute({ identifier: 'caribbean-spice' }, ctx);

    expect(prisma.seller.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'caribbean-spice' },
      }),
    );
  });

  it('looks up by id when identifier is number', async () => {
    const prisma = makeMockPrisma(sampleSeller);
    const ctx = makeCtx({ prisma });

    await getSellerInfoTool.execute({ identifier: 5 }, ctx);

    expect(prisma.seller.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 5 },
      }),
    );
  });

  it('returns null when seller not found', async () => {
    const prisma = makeMockPrisma(null);
    const ctx = makeCtx({ prisma });

    const result = await getSellerInfoTool.execute({ identifier: 'nonexistent' }, ctx);

    expect(result).toBeNull();
  });

  it('returns public seller data', async () => {
    const prisma = makeMockPrisma(sampleSeller);
    const ctx = makeCtx({ prisma });

    const result = await getSellerInfoTool.execute({ identifier: 'caribbean-spice' }, ctx);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(5);
    expect(result!.storeName).toBe('Caribbean Spice');
    expect(result!.location).toEqual({ city: 'Miami', state: 'FL' });
    expect(result!.about).toBe('Authentic Caribbean groceries');
    expect(result!.productCount).toBe(150);
  });

  it('works for guests (no userId required)', async () => {
    const prisma = makeMockPrisma(sampleSeller);
    const ctx = makeCtx({ userId: undefined, prisma });

    const result = await getSellerInfoTool.execute({ identifier: 5 }, ctx);

    expect(result).not.toBeNull();
    expect(result!.storeName).toBe('Caribbean Spice');
  });

  it('validates args with Zod schema', () => {
    expect(getSellerInfoTool.argsSchema.safeParse({ identifier: 'slug' }).success).toBe(true);
    expect(getSellerInfoTool.argsSchema.safeParse({ identifier: 5 }).success).toBe(true);
    expect(getSellerInfoTool.argsSchema.safeParse({ identifier: '' }).success).toBe(false);
    expect(getSellerInfoTool.argsSchema.safeParse({}).success).toBe(false);
  });
});
