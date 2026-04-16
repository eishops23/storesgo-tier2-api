// =============================================================================
// 📊 SEO Report Cron — Weekly SEO Summary Email
// =============================================================================

import cron from "node-cron";
import nodemailer from "nodemailer";

// Import shared prisma singleton
import { prisma } from "../lib/prisma.js";

export function startSeoReportCron() {
  console.log("📊 SEO Report Cron initialized → schedule: 0 8 * * MON (Mondays 8 AM)");

  cron.schedule("0 8 * * MON", async () => {
    try {
      console.log("📊 Generating weekly SEO report...");

      const [done, error] = await Promise.all([
        prisma.seoTask.count({ where: { status: "done" } }),
        prisma.seoTask.count({ where: { status: "error" } }),
      ]);

      const html = `
        <h2>StoresGo Weekly SEO Report</h2>
        <p>✅ Completed Tasks: ${done}</p>
        <p>⚠️ Failed Tasks: ${error}</p>
        <p>Generated at ${new Date().toLocaleString()}</p>
      `;

      // Only send email if SMTP is configured
      if (!process.env.SMTP_HOST) {
        console.log("ℹ️ SEO Report: SMTP not configured, skipping email");
        console.log(`   Completed: ${done}, Failed: ${error}`);
        return;
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      await transporter.sendMail({
        from: process.env.MAIL_FROM || "noreply@storesgo.com",
        to: process.env.ADMIN_EMAIL || "admin@storesgo.com",
        subject: "Weekly SEO Report",
        html,
      });

      console.log("📬 Weekly SEO Report sent to admin");
    } catch (err: any) {
      console.error("❌ SEO Report Cron error:", err.message);
    }
  });
}
