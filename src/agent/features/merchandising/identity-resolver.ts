// Agent Suite — Merchandising identity resolver (Phase 12 Prompt 2)
//
// Merchandising is an OPERATOR-FACING agent. The 5 tools all require
// ctx.adminId to be set, otherwise they return null. The system
// prompt instructs the LLM to tell unauthenticated callers to
// sign in as an admin. This resolver records identity for
// conversation persistence regardless of authentication state;
// the authorization gate lives in the tools themselves and is
// duplicated at the route layer by requireAdmin.

import { randomUUID } from 'node:crypto';
import { IdentityRepo } from '../../storage/index.js';
import { createChildLogger } from '../../observability/index.js';

const log = createChildLogger({ subsystem: 'merchandising-identity' });

export interface ResolvedMerchandisingIdentity {
  identityId: string;
  aliasValue: string;
  isAuthenticated: boolean;
}

export interface ResolveMerchandisingIdentityInput {
  adminId?: number | null;
  userId?: string | null;
  guestSessionId?: string | null;
}

export async function resolveMerchandisingIdentity(
  input: ResolveMerchandisingIdentityInput,
): Promise<ResolvedMerchandisingIdentity> {
  // Authenticated admin path — alias keyed by adminId
  if (input.adminId != null) {
    const aliasValue = `admin-${input.adminId}`;
    const identity = await IdentityRepo.findOrCreateIdentityByAlias('chat', aliasValue);
    return {
      identityId: identity.id,
      aliasValue,
      isAuthenticated: true,
    };
  }

  // Authenticated user without admin role — record identity but not authenticated for merchandising
  if (input.userId) {
    const identity = await IdentityRepo.findOrCreateIdentityByAlias('chat', input.userId);
    return {
      identityId: identity.id,
      aliasValue: input.userId,
      isAuthenticated: false,
    };
  }

  // Guest with existing session
  if (input.guestSessionId) {
    const aliasValue = `guest-${input.guestSessionId}`;
    const identity = await IdentityRepo.findOrCreateIdentityByAlias('chat', aliasValue);
    return {
      identityId: identity.id,
      aliasValue: input.guestSessionId,
      isAuthenticated: false,
    };
  }

  // Fresh guest — mint new session
  const newSessionId = randomUUID();
  const aliasValue = `guest-${newSessionId}`;
  const identity = await IdentityRepo.findOrCreateIdentityByAlias('chat', aliasValue);

  log.info({ aliasValue, identityId: identity.id }, 'Fresh merchandising guest identity minted');

  return {
    identityId: identity.id,
    aliasValue: newSessionId,
    isAuthenticated: false,
  };
}
