// Agent Suite — CS Chat identity resolver tests (Phase 1 Prompt 3)

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../storage/index.js', () => ({
  IdentityRepo: {
    findOrCreateIdentityByAlias: vi.fn(),
  },
}));

vi.mock('../../../storage/prisma-client.js', () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

vi.mock('../../../observability/index.js', () => ({
  createChildLogger: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() })),
}));

const mockPrisma = {
  user: { findUnique: vi.fn() },
  order: { findMany: vi.fn() },
} as any;

import { resolveCsIdentity } from '../identity-resolver.js';
import { IdentityRepo } from '../../../storage/index.js';

const mockFindOrCreate = vi.mocked(IdentityRepo.findOrCreateIdentityByAlias);

describe('identity-resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindOrCreate.mockResolvedValue({ id: 'identity-1', aliases: [] } as any);
    mockPrisma.user.findUnique.mockResolvedValue({
      email: 'jon@storesgo.com',
      buyerProfile: { firstName: 'Jon' },
    });
    mockPrisma.order.findMany.mockResolvedValue([
      { id: 1, status: 'delivered', totalAmountCents: 5000, seller: { storeName: 'Fresh Farm' } },
    ]);
  });

  it('resolves authenticated user with identity alias', async () => {
    const result = await resolveCsIdentity({ userId: 'user-123' });

    expect(mockFindOrCreate).toHaveBeenCalledWith('chat', 'user-123');
    expect(result.identityId).toBe('identity-1');
    expect(result.isGuest).toBe(false);
  });

  it('returns userName from buyerProfile.firstName', async () => {
    const result = await resolveCsIdentity({ userId: 'user-123' });

    expect(result.userName).toBe('Jon');
  });

  it('falls back to email prefix for userName', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      email: 'jane@example.com',
      buyerProfile: null,
    });

    const result = await resolveCsIdentity({ userId: 'user-456' });

    expect(result.userName).toBe('jane');
  });

  it('returns recent orders for authenticated user', async () => {
    const result = await resolveCsIdentity({ userId: 'user-123' });

    expect(result.recentOrders).toHaveLength(1);
    expect(result.recentOrders![0].id).toBe(1);
    expect(result.recentOrders![0].sellerName).toBe('Fresh Farm');
  });

  it('resolves guest with existing session ID', async () => {
    const result = await resolveCsIdentity({ guestSessionId: 'sess-abc' });

    expect(mockFindOrCreate).toHaveBeenCalledWith('chat', 'guest-sess-abc');
    expect(result.isGuest).toBe(true);
    expect(result.aliasValue).toBe('sess-abc');
  });

  it('mints fresh guest session when no userId or guestSessionId', async () => {
    const result = await resolveCsIdentity({});

    expect(result.isGuest).toBe(true);
    expect(result.aliasValue).toBeTruthy();
    expect(result.aliasValue.length).toBeGreaterThan(10); // UUID
    expect(mockFindOrCreate).toHaveBeenCalledWith(
      'chat',
      expect.stringMatching(/^guest-/),
    );
  });

  it('does not query user/orders for guest', async () => {
    await resolveCsIdentity({ guestSessionId: 'sess-abc' });

    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.order.findMany).not.toHaveBeenCalled();
  });
});
