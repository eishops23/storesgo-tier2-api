// =============================================================================
// 📦 STORESGO QUEUES PLUGIN — BullMQ + Redis + Multi-Worker
// =============================================================================
// Handles background jobs for:
//  • Notifications (email delivery)
//  • Orders (wallets, payouts, receipts)
//  • AI SEO Tasks (meta generation + internal link building)
// =============================================================================

import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import nodemailer from "nodemailer";
import OpenAI from "openai";

// Import shared prisma singleton
import { prisma } from "../lib/prisma.js";

// OpenAI client (lazy init)
let openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
  }
  return openai;
}

// Type augmentation for Fastify
declare module "fastify" {
  interface FastifyInstance {
    queues?: {
      notifications: Queue;
      orders: Queue;
      seo: Queue;
    };
    wsBroadcast?: (event: string, payload?: any) => void;
  }
}

/**
 * Queues Plugin for Fastify
 * - Connects to Redis
 * - Creates BullMQ queues
 * - Starts workers for notification, orders, and SEO tasks
 * - Gracefully handles Redis unavailability (local dev)
 */
async function queuesPlugin(app: FastifyInstance) {
  // ───────────────────────────────────────────────────────────────────────────
  // Redis Connection (Upstash + TLS safe)
  // Graceful fallback: Skip queues if Redis unavailable or version < 5.0
  // ───────────────────────────────────────────────────────────────────────────
  let connection: Redis | null = null;
  let redisAvailable = true;

  const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

  try {
    connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: redisUrl.startsWith("rediss://") ? {} : undefined,
      connectTimeout: 5000,
      retryStrategy: (times) => {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 500, 2000);
      },
    });

    // Test connection and check Redis version
    const redisInfo = await connection.info();
    const versionMatch = redisInfo.match(/redis_version:(\d+\.\d+)/);
    const version = parseFloat(versionMatch?.[1] || "0");

    if (version < 5) {
      app.log.warn(`⚠️ Redis version ${version} < 5.0 — BullMQ requires Redis 5+`);
      redisAvailable = false;
      try {
        connection.disconnect();
      } catch {}
      connection = null;
    } else {
      app.log.info(`✅ Redis connected (version ${version})`);
    }
  } catch (err: any) {
    app.log.warn(`⚠️ Redis not available: ${err.message}`);
    redisAvailable = false;
    if (connection) {
      try {
        connection.disconnect();
      } catch {}
      connection = null;
    }
  }

  // Exit early if Redis not available
  if (!redisAvailable || !connection) {
    app.log.warn("ℹ️ Redis unavailable — queues and workers disabled (local dev mode)");
    return;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Initialize Queues
  // ───────────────────────────────────────────────────────────────────────────
  let notifications: Queue;
  let orders: Queue;
  let seo: Queue;

  try {
    notifications = new Queue("notifications", { connection });
    orders = new Queue("orders", { connection });
    seo = new Queue("seo_tasks", {
      connection,
      defaultJobOptions: { removeOnComplete: true, attempts: 3 },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Notification Worker — Emails via Nodemailer
    // ─────────────────────────────────────────────────────────────────────────
    new Worker(
      "notifications",
      async (job) => {
        const data = job.data;
        app.log.info(`📩 Processing notification → ${JSON.stringify(data)}`);

        if (data.type === "email") {
          try {
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: Number(process.env.SMTP_PORT || 587),
              secure: false,
              auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            });

            await transporter.sendMail({
              from: process.env.MAIL_FROM || "StoresGo <no-reply@storesgo.com>",
              to: data.to,
              subject: data.subject || "StoresGo Notification",
              text: data.message,
            });

            app.log.info(`✅ Email sent → ${data.to}`);
          } catch (err: any) {
            app.log.error({ err }, "❌ Email send failed");
          }
        } else {
          app.log.warn(`⚠️ Unsupported notification type: ${data.type}`);
        }
      },
      { connection }
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Order Worker — Wallet & Payout Logic (Placeholder)
    // ─────────────────────────────────────────────────────────────────────────
    new Worker(
      "orders",
      async (job) => {
        const data = job.data;
        app.log.info(`🧾 Processing order → ${JSON.stringify(data)}`);
        // Future phases: Wallet adjustments, payouts, receipts
      },
      { connection }
    );

    // ─────────────────────────────────────────────────────────────────────────
    // SEO Worker — AI Meta & Internal Link Generator
    // ─────────────────────────────────────────────────────────────────────────
    function safeParseJSON(text?: string) {
      try {
        return text ? JSON.parse(text) : {};
      } catch {
        return {};
      }
    }

    new Worker(
      "seo_tasks",
      async (job) => {
        const { taskId, entityType, entityId } = job.data;
        app.log.info(`🧠 Processing SEO task → ${entityType}#${entityId}`);

        // Live update: task started
        if (app.wsBroadcast) {
          app.wsBroadcast("seo_task_updated", { taskId, entityType, entityId, status: "processing" });
        }

        // 1️⃣ Fetch target entity using shared prisma instance
        const entity =
          entityType === "product"
            ? await prisma.product.findUnique({ where: { id: entityId } })
            : await prisma.seller.findUnique({ where: { id: entityId } });

        if (!entity) {
          if (app.wsBroadcast) {
            app.wsBroadcast("seo_task_updated", { taskId, entityType, entityId, status: "error" });
          }
          throw new Error(`Entity not found → ${entityType}#${entityId}`);
        }

        // 2️⃣ Build AI prompt
        const entityName = (entity as any).name || (entity as any).storeName || "Unknown";
        const entityDesc = (entity as any).description || (entity as any).about || "";
        const prompt = `
          Generate optimized SEO metadata and one internal link suggestion for this ${entityType}.
          Name: ${entityName}
          Description: ${entityDesc || "N/A"}.
          Respond with JSON:
          {"metaTitle":"","metaDescription":"","keywords":"","linkAnchor":"","linkTarget":""}
        `;

        // 3️⃣ Get AI-generated metadata
        const resp = await getOpenAI().chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
        });

        const parsed = safeParseJSON(resp.choices[0].message?.content);

        const seoData = {
          metaTitle: parsed.metaTitle || entityName,
          metaDescription: parsed.metaDescription || entityDesc,
          metaKeywords: parsed.keywords || "",
          seoScore: 90,
        };

        // 4️⃣ Update entity
        if (entityType === "product") {
          await prisma.product.update({ where: { id: entityId }, data: seoData as any });
        } else {
          await prisma.seller.update({ where: { id: entityId }, data: seoData as any });
        }

        // 5️⃣ Internal link
        if (parsed.linkTarget) {
          await prisma.internalLink.create({
            data: {
              fromSlug: (entity as any).slug,
              toSlug: parsed.linkTarget,
              anchorText: parsed.linkAnchor || parsed.linkTarget,
            },
          });
          app.log.info(`🔗 Internal link created → ${(entity as any).slug} → ${parsed.linkTarget}`);
        }

        // 6️⃣ Mark task as complete
        if (taskId) {
          await prisma.seoTask.update({
            where: { id: taskId },
            data: { status: "done", updatedAt: new Date() },
          });
        }

        // Live updates: task done + summary refresh
        if (app.wsBroadcast) {
          app.wsBroadcast("seo_task_updated", { taskId, entityType, entityId, status: "done" });
          app.wsBroadcast("seo_summary_changed");
        }

        app.log.info(`✅ SEO metadata generated → ${entityType}#${entityId}`);
      },
      { connection }
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Expose Queues on Fastify Instance
    // ─────────────────────────────────────────────────────────────────────────
    app.decorate("queues", { notifications, orders, seo });

    // Cleanup on shutdown
    app.addHook("onClose", async () => {
      app.log.info("🔌 Closing queue connections...");
      await notifications.close();
      await orders.close();
      await seo.close();
      if (connection) {
        connection.disconnect();
      }
      app.log.info("✅ Queue connections closed");
    });

    app.log.info("💼 Queues ready → BullMQ + Redis + AI SEO & Internal Link Workers");

  } catch (err: any) {
    app.log.warn(`⚠️ Queue initialization failed: ${err.message}`);
    if (connection) {
      try {
        connection.disconnect();
      } catch {}
    }
  }
}

export default fp(queuesPlugin, {
  name: "queues",
  dependencies: ["prisma"], // Ensure Prisma is loaded first
  fastify: "5.x",
});
