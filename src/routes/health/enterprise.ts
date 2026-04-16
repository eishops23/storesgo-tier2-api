/**
 * Enterprise Health Endpoints
 * Comprehensive system health monitoring
 */
import type { FastifyInstance } from "fastify";
import { getRedis } from "../../lib/enterprise/cache.js";
import { getCircuitStatus } from "../../lib/enterprise/circuitBreaker.js";
import { prisma } from "../../lib/prisma.js";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  components: {
    database: ComponentHealth;
    redis: ComponentHealth;
    circuits: Record<string, any>;
  };
  metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

interface ComponentHealth {
  status: "up" | "down" | "degraded";
  latencyMs?: number;
  error?: string;
}

const startTime = Date.now();

export default async function enterpriseHealthRoutes(app: FastifyInstance) {
  
  // Detailed health check
  app.get("/health/detailed", async (request, reply) => {
    const health: HealthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: process.env.npm_package_version || "1.0.0",
      components: {
        database: await checkDatabase(),
        redis: await checkRedis(),
        circuits: getCircuitStatus(),
      },
      metrics: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    };

    // Determine overall status
    if (health.components.database.status === "down") {
      health.status = "unhealthy";
    } else if (health.components.redis.status === "down") {
      health.status = "degraded";
    }

    const statusCode = health.status === "unhealthy" ? 503 : 200;
    return reply.status(statusCode).send(health);
  });

  // Readiness probe (for k8s)
  app.get("/health/ready", async (request, reply) => {
    const db = await checkDatabase();
    if (db.status === "down") {
      return reply.status(503).send({ ready: false, reason: "database" });
    }
    return reply.send({ ready: true });
  });

  // Liveness probe (for k8s)
  app.get("/health/live", async (request, reply) => {
    return reply.send({ live: true, uptime: Math.floor((Date.now() - startTime) / 1000) });
  });
}

async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "up", latencyMs: Date.now() - start };
  } catch (err: any) {
    return { status: "down", error: err.message };
  }
}

async function checkRedis(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const redis = getRedis();
    await redis.ping();
    return { status: "up", latencyMs: Date.now() - start };
  } catch (err: any) {
    return { status: "down", error: err.message };
  }
}
