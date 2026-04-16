// =============================================================================
// 🏥 HEALTH CHECK ROUTES — STORESGO BACKEND
// Comprehensive health checks for load balancers and monitoring systems
// =============================================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

interface HealthStatus {
  ok: boolean;
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: ComponentHealth;
    redis: ComponentHealth;
    memory: ComponentHealth;
    disk?: ComponentHealth;
  };
}

interface ComponentHealth {
  status: "pass" | "warn" | "fail";
  latencyMs?: number;
  message?: string;
  details?: Record<string, any>;
}

interface DetailedHealth extends HealthStatus {
  system: {
    platform: string;
    nodeVersion: string;
    cpuCount: number;
    loadAvg: number[];
    memory: {
      total: string;
      used: string;
      free: string;
      heapUsed: string;
      heapTotal: string;
      external: string;
      rss: string;
    };
  };
  deployment: {
    commitSha?: string;
    buildTime?: string;
    instanceId?: string;
  };
}

// =============================================================================
// Health Check Helpers
// =============================================================================

async function checkDatabase(app: FastifyInstance): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    // Access prisma from decorated Fastify instance
    if (!app.prisma) {
      return {
        status: "fail",
        message: "Prisma not decorated on Fastify instance",
      };
    }
    await app.prisma.$queryRaw`SELECT 1`;
    return {
      status: "pass",
      latencyMs: Date.now() - start,
    };
  } catch (error: any) {
    return {
      status: "fail",
      latencyMs: Date.now() - start,
      message: error.message || "Database connection failed",
    };
  }
}

async function checkRedis(app: FastifyInstance): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    // Check if queues plugin is available
    const queues = (app as any).queues;
    if (!queues?.notifications) {
      return {
        status: "warn",
        message: "Redis/Queues not configured (optional)",
      };
    }

    // Try to ping Redis through BullMQ queue
    const client = await queues.notifications.client;
    if (client) {
      await client.ping();
      return {
        status: "pass",
        latencyMs: Date.now() - start,
      };
    }

    return {
      status: "warn",
      message: "Redis client not available",
    };
  } catch (error: any) {
    return {
      status: "warn", // Redis is optional, so warn instead of fail
      latencyMs: Date.now() - start,
      message: error.message || "Redis connection failed",
    };
  }
}

function checkMemory(): ComponentHealth {
  const mem = process.memoryUsage();
  const heapUsedPercent = (mem.heapUsed / mem.heapTotal) * 100;
  
  // Warning at 80%, fail at 95%
  if (heapUsedPercent > 95) {
    return {
      status: "fail",
      message: `Heap usage critical: ${heapUsedPercent.toFixed(1)}%`,
      details: {
        heapUsedPercent: heapUsedPercent.toFixed(1),
        heapUsedMB: (mem.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (mem.heapTotal / 1024 / 1024).toFixed(2),
      },
    };
  } else if (heapUsedPercent > 80) {
    return {
      status: "warn",
      message: `Heap usage high: ${heapUsedPercent.toFixed(1)}%`,
      details: {
        heapUsedPercent: heapUsedPercent.toFixed(1),
      },
    };
  }
  
  return {
    status: "pass",
    details: {
      heapUsedPercent: heapUsedPercent.toFixed(1),
    },
  };
}

// =============================================================================
// Route Registration
// =============================================================================

export default async function healthRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // Simple Health Check (for load balancers)
  // GET /api/health or /api/health/healthz
  // Returns 200 OK if service is running, 503 if unhealthy
  // ---------------------------------------------------------------------------
  const simpleHealthHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const dbCheck = await checkDatabase(app);
    
    const isHealthy = dbCheck.status === "pass";
    
    const response = {
      ok: isHealthy,
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };

    // Update metrics if available
    if ((app as any).metrics) {
      (app as any).metrics.setGauge("storesgo_health_check_status", {}, isHealthy ? 1 : 0);
    }

    reply.status(isHealthy ? 200 : 503);
    return response;
  };

  app.get("/", simpleHealthHandler);
  app.get("/healthz", simpleHealthHandler);

  // ---------------------------------------------------------------------------
  // Liveness Probe (Kubernetes)
  // GET /api/health/live
  // Returns 200 if the process is alive (always succeeds if reached)
  // ---------------------------------------------------------------------------
  app.get("/live", async (request, reply) => {
    return {
      ok: true,
      status: "alive",
      timestamp: new Date().toISOString(),
    };
  });

  // ---------------------------------------------------------------------------
  // Readiness Probe (Kubernetes)
  // GET /api/health/ready
  // Returns 200 if the service is ready to receive traffic
  // ---------------------------------------------------------------------------
  app.get("/ready", async (request, reply) => {
    const dbCheck = await checkDatabase(app);
    const redisCheck = await checkRedis(app);
    
    // Service is ready if DB is up (Redis is optional)
    const isReady = dbCheck.status === "pass";
    
    reply.status(isReady ? 200 : 503);
    return {
      ok: isReady,
      status: isReady ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      checks: {
        database: dbCheck.status,
        redis: redisCheck.status,
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Detailed Health Check (for monitoring dashboards)
  // GET /api/health/detailed
  // Returns comprehensive health information
  // ---------------------------------------------------------------------------
  app.get("/detailed", async (request, reply): Promise<DetailedHealth> => {
    const [dbCheck, redisCheck] = await Promise.all([
      checkDatabase(app),
      checkRedis(app),
    ]);
    
    const memCheck = checkMemory();
    const os = await import("os");
    const mem = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    // Determine overall status
    const checks = { database: dbCheck, redis: redisCheck, memory: memCheck };
    
    // Database is critical, Redis is optional
    const dbFailed = dbCheck.status === "fail";
    const memFailed = memCheck.status === "fail";
    const anyWarn = Object.values(checks).some(c => c.status === "warn");
    
    let overallStatus: "healthy" | "degraded" | "unhealthy";
    if (dbFailed || memFailed) {
      overallStatus = "unhealthy";
    } else if (anyWarn) {
      overallStatus = "degraded";
    } else {
      overallStatus = "healthy";
    }

    return {
      ok: overallStatus === "healthy",
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || "unknown",
      environment: process.env.NODE_ENV || "development",
      checks,
      system: {
        platform: os.platform(),
        nodeVersion: process.version,
        cpuCount: os.cpus().length,
        loadAvg: os.loadavg().map(n => parseFloat(n.toFixed(2))),
        memory: {
          total: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
          used: `${((totalMem - freeMem) / 1024 / 1024 / 1024).toFixed(2)} GB`,
          free: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
          heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          external: `${(mem.external / 1024 / 1024).toFixed(2)} MB`,
          rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
        },
      },
      deployment: {
        commitSha: process.env.GIT_COMMIT_SHA || process.env.COMMIT_SHA,
        buildTime: process.env.BUILD_TIME,
        instanceId: process.env.INSTANCE_ID || process.env.HOSTNAME,
      },
    };
  });

  // ---------------------------------------------------------------------------
  // Startup Probe (Kubernetes)
  // GET /api/health/startup
  // Returns 200 once the application has fully started
  // ---------------------------------------------------------------------------
  app.get("/startup", async (request, reply) => {
    // Check if essential services are initialized
    const dbCheck = await checkDatabase(app);
    
    const isStarted = dbCheck.status === "pass";
    
    reply.status(isStarted ? 200 : 503);
    return {
      ok: isStarted,
      status: isStarted ? "started" : "starting",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };
  });
}
