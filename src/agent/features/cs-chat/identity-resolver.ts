// Agent Suite — CS Chat identity resolver (Phase 1 Prompt 3)

import { randomUUID } from 'node:crypto';
import { IdentityRepo } from '../../storage/index.js';
import { getPrisma } from '../../storage/prisma-client.js';
import { createChildLogger } from '../../observability/index.js';

const log = createChildLogger({ subsystem: 'cs-chat-identity' });

export interface ResolvedIdentity {
  identityId: string;
  aliasValue: string;
  isGuest: boolean;
  userName?: string;
  email?: string;
  recentOrders?: Array<{ id: number; status: string; totalAmountCents: number; sellerName?: string }>;
}

export interface ResolveIdentityInput {
  userId?: string | null;
  guestSessionId?: string | null;
}

export async function resolveCsIdentity(input: ResolveIdentityInput): Promise<ResolvedIdentity> {
  // Authenticated user path
  if (input.userId) {
    const identity = await IdentityRepo.findOrCreateIdentityByAlias(
      'chat',
      input.userId,
    );

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: {
        email: true,
        buyerProfile: { select: { firstName: true } },
      },
    });

    const orders = await prisma.order.findMany({
      where: { buyerId: input.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        totalAmountCents: true,
        seller: { select: { storeName: true } },
      },
    });

    const userName = user?.buyerProfile?.firstName ?? user?.email?.split('@')[0];

    return {
      identityId: identity.id,
      aliasValue: input.userId,
      isGuest: false,
      userName,
      email: user?.email,
      recentOrders: orders.map((o: any) => ({
        id: o.id,
        status: o.status,
        totalAmountCents: o.totalAmountCents,
        sellerName: o.seller?.storeName,
      })),
    };
  }

  // Guest with existing session ID
  if (input.guestSessionId) {
    const aliasValue = `guest-${input.guestSessionId}`;
    const identity = await IdentityRepo.findOrCreateIdentityByAlias(
      'chat',
      aliasValue,
    );

    return {
      identityId: identity.id,
      aliasValue: input.guestSessionId,
      isGuest: true,
    };
  }

  // Fresh guest — mint new session ID
  const newSessionId = randomUUID();
  const aliasValue = `guest-${newSessionId}`;
  const identity = await IdentityRepo.findOrCreateIdentityByAlias(
    'chat',
    aliasValue,
  );

  log.info({ aliasValue, identityId: identity.id }, 'Fresh guest identity minted');

  return {
    identityId: identity.id,
    aliasValue: newSessionId,
    isGuest: true,
  };
}
