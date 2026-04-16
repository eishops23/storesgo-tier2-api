// =============================================================================
// 🗄️ STORESGO PRISMA PLUGIN — Database Connection Manager
// =============================================================================
// This plugin MUST be registered FIRST before any other plugins.
// It creates a singleton PrismaClient and decorates the Fastify instance.
// =============================================================================

import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";

// Type augmentation for Fastify
declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

// Singleton PrismaClient instance
let prismaInstance: PrismaClient | null = null;

/**
 * Get or create the singleton Prisma instance
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === "development" 
        ? ["query", "info", "warn", "error"]
        : ["warn", "error"],
    });
  }
  return prismaInstance;
}

// Export the shared instance for direct imports (backward compatibility)
export const prisma = getPrismaClient();

/**
 * Prisma Plugin for Fastify
 * - Connects to database on registration
 * - Verifies connection with test query
 * - Decorates app with prisma instance
 * - Handles graceful shutdown
 */
async function prismaPlugin(app: FastifyInstance) {
  const client = getPrismaClient();
  
  app.log.info("🔌 Connecting to database...");

  try {
    // Step 1: Connect to database
    await client.$connect();
    app.log.info("✅ Prisma connected to database");

    // Step 2: Verify connection with test query
    await client.$queryRaw`SELECT 1`;
    app.log.info("✅ Database connection verified");

    // Step 3: Decorate Fastify instance
    app.decorate("prisma", client);
    app.log.info("✅ Prisma decorated on Fastify instance");

    // Step 4: Register shutdown hook
    app.addHook("onClose", async (instance) => {
      instance.log.info("🔌 Disconnecting from database...");
      await client.$disconnect();
      instance.log.info("✅ Database disconnected");
    });

  } catch (error: any) {
    app.log.error({ err: error }, "❌ Prisma connection FAILED");
    
    // CRITICAL: Throw error to prevent server from starting without database
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

// Export as Fastify plugin with name for dependency tracking
export default fp(prismaPlugin, {
  name: "prisma",
  fastify: "5.x",
});
