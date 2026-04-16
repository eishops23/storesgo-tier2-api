// Agent Suite — search_products_meili tool tests (Phase 1 Prompt 2)

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../services/aiSearch.service.js', () => ({
  aiSmartSearch: vi.fn(),
}));

import { searchProductsMeiliTool } from '../search-products-meili.js';
import { aiSmartSearch } from '../../../../services/aiSearch.service.js';
import type { ToolContext } from '../../types.js';

const mockAiSmartSearch = vi.mocked(aiSmartSearch);

function makeCtx(): ToolContext {
  return {
    sessionId: 'sess-1',
    featureKey: 'cs_chat',
    conversationId: 'conv-1',
    messageId: 'msg-1',
  };
}

const sampleSearchResult = {
  products: [
    { id: 1, name: 'Basmati Rice', priceCents: 599, seller: { storeName: 'Fresh Farms' } },
    { id: 2, name: 'Jasmine Rice', priceCents: 499, seller: { storeName: 'Asian Market' } },
  ],
  total: 42,
  page: 1,
  pageSize: 8,
};

describe('search_products_meili tool', () => {
  it('has correct metadata', () => {
    expect(searchProductsMeiliTool.name).toBe('search_products_meili');
    expect(searchProductsMeiliTool.requiredAutonomy).toBe('L0');
    expect(searchProductsMeiliTool.tags).toContain('meilisearch');
  });

  it('calls aiSmartSearch with correct query and pageSize', async () => {
    mockAiSmartSearch.mockResolvedValue(sampleSearchResult as any);

    await searchProductsMeiliTool.execute({ query: 'rice', limit: 5 }, makeCtx());

    expect(mockAiSmartSearch).toHaveBeenCalledWith({ query: 'rice', pageSize: 5 });
  });

  it('uses default pageSize of 8 when limit not provided', async () => {
    mockAiSmartSearch.mockResolvedValue(sampleSearchResult as any);

    await searchProductsMeiliTool.execute({ query: 'rice' }, makeCtx());

    expect(mockAiSmartSearch).toHaveBeenCalledWith({ query: 'rice', pageSize: 8 });
  });

  it('returns products and total from aiSmartSearch', async () => {
    mockAiSmartSearch.mockResolvedValue(sampleSearchResult as any);

    const result = await searchProductsMeiliTool.execute({ query: 'rice' }, makeCtx());

    expect(result.products).toHaveLength(2);
    expect(result.total).toBe(42);
    expect(result.query).toBe('rice');
  });

  it('respects custom limit', async () => {
    mockAiSmartSearch.mockResolvedValue({ ...sampleSearchResult, products: [sampleSearchResult.products[0]] } as any);

    const result = await searchProductsMeiliTool.execute({ query: 'rice', limit: 1 }, makeCtx());

    expect(mockAiSmartSearch).toHaveBeenCalledWith({ query: 'rice', pageSize: 1 });
    expect(result.products).toHaveLength(1);
  });

  it('validates args with Zod schema', () => {
    expect(searchProductsMeiliTool.argsSchema.safeParse({ query: 'rice' }).success).toBe(true);
    expect(searchProductsMeiliTool.argsSchema.safeParse({ query: 'rice', limit: 10 }).success).toBe(true);
    expect(searchProductsMeiliTool.argsSchema.safeParse({ query: '' }).success).toBe(false);
    expect(searchProductsMeiliTool.argsSchema.safeParse({}).success).toBe(false);
    expect(searchProductsMeiliTool.argsSchema.safeParse({ query: 'x', limit: 21 }).success).toBe(false);
  });
});
