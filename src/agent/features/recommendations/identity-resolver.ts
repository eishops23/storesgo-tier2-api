// Agent Suite — Recommendations identity resolver (Phase 18A Prompt 3)
//
// Phase 18A is CUSTOMER-FACING and works for both guests and
// authenticated customers. Unlike Phase 11 (reviews — seller required)
// or Phase 9 (SEO — admin required), recommendations degrade
// gracefully for guests: content-based tools work without auth, and
// only recommend_from_history returns null when ctx.userId is undefined.
// This matches the Phase 1 cs-chat pattern.

import { randomUUID } from 'node:crypto';
import { IdentityRepo } from '../../storage/index.js';
import { createChildLogger } from '../../observability/index.js';

const log = createChildLogger({ subsystem: 'recommendations-identity' });

export interface ResolvedRecommendationsIdentity {
  identityId: string;
  aliasValue: string;
  isAuthenticated: boolean;
}

export interface ResolveRecommendationsIdentityInput {
  userId?: string | null;
  guestSessionId?: string | null;
}

export async function resolveRecommendationsIdentity(
  input: ResolveRecommendationsIdentityInput,
): Promise<ResolvedRecommendationsIdentity> {
  // Authenticated customer path
  if (input.userId) {
    const identity = await IdentityRepo.findOrCreateIdentityByAlias('chat', input.userId);
    return {
      identityId: identity.id,
      aliasValue: input.userId,
      isAuthenticated: true,
    };
  }

  // Guest with existing session ID
  if (input.guestSessionId) {
    const aliasValue = `guest-${input.guestSessionId}`;
    const identity = await IdentityRepo.findOrCreateIdentityByAlias('chat', aliasValue);
    return {
      identityId: identity.id,
      aliasValue: input.guestSessionId,
      isAuthenticated: false,
    };
  }

  // Fresh guest — mint new session ID
  const newSessionId = randomUUID();
  const aliasValue = `guest-${newSessionId}`;
  const identity = await IdentityRepo.findOrCreateIdentityByAlias('chat', aliasValue);

  log.info(
    { aliasValue, identityId: identity.id },
    'Fresh recommendations guest identity minted',
  );

  return {
    identityId: identity.id,
    aliasValue: newSessionId,
    isAuthenticated: false,
  };
}
