// Agent Suite — Isolated Prisma client singleton (Phase 0 Part B)
// Do NOT import from src/lib/prisma.ts or src/plugins/prisma.ts

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env['NODE_ENV'] === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
}
