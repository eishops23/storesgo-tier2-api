// Agent Suite — Referrals identity resolver (Phase 5 Prompt 3)

import { randomUUID } from 'node:crypto';
import { IdentityRepo } from '../../storage/index.js';
import { createChildLogger } from '../../observability/index.js';

const log = createChildLogger({ subsystem: 'referrals-identity' });

export interface ResolvedReferralsIdentity {
  identityId: string;
  aliasValue: string;
  isGuest: boolean;
}

export interface ResolveReferralsIdentityInput {
  userId?: string | null;
  guestSessionId?: string | null;
}

export async function resolveReferralsIdentity(
  input: ResolveReferralsIdentityInput,
): Promise<ResolvedReferralsIdentity> {
  // Authenticated user path
  if (input.userId) {
    const identity = await IdentityRepo.findOrCreateIdentityByAlias(
      'chat',
      input.userId,
    );

    return {
      identityId: identity.id,
      aliasValue: input.userId,
      isGuest: false,
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

  log.info({ aliasValue, identityId: identity.id }, 'Fresh referrals guest identity minted');

  return {
    identityId: identity.id,
    aliasValue: newSessionId,
    isGuest: true,
  };
}
