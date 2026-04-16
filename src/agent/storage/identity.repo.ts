// Agent Suite — Customer Identity repository (Phase 0 Part B)

import type { PrismaClient, AiCustomerIdentity, AiIdentityAlias, AiChannel } from '@prisma/client';
import { getPrisma } from './prisma-client.js';

type IdentityWithAliases = AiCustomerIdentity & { aliases: AiIdentityAlias[] };

export async function findOrCreateIdentityByAlias(
  channel: AiChannel,
  value: string,
  displayName?: string,
  db: PrismaClient = getPrisma(),
): Promise<IdentityWithAliases> {
  const existing = await db.aiIdentityAlias.findUnique({
    where: { channel_value: { channel, value } },
    include: { identity: { include: { aliases: true } } },
  });

  if (existing) {
    await db.aiCustomerIdentity.update({
      where: { id: existing.identityId },
      data: { lastSeenAt: new Date() },
    });
    return existing.identity;
  }

  return db.aiCustomerIdentity.create({
    data: {
      displayName: displayName ?? null,
      aliases: {
        create: { channel, value },
      },
    },
    include: { aliases: true },
  });
}

export async function getIdentityById(
  id: string,
  db: PrismaClient = getPrisma(),
): Promise<AiCustomerIdentity | null> {
  return db.aiCustomerIdentity.findUnique({ where: { id } });
}

export async function getIdentityWithAliases(
  id: string,
  db: PrismaClient = getPrisma(),
): Promise<IdentityWithAliases | null> {
  return db.aiCustomerIdentity.findUnique({
    where: { id },
    include: { aliases: true },
  });
}

export async function addAlias(
  identityId: string,
  channel: AiChannel,
  value: string,
  db: PrismaClient = getPrisma(),
): Promise<AiIdentityAlias> {
  return db.aiIdentityAlias.create({
    data: { identityId, channel, value },
  });
}

export async function mergeIdentities(
  keepId: string,
  mergeId: string,
  db: PrismaClient = getPrisma(),
): Promise<AiCustomerIdentity> {
  return db.$transaction(async (tx) => {
    // Move all aliases from mergeId to keepId
    await tx.aiIdentityAlias.updateMany({
      where: { identityId: mergeId },
      data: { identityId: keepId },
    });

    // Move all conversations from mergeId to keepId
    await tx.aiConversation.updateMany({
      where: { identityId: mergeId },
      data: { identityId: keepId },
    });

    // Delete the merged identity
    await tx.aiCustomerIdentity.delete({ where: { id: mergeId } });

    // Return the surviving identity
    return tx.aiCustomerIdentity.findUniqueOrThrow({ where: { id: keepId } });
  });
}

export async function updatePreferredLanguage(
  identityId: string,
  language: string,
  db: PrismaClient = getPrisma(),
): Promise<AiCustomerIdentity> {
  return db.aiCustomerIdentity.update({
    where: { id: identityId },
    data: { preferredLanguage: language },
  });
}
