// =============================================================================
// 🧠 AI SEO Orchestrator — Phase 9.7 + Phase 16 Autoblog
// =============================================================================
// Coordinates 4 background engines:
//  1️⃣ SEO Metadata Cron (auto-dispatches missing metas)
//  2️⃣ Internal Link Builder (contextual linking @ 3 AM)
//  3️⃣ Weekly SEO Report (analytics snapshot @ Monday 6 AM)
//  4️⃣ Daily AI Blog Post (auto-generates blog content @ midnight)
// =============================================================================

import cron from "node-cron";
import { Queue } from "bullmq";
import Redis from "ioredis";

// Import shared prisma singleton
import { prisma } from "../lib/prisma.js";
import { runAutoblogOnce } from "../jobs/autoblog.js";

// Redis connection state
let connection: any = null;
let seoQueue: Queue | null = null;
let autoblogQueue: Queue | null = null;
let redisAvailable = false;

/**
 * Initialize Redis connection for BullMQ queues
 * Returns true if Redis is available, false otherwise
 */
async function initRedis(): Promise<boolean> {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  try {
    connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: redisUrl.startsWith("rediss://") ? {} : undefined,
      connectTimeout: 5000,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 500, 2000);
      },
    });

    // Test connection
    await connection.ping();
    console.log("✅ SEO Orchestrator: Redis connected");

    // Initialize queues
    seoQueue = new Queue("seo-tasks", {
      connection,
      defaultJobOptions: { removeOnComplete: true, attempts: 3 },
    });

    autoblogQueue = new Queue("autoblog-tasks", {
      connection,
      defaultJobOptions: { 
        removeOnComplete: true, 
        attempts: 2, 
        backoff: { type: "exponential", delay: 60000 } 
      },
    });

    redisAvailable = true;
    return true;
  } catch (err: any) {
    console.warn(`⚠️ SEO Orchestrator: Redis not available — ${err.message}`);
    if (connection) {
      try {
        connection.disconnect();
      } catch {}
      connection = null;
    }
    redisAvailable = false;
    return false;
  }
}

/**
 * Start the SEO Orchestrator
 * Initializes all cron jobs for SEO management
 */
export async function startSeoOrchestrator() {
  console.log("🧠 Initializing AI SEO Orchestrator...");

  // Try to initialize Redis (optional - crons will work without it)
  await initRedis();

  // ─────────────────────────────────────────────────────────────────────────
  // Load schedules from environment
  // ─────────────────────────────────────────────────────────────────────────
  const seoSchedule = process.env.SEO_CRON_SCHEDULE || "*/15 * * * *";      // every 15 min
  const linkSchedule = process.env.LINK_CRON_SCHEDULE || "0 3 * * *";       // daily 3 AM
  const reportSchedule = "0 6 * * 1";                                         // weekly Mon 6 AM
  const autoblogSchedule = process.env.AUTOBLOG_CRON_SCHEDULE || "0 0 * * *"; // daily midnight
  const batch = Number(process.env.SEO_MAX_BATCH || 25);

  // ─────────────────────────────────────────────────────────────────────────
  // 1️⃣ SEO Metadata Cron — queue missing metas
  // ─────────────────────────────────────────────────────────────────────────
  cron.schedule(seoSchedule, async () => {
    console.log("⏰ SEO Cron running...");
    try {
      const products = await prisma.product.findMany({
        where: { OR: [{ metaTitle: null }, { metaDescription: null }] } as any,
        select: { id: true },
        take: batch,
      });
      const sellers = await prisma.seller.findMany({
        where: { OR: [{ metaTitle: null }, { metaDescription: null }] } as any,
        select: { id: true },
        take: batch,
      });

      if (redisAvailable && seoQueue) {
        for (const p of products) {
          await seoQueue.add("seo-generate", { entityType: "product", entityId: p.id });
        }
        for (const s of sellers) {
          await seoQueue.add("seo-generate", { entityType: "seller", entityId: s.id });
        }
        console.log(`✅ SEO Cron queued ${products.length} products + ${sellers.length} sellers`);
      } else {
        console.log(`ℹ️ SEO Cron found ${products.length} products + ${sellers.length} sellers (Redis unavailable - not queued)`);
      }
    } catch (err: any) {
      console.error("❌ SEO Cron error:", err.message);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2️⃣ Internal Link Builder Cron — daily @ 3 AM
  // ─────────────────────────────────────────────────────────────────────────
  cron.schedule(linkSchedule, async () => {
    console.log("🔗 Internal Link Builder running...");
    try {
      const pages = await prisma.seoPage.findMany({
        where: { published: true },
        select: { id: true, slug: true, title: true },
        take: Number(process.env.LINK_BATCH || 10),
      });

      for (const page of pages) {
        const related = await prisma.seoPage.findFirst({
          where: { id: { not: page.id }, published: true },
          orderBy: { updatedAt: "desc" },
        });

        if (related) {
          await prisma.internalLink.create({
            data: {
              fromSlug: page.slug,
              toSlug: related.slug,
              anchorText: related.title.split(" ")[0] || "Learn more",
            },
          });
          console.log(`🔗 Linked ${page.slug} → ${related.slug}`);
        }
      }
      console.log("✅ Internal Link Builder completed");
    } catch (err: any) {
      console.error("❌ Internal Link Builder error:", err.message);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3️⃣ Weekly SEO Report Cron — every Monday @ 6 AM
  // ─────────────────────────────────────────────────────────────────────────
  cron.schedule(reportSchedule, async () => {
    console.log("📈 Weekly SEO report generation...");
    try {
      const totalProducts = await prisma.product.count();
      const optimizedProducts = await prisma.product.count({
        where: { metaTitle: { not: null }, metaDescription: { not: null } } as any,
      });
      const totalSellers = await prisma.seller.count();
      const optimizedSellers = await prisma.seller.count({
        where: { metaTitle: { not: null }, metaDescription: { not: null } } as any,
      });

      const completionRate =
        ((optimizedProducts + optimizedSellers) / (totalProducts + totalSellers || 1)) * 100;

      await (prisma.seoTask as any).create({
        data: {
          entityType: "landing",
          entityId: 0,
          status: "done",
          priority: 9,
          payload: {
            summary: {
              totalProducts,
              totalSellers,
              optimizedProducts,
              optimizedSellers,
              completionRate: completionRate.toFixed(2),
              generatedAt: new Date().toISOString(),
            },
          },
        },
      });

      console.log(`📊 SEO Report → ${completionRate.toFixed(2)}% optimized overall`);
    } catch (err: any) {
      console.error("❌ SEO Report Cron error:", err.message);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4️⃣ Daily AI Blog Post Cron — every day @ midnight
  // ─────────────────────────────────────────────────────────────────────────
  cron.schedule(autoblogSchedule, async () => {
    console.log("📝 Daily AI Blog Post generation starting...");
    try {
      // Check if we already created a post today (idempotency)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingPost = await prisma.blogPost.findFirst({
        where: {
          source: "autoblog",
          createdAt: { gte: today, lt: tomorrow },
        },
      });

      if (existingPost) {
        console.log(`⏭️ Autoblog skipped — post already exists for today: ${existingPost.slug}`);
        return;
      }

      // Queue a new autoblog job if Redis is available
      if (redisAvailable && autoblogQueue) {
        await autoblogQueue.add("generate-daily-post", {
          triggeredAt: new Date().toISOString(),
          source: "cron",
        });
        console.log("✅ Autoblog job queued successfully");
      } else {
        console.log("ℹ️ Redis unavailable — running autoblog directly...");
        try {
          const result = await runAutoblogOnce();
          if (result.created) {
            console.log(`✅ Autoblog post created: ${result.slug}`);
          } else {
            console.log(`⚠️ Autoblog skipped: ${result.reason}`);
          }
        } catch (blogErr: any) {
          console.error("❌ Direct autoblog failed:", blogErr.message);
        }
      }
    } catch (err: any) {
      console.error("❌ Autoblog Cron error:", err.message);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Status Log
  // ─────────────────────────────────────────────────────────────────────────
  console.log("✅ AI SEO Orchestrator active (Meta + Links + Reports + Autoblog)");
  console.log(`   📅 SEO schedule: ${seoSchedule}`);
  console.log(`   🔗 Link builder: ${linkSchedule}`);
  console.log(`   📊 Weekly report: ${reportSchedule}`);
  console.log(`   📝 Autoblog: ${autoblogSchedule}`);
  console.log(`   📦 Redis: ${redisAvailable ? "connected" : "unavailable (jobs run locally)"}`);
}

/**
 * Stop the SEO Orchestrator
 * Closes Redis connections
 */
export async function stopSeoOrchestrator() {
  console.log("🛑 Stopping SEO Orchestrator...");
  
  if (seoQueue) {
    await seoQueue.close();
  }
  if (autoblogQueue) {
    await autoblogQueue.close();
  }
  if (connection) {
    connection.disconnect();
  }
  
  console.log("✅ SEO Orchestrator stopped");
}
