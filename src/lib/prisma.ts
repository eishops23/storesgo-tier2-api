// =============================================================================
// 🗄️ STORESGO PRISMA SINGLETON — Shared Database Client
// =============================================================================
// Re-exports the singleton Prisma instance from the plugin.
// This allows services to import prisma directly while still using
// the same instance that's decorated on the Fastify app.
// =============================================================================

import { prisma, getPrismaClient } from "../plugins/prisma.js";

export { prisma, getPrismaClient };
export default prisma;
