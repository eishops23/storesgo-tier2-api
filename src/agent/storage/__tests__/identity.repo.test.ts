// Agent Suite — Identity repository tests (Phase 0 Part B)
// Uses dependency injection with mock PrismaClient — no real DB needed

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  findOrCreateIdentityByAlias,
  getIdentityById,
  getIdentityWithAliases,
  addAlias,
  mergeIdentities,
  updatePreferredLanguage,
} from '../identity.repo.js';

// --- Mock Prisma factory ---

function createMockPrisma(): any {
  const mock: any = {
    aiCustomerIdentity: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    aiIdentityAlias: {
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    aiConversation: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(async (fn: (tx: any) => Promise<any>) => {
      return fn(mock);
    }),
  };
  return mock;
}

let mockPrisma: any;

beforeEach(() => {
  mockPrisma = createMockPrisma();
});

describe('findOrCreateIdentityByAlias', () => {
  it('returns existing identity when alias is found', async () => {
    const existingIdentity = {
      id: 'id-1',
      displayName: 'Alice',
      aliases: [{ id: 'alias-1', channel: 'chat', value: 'alice@test.com' }],
    };

    mockPrisma.aiIdentityAlias.findUnique.mockResolvedValue({
      identityId: 'id-1',
      identity: existingIdentity,
    });
    mockPrisma.aiCustomerIdentity.update.mockResolvedValue(existingIdentity);

    const result = await findOrCreateIdentityByAlias('chat', 'alice@test.com', undefined, mockPrisma);

    expect(result.id).toBe('id-1');
    expect(result.displayName).toBe('Alice');
    expect(mockPrisma.aiIdentityAlias.findUnique).toHaveBeenCalledWith({
      where: { channel_value: { channel: 'chat', value: 'alice@test.com' } },
      include: { identity: { include: { aliases: true } } },
    });
    expect(mockPrisma.aiCustomerIdentity.update).toHaveBeenCalledWith({
      where: { id: 'id-1' },
      data: { lastSeenAt: expect.any(Date) },
    });
  });

  it('creates new identity when alias is not found', async () => {
    mockPrisma.aiIdentityAlias.findUnique.mockResolvedValue(null);

    const newIdentity = {
      id: 'id-new',
      displayName: 'Bob',
      aliases: [{ id: 'alias-new', channel: 'email', value: 'bob@test.com' }],
    };
    mockPrisma.aiCustomerIdentity.create.mockResolvedValue(newIdentity);

    const result = await findOrCreateIdentityByAlias('email', 'bob@test.com', 'Bob', mockPrisma);

    expect(result.id).toBe('id-new');
    expect(mockPrisma.aiCustomerIdentity.create).toHaveBeenCalledWith({
      data: {
        displayName: 'Bob',
        aliases: { create: { channel: 'email', value: 'bob@test.com' } },
      },
      include: { aliases: true },
    });
  });

  it('sets displayName to null when not provided for new identity', async () => {
    mockPrisma.aiIdentityAlias.findUnique.mockResolvedValue(null);
    mockPrisma.aiCustomerIdentity.create.mockResolvedValue({
      id: 'id-x', displayName: null, aliases: [],
    });

    await findOrCreateIdentityByAlias('sms', '+15551234567', undefined, mockPrisma);

    expect(mockPrisma.aiCustomerIdentity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ displayName: null }),
      }),
    );
  });
});

describe('getIdentityById', () => {
  it('returns identity when found', async () => {
    const identity = { id: 'id-1', displayName: 'Test' };
    mockPrisma.aiCustomerIdentity.findUnique.mockResolvedValue(identity);

    const result = await getIdentityById('id-1', mockPrisma);
    expect(result).toEqual(identity);
    expect(mockPrisma.aiCustomerIdentity.findUnique).toHaveBeenCalledWith({ where: { id: 'id-1' } });
  });

  it('returns null when not found', async () => {
    mockPrisma.aiCustomerIdentity.findUnique.mockResolvedValue(null);
    const result = await getIdentityById('nonexistent', mockPrisma);
    expect(result).toBeNull();
  });
});

describe('getIdentityWithAliases', () => {
  it('includes aliases in result', async () => {
    const identity = {
      id: 'id-1',
      aliases: [{ id: 'a1', channel: 'chat', value: 'test' }],
    };
    mockPrisma.aiCustomerIdentity.findUnique.mockResolvedValue(identity);

    const result = await getIdentityWithAliases('id-1', mockPrisma);
    expect(result?.aliases).toHaveLength(1);
    expect(mockPrisma.aiCustomerIdentity.findUnique).toHaveBeenCalledWith({
      where: { id: 'id-1' },
      include: { aliases: true },
    });
  });
});

describe('addAlias', () => {
  it('creates a new alias for an identity', async () => {
    const alias = { id: 'alias-1', identityId: 'id-1', channel: 'whatsapp', value: '+1555' };
    mockPrisma.aiIdentityAlias.create.mockResolvedValue(alias);

    const result = await addAlias('id-1', 'whatsapp', '+1555', mockPrisma);
    expect(result.channel).toBe('whatsapp');
    expect(mockPrisma.aiIdentityAlias.create).toHaveBeenCalledWith({
      data: { identityId: 'id-1', channel: 'whatsapp', value: '+1555' },
    });
  });
});

describe('mergeIdentities', () => {
  it('moves aliases and conversations, deletes merged identity', async () => {
    const survivor = { id: 'keep-id', displayName: 'Kept' };
    mockPrisma.aiIdentityAlias.updateMany.mockResolvedValue({ count: 2 });
    mockPrisma.aiConversation.updateMany.mockResolvedValue({ count: 3 });
    mockPrisma.aiCustomerIdentity.delete.mockResolvedValue({});
    mockPrisma.aiCustomerIdentity.findUniqueOrThrow.mockResolvedValue(survivor);

    const result = await mergeIdentities('keep-id', 'merge-id', mockPrisma);

    expect(result.id).toBe('keep-id');
    expect(mockPrisma.aiIdentityAlias.updateMany).toHaveBeenCalledWith({
      where: { identityId: 'merge-id' },
      data: { identityId: 'keep-id' },
    });
    expect(mockPrisma.aiConversation.updateMany).toHaveBeenCalledWith({
      where: { identityId: 'merge-id' },
      data: { identityId: 'keep-id' },
    });
    expect(mockPrisma.aiCustomerIdentity.delete).toHaveBeenCalledWith({
      where: { id: 'merge-id' },
    });
  });
});

describe('updatePreferredLanguage', () => {
  it('updates the language field', async () => {
    mockPrisma.aiCustomerIdentity.update.mockResolvedValue({
      id: 'id-1', preferredLanguage: 'es',
    });

    const result = await updatePreferredLanguage('id-1', 'es', mockPrisma);
    expect(result.preferredLanguage).toBe('es');
    expect(mockPrisma.aiCustomerIdentity.update).toHaveBeenCalledWith({
      where: { id: 'id-1' },
      data: { preferredLanguage: 'es' },
    });
  });
});
