// =============================================================================
// ⏰ SEO Cron — Phase 9.6 (Auto-Dispatch Missing SEO Tasks)
// =============================================================================
// Scans for products & sellers missing meta tags,
// then queues them into BullMQ (seo-tasks) for AI generation.
// Compatible with unified queues.ts (notifications + orders + seo)
// =============================================================================

import cron from "node-cron";

// Import shared prisma singleton
import { prisma } from "../lib/prisma.js";

// Note: seoQueue is optional - may not be available without Redis
let seoQueue: any = null;

export function setSeoQueue(queue: any) {
  seoQueue = queue;
}

export async function startSeoCron() {
  const schedule = process.env.SEO_CRON_SCHEDULE || "*/15 * * * *"; // every 15 min
  const batch = Number(process.env.SEO_MAX_BATCH || 25);

  console.log(`🕒 SEO Cron initialized → schedule: ${schedule}, batch size: ${batch}`);

  cron.schedule(schedule, async () => {
    try {
      console.log("⏰ SEO Cron: scanning for unoptimized records…");

      // 🧩 1️⃣ Find products missing meta fields
      const products = await prisma.product.findMany({
        where: { OR: [{ metaTitle: null }, { metaDescription: null }] } as any,
        select: { id: true },
        take: batch,
      });

      // 🧩 2️⃣ Find sellers missing meta fields
      const sellers = await prisma.seller.findMany({
        where: { OR: [{ metaTitle: null }, { metaDescription: null }] } as any,
        select: { id: true },
        take: batch,
      });

      // 🧠 3️⃣ Queue SEO jobs if queue is available
      if (seoQueue) {
        for (const p of products) {
          await seoQueue.add("seo-generate", {
            entityType: "product",
            entityId: p.id,
            taskId: null,
          });
        }

        for (const s of sellers) {
          await seoQueue.add("seo-generate", {
            entityType: "seller",
            entityId: s.id,
            taskId: null,
          });
        }

        console.log(
          `✅ SEO Cron dispatched ${products.length} products + ${sellers.length} sellers for AI SEO processing`
        );
      } else {
        console.log(
          `ℹ️ SEO Cron found ${products.length} products + ${sellers.length} sellers (queue not available)`
        );
      }
    } catch (err: any) {
      console.error("❌ SEO Cron error:", err.message);
    }
  });
}
