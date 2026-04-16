// ------------------------------------------------------
// 📊 Monitoring Plugin — Phase 7 (Extended System Health)
// ------------------------------------------------------
// Provides /api/monitor for uptime, system, Redis, and DB checks
// ------------------------------------------------------

import os from "os";
import type { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

export default async function registerMonitoring(app: FastifyInstance) {
  const prisma = new PrismaClient();
  const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  app.get("/api/monitor", async () => {
    const memory = process.memoryUsage();
    const loadAvg = os.loadavg();

    // ✅ Database check
    let dbStatus = "ok";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "error";
    }

    // ✅ Redis check
    let redisStatus = "ok";
    try {
      await redis.ping();
    } catch {
      redisStatus = "error";
    }

    return {
      ok: dbStatus === "ok" && redisStatus === "ok",
      phase: "6E-7",
      uptime: `${process.uptime().toFixed(1)}s`,
      timestamp: new Date().toISOString(),

      system: {
        platform: os.platform(),
        cpuCount: os.cpus().length,
        nodeVersion: process.version,
        loadAvg: loadAvg.map((n) => n.toFixed(2)),
        memory: {
          rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          external: `${(memory.external / 1024 / 1024).toFixed(2)} MB`,
        },
      },

      services: {
        database: dbStatus,
        redis: redisStatus,
      },
    };
  });

  app.log.info("📈 Monitoring plugin initialized → /api/monitor");
}
