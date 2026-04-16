// =============================================================================
// 🚀 STORESGO BACKEND SERVER — Production-Ready Fastify Server
// =============================================================================
// Plugin registration order is CRITICAL:
// 1. Fastify instance
// 2. PRISMA (FIRST - database connection)
// 3. Error handler
// 4. CORS
// 5. Rate limiting
// 6. Admin JWT / Seller JWT
// 7. Sitemap routes
// 8. Health routes
// 9. Main routes
// 10. Start listener
// 11. Cron jobs (optional)
// =============================================================================

import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CRITICAL: Prisma MUST be the first plugin (database connection)
import registerPrisma from "./plugins/prisma.js";

// Error handler middleware
import errorHandlerPlugin from "./middleware/errorHandler.js";

// Admin JWT plugin for authenticateAdmin decorator
import adminJwtPlugin from "./plugins/adminJwt.js";

// Seller JWT plugin for authenticateSeller decorator
import sellerJwtPlugin from "./plugins/sellerJwt.js";

// Production monitoring plugins (optional)
import sentryPlugin from "./plugins/sentry.js";
import metricsPlugin from "./plugins/metrics.js";

// Rate limiting plugin
import rateLimitPlugin from "./plugins/rateLimit.js";

// Upload service for directory initialization
import { initializeUploadDirectories } from "./services/upload.service.js";

// Main routes barrel
import routes from "./routes/index.js";

// Enhanced health routes
import healthzRoutes from "./routes/health/healthz.js";

// Sitemap routes (served at root for SEO)
import sitemapRoutes from "./routes/sitemap/index.js";

// Maintenance cron jobs (optional)
import { startMaintenanceCron } from "./cron/maintenance.cron.js";
import { startAutoblogCron } from "./cron/autoblog.cron.js";

// =============================================================================
// Global Error Handlers
// =============================================================================

process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ UNHANDLED REJECTION at:", promise, "reason:", reason);
});

// =============================================================================
// Main Server Function
// =============================================================================

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🚀 STORESGO BACKEND — Starting Server");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log("═══════════════════════════════════════════════════════════════");

  // Initialize upload directories
  initializeUploadDirectories();

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: Create Fastify Instance
  // ─────────────────────────────────────────────────────────────────────────
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info",
      // Use pino-pretty in development
      ...(process.env.NODE_ENV !== "production" && {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
    },
  });


  // Handle empty JSON bodies (for POST requests without body)
  app.addContentTypeParser("application/json", { parseAs: "string" }, (req, body, done) => {
    if (!body || body === "") {
      done(null, {});
    } else {
      try {
        done(null, JSON.parse(body as string));
      } catch (err: any) {
        done(err, undefined);
      }
    }
  });
  console.log("✅ [1/12] Fastify instance created");

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: PRISMA (FIRST PLUGIN - CRITICAL)
  // ─────────────────────────────────────────────────────────────────────────
  try {
    await app.register(registerPrisma);
    console.log("✅ [2/12] Prisma registered and connected");
  } catch (err: any) {
    console.error("❌ FATAL: Prisma registration failed:", err.message);
    console.error("   The server cannot start without a database connection.");
    process.exit(1);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: Error Handler Middleware
  // ─────────────────────────────────────────────────────────────────────────
  await app.register(errorHandlerPlugin);
  console.log("✅ [3/12] Error handler registered");

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4: CORS
  // ─────────────────────────────────────────────────────────────────────────
  const corsOrigin = process.env.CORS_ORIGIN || "*";
  await app.register(cors, {
    origin: corsOrigin === "*" ? "*" : corsOrigin.split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
  console.log("✅ [4/12] CORS registered");

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4.5: Static Files (for mobile payment page)
  // ─────────────────────────────────────────────────────────────────────────
  await app.register(fastifyStatic, {
    root: path.join(__dirname, "..", "public"),
    prefix: "/",
  });
  console.log("✅ [4.5/12] Static files registered");

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 5: Rate Limiting
  // ─────────────────────────────────────────────────────────────────────────
  await app.register(rateLimitPlugin);
  console.log("✅ [5/12] Rate limiting registered");

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 6: Admin JWT Plugin
  // ─────────────────────────────────────────────────────────────────────────
  await app.register(adminJwtPlugin);
  console.log("✅ [6/12] Admin JWT plugin registered");

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 7: Seller JWT Plugin
  // ─────────────────────────────────────────────────────────────────────────
  await app.register(sellerJwtPlugin);
  console.log("✅ [7/12] Seller JWT plugin registered");

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 8: Sitemap Routes (root level for SEO)
  // ─────────────────────────────────────────────────────────────────────────
  await app.register(sitemapRoutes, { prefix: "/" });
  console.log("✅ [8/12] Sitemap routes registered at root");

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 9: Enhanced Health Routes
  // ─────────────────────────────────────────────────────────────────────────
  await app.register(healthzRoutes, { prefix: "/api/health" });
  console.log("✅ [9/12] Health routes registered at /api/health");

  // Root-level /healthz endpoint (required for load balancers)
  app.get("/healthz", async (request, reply) => {
    let dbOk = false;
    try {
      if (app.prisma) {
        await app.prisma.$queryRaw`SELECT 1`;
        dbOk = true;
      }
    } catch {}
    const isHealthy = dbOk;
    reply.status(isHealthy ? 200 : 503);
    return {
      ok: isHealthy,
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };
  });

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 10: Main Routes (/api prefix)
  // ─────────────────────────────────────────────────────────────────────────
  await app.register(routes, { prefix: "/api" });
  console.log("✅ [10/12] Main routes registered at /api");

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 11: Optional Monitoring Plugins (Sentry, Metrics)
  // ─────────────────────────────────────────────────────────────────────────
  try {
    await app.register(sentryPlugin);
    console.log("   └─ Sentry plugin registered");
  } catch (err: any) {
    // Sentry is optional
  }

  try {
    await app.register(metricsPlugin);
    console.log("   └─ Metrics plugin registered");
  } catch (err: any) {
    // Metrics is optional
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 12: Start Server Listener
  // ─────────────────────────────────────────────────────────────────────────
  const port = Number(process.env.PORT || 5000);
  const host = process.env.HOST || "0.0.0.0";

  try {
    await app.listen({ port, host });

    // Get LAN IP for display
    const os = await import("os");
    const networkInterfaces = os.networkInterfaces();
    let lanIp = "127.0.0.1";
    for (const name of Object.keys(networkInterfaces)) {
      const interfaces = networkInterfaces[name];
      if (interfaces) {
        for (const iface of interfaces) {
          if (iface.family === "IPv4" && !iface.internal) {
            lanIp = iface.address;
            break;
          }
        }
      }
    }

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("✅ [11/12] Server is listening!");
    console.log(`   Local:   http://127.0.0.1:${port}`);
    console.log(`   Network: http://${lanIp}:${port}`);
    console.log("═══════════════════════════════════════════════════════════════");

    // ───────────────────────────────────────────────────────────────────────
    // Optional: Start Cron Jobs
    // ───────────────────────────────────────────────────────────────────────
    if (process.env.CRON_ENABLED !== "false") {
      try {
        await startMaintenanceCron();
        console.log("✅ [12/12] Maintenance cron jobs started");
        
        // Start SEO Orchestrator (includes autoblog)
        try {
          await startAutoblogCron();
          console.log("✅ [13/13] Autoblog Cron started");
        } catch (orchErr: any) {
          console.warn("⚠️ [13/13] Autoblog Cron failed:", orchErr.message);
        }
      } catch (cronErr: any) {
        console.warn("⚠️ [12/12] Maintenance cron failed:", cronErr.message);
      }
    } else {
      console.log("ℹ️ [12/12] Cron jobs disabled via CRON_ENABLED=false");
    }

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("🚀 STORESGO BACKEND — Ready to Accept Connections");
    console.log("═══════════════════════════════════════════════════════════════");

    // Keep-alive heartbeat log (every 5 minutes)
    setInterval(() => {
      console.log(`💓 Server heartbeat — uptime: ${process.uptime().toFixed(0)}s`);
    }, 300000);

    // Signal PM2 that we're ready
    if (process.send) {
      process.send("ready");
      console.log("✅ Sent ready signal to PM2");
    }

    // ───────────────────────────────────────────────────────────────────────
    // Graceful Shutdown Handlers
    // ───────────────────────────────────────────────────────────────────────
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Graceful shutdown initiated...`);

      try {
        // Stop accepting new connections
        await app.close();
        console.log("✅ Server closed gracefully");

        // Close database connections (handled by onClose hook)
        console.log("✅ Database connection closed");

        console.log("👋 Shutdown complete. Goodbye!");
        process.exit(0);
      } catch (err) {
        console.error("❌ Error during shutdown:", err);
        process.exit(1);
      }
    };

    // Register shutdown handlers
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  } catch (err) {
    console.error("❌ Failed to start server:", err);
    app.log.error({ err }, "Failed to start server");
    process.exit(1);
  }
}

// =============================================================================
// Start the Server
// =============================================================================

main().catch((err) => {
  console.error("❌ Fatal error in main():", err);
  process.exit(1);
});
