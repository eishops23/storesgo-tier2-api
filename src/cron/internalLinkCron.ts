// =============================================================================
// 🔗 Internal Link Builder Cron — Phase 9.6
// =============================================================================
// Runs daily to build contextual internal links between SEO pages.
// Pulls from SeoPage and InternalLink models.
// =============================================================================

import cron from "node-cron";

// Import shared prisma singleton
import { prisma } from "../lib/prisma.js";

export async function startInternalLinkCron() {
  const schedule = process.env.LINK_CRON_SCHEDULE || "0 3 * * *"; // default: daily 3 AM
  const batch = Number(process.env.LINK_BATCH || 10);

  console.log(`🔗 Internal Link Cron initialized → schedule: ${schedule}, batch size: ${batch}`);

  cron.schedule(schedule, async () => {
    try {
      console.log("🔗 Internal Link Builder: running...");

      // 🧩 1️⃣ Get random SEO pages
      const pages = await prisma.seoPage.findMany({
        take: batch,
        orderBy: { updatedAt: "desc" },
      });

      // 🧠 2️⃣ Generate links between random pairs
      let linksCreated = 0;
      for (let i = 0; i < pages.length - 1; i++) {
        const from = pages[i];
        const to = pages[i + 1];

        try {
          await prisma.internalLink.create({
            data: {
              fromSlug: from.slug,
              toSlug: to.slug,
              anchorText: from.title.split(" ")[0] || "Read more",
            },
          });
          linksCreated++;
        } catch {
          // Link may already exist, skip
        }
      }

      console.log(`✅ Internal Link Builder created ${linksCreated} new links`);
    } catch (err: any) {
      console.error("❌ Internal Link Builder error:", err.message);
    }
  });
}
