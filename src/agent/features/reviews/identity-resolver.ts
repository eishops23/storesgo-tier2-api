// Agent Suite — Reviews identity resolver (Phase 11 Prompt 3)
//
// Reviews is a SELLER-FACING agent. The four ownership-scoped tools
// (list_my_reviews, get_review_by_id, get_review_stats,
// find_reviews_needing_response, draft_response) all require
// ctx.sellerId to be set, otherwise they return null. The system
// prompt instructs the LLM to tell unauthenticated callers to sign
// in as a seller. This resolver records identity for conversation
// persistence regardless of whether the caller is a seller; the
// authorization gate lives in the tools themselves.

import { randomUUID } from 'node:crypto';
import { IdentityRepo } from '../../storage/index.js';
import { createChildLogger } from '../../observability/index.js';

const log = createChildLogger({ subsystem: 'reviews-identity' });

export interface ResolvedReviewsIdentity {
  identityId: string;
  aliasValue: string;
  isAuthenticated: boolean;
}

export interface ResolveReviewsIdentityInput {
  userId?: string | null;
  sellerId?: number | null;
  guestSessionId?: string | null;
}

export async function resolveReviewsIdentity(
  input: ResolveReviewsIdentityInput,
): Promise<ResolvedReviewsIdentity> {
  // Authenticated seller path — alias keyed by userId since that's the JWT subject
  if (input.userId && input.sellerId != null) {
    const aliasValue = `seller-${input.sellerId}-${input.userId}`;
    const identity = await IdentityRepo.findOrCreateIdentityByAlias('chat', aliasValue);
    return {
      identityId: identity.id,
      aliasValue,
      isAuthenticated: true,
    };
  }

  // Authenticated user without seller role — record identity but mark unauthenticated
  if (input.userId) {
    const identity = await IdentityRepo.findOrCreateIdentityByAlias('chat', input.userId);
    return {
      identityId: identity.id,
      aliasValue: input.userId,
      isAuthenticated: false,
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

  log.info({ aliasValue, identityId: identity.id }, 'Fresh reviews guest identity minted');

  return {
    identityId: identity.id,
    aliasValue: newSessionId,
    isAuthenticated: false,
  };
}
