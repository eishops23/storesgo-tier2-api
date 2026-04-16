// =============================================================================
// 📝 AUTOBLOG CRON — Simple daily blog post generation
// =============================================================================

import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import { runAutoblogOnce } from "../jobs/autoblog.js";

// Schedule: Run at these hours daily (6 times = 6 posts max)
const AUTOBLOG_SCHEDULE = process.env.AUTOBLOG_CRON_SCHEDULE || "0 0,4,8,12,16,20 * * *";

export async function startAutoblogCron() {
  console.log("📝 Initializing Autoblog Cron...");

  cron.schedule(AUTOBLOG_SCHEDULE, async () => {
    console.log("📝 Autoblog cron triggered...");
    
    try {
      const result = await runAutoblogOnce();
      
      if (result.created) {
        console.log(`✅ Autoblog post created: ${result.slug}`);
      } else {
        console.log(`⏭️ Autoblog skipped: ${result.reason}`);
      }
    } catch (err: any) {
      console.error("❌ Autoblog generation failed:", err.message);
    }
  });

  console.log(`✅ Autoblog Cron active: ${AUTOBLOG_SCHEDULE}`);
}
