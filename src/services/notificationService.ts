// ------------------------------------------------------
// 📬 Notification Service — Phase 7
// ------------------------------------------------------
// Adds background notification jobs via BullMQ (email, SMS, system)
// ------------------------------------------------------

import type { FastifyInstance } from "fastify";

export async function sendNotification(
  app: FastifyInstance,
  data: {
    to: string;
    subject?: string;
    message: string;
    type?: "email" | "sms" | "system";
  }
) {
  try {
    await app.queues.notifications.add("send-notification", {
      to: data.to,
      subject: data.subject || "StoresGo Update",
      message: data.message,
      type: data.type || "email",
    });

    app.log.info(`📨 Queued notification for ${data.to}`);
  } catch (err: any) {
    app.log.error({ err }, "❌ Failed to queue notification");
    throw err;
  }
}
