// ==========================================================
// 🔔 STORESGO NOTIFICATION ROUTES
// API endpoints for notification management
// ==========================================================

import { prisma } from "../../lib/prisma.js";
import type { FastifyInstance } from "fastify";
import { authenticateUser } from "../../middleware/authUser.js";
import {
  getUserNotifications,
  getNotificationStats,
  getNotificationById,
  markNotificationsRead,
  markAllNotificationsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  adminCreateNotification,
  adminGetAllNotifications,
} from "../../controllers/notifications.controller.js";

export default async function notificationRoutes(app: FastifyInstance) {
  // ----------------------------------------------------------
  // 👤 USER NOTIFICATION ROUTES (require authentication)
  // ----------------------------------------------------------

  // GET /api/notifications - Get user's notifications (paginated)
  app.get(
    "/",
    { preHandler: [authenticateUser] },
    getUserNotifications
  );

  // GET /api/notifications/stats - Get notification statistics
  app.get(
    "/stats",
    { preHandler: [authenticateUser] },
    getNotificationStats
  );

  // GET /api/notifications/count - Get unread notification count
  app.get(
    "/count",
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        if (!user) {
          return reply.code(401).send({ ok: false, count: 0, error: "Unauthorized" });
        }
        
        const whereClause: any = { read: false, channel: "IN_APP" };
        if (user.role === "BUYER") {
          whereClause.userId = user.id;
        } else if (user.role === "SELLER" && user.sellerId) {
          whereClause.sellerId = user.sellerId;
        } else {
          whereClause.userId = user.id;
        }
        const count = await prisma.notification.count({ where: whereClause });
        return { ok: true, count };
      } catch (error: any) {
        console.error("Notification count error:", error);
        return { ok: true, count: 0 };
      }
    }
  );

  // GET /api/notifications/:id - Get single notification
  app.get<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [authenticateUser] },
    getNotificationById
  );

  // POST /api/notifications/mark-read - Mark specific notifications as read
  app.post(
    "/mark-read",
    { preHandler: [authenticateUser] },
    markNotificationsRead
  );

  // POST /api/notifications/mark-all-read - Mark all notifications as read
  app.post(
    "/mark-all-read",
    { preHandler: [authenticateUser] },
    markAllNotificationsRead
  );


  // POST /api/notifications/read-all - Mark all notifications as read (no body required)
  app.post<{ Body: Record<string, unknown> | null }>(
    "/read-all",
    { preHandler: [authenticateUser], schema: { body: { type: "object", nullable: true } } },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        if (!user) {
          return reply.code(401).send({ ok: false, error: "Unauthorized" });
        }
        
        
        const whereClause: any = { read: false, channel: "IN_APP" };
        if (user.role === "BUYER") {
          whereClause.userId = user.id;
        } else if (user.role === "SELLER" && user.sellerId) {
          whereClause.sellerId = user.sellerId;
        } else {
          whereClause.userId = user.id;
        }
        
        const result = await prisma.notification.updateMany({
          where: whereClause,
          data: { read: true }
        });
        
        return { ok: true, updated: result.count };
      } catch (error: any) {
        console.error("Mark all read error:", error);
        return reply.code(500).send({ ok: false, error: "Failed to mark all as read" });
      }
    }
  );

  // POST /api/notifications/:id/read - Mark single notification as read
  app.post<{ Params: { id: string } }>(
    "/:id/read",
    { preHandler: [authenticateUser], schema: { body: { type: "object", nullable: true } } },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        if (!user) {
          return reply.code(401).send({ ok: false, error: "Unauthorized" });
        }
        const { id } = request.params;
        
        
        const whereClause: any = { id: parseInt(id, 10) };
        if (user.role === "BUYER") {
          whereClause.userId = user.id;
        } else if (user.role === "SELLER" && user.sellerId) {
          whereClause.sellerId = user.sellerId;
        } else {
          whereClause.userId = user.id;
        }
        
        const notification = await prisma.notification.updateMany({
          where: whereClause,
          data: { read: true }
        });
        
        return { ok: true, updated: notification.count };
      } catch (error: any) {
        console.error("Mark notification read error:", error);
        return reply.code(500).send({ ok: false, error: "Failed to mark as read" });
      }
    }
  );
  // DELETE /api/notifications/:id - Delete a notification
  app.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [authenticateUser] },
    deleteNotification
  );

  // ----------------------------------------------------------
  // ⚙️ NOTIFICATION PREFERENCES ROUTES
  // ----------------------------------------------------------

  // GET /api/notifications/preferences - Get user's notification preferences
  app.get(
    "/preferences",
    { preHandler: [authenticateUser] },
    getNotificationPreferences
  );

  // PUT /api/notifications/preferences - Update notification preferences
  app.put(
    "/preferences",
    { preHandler: [authenticateUser] },
    updateNotificationPreferences
  );

  // PATCH /api/notifications/preferences - Update notification preferences (partial)
  app.patch(
    "/preferences",
    { preHandler: [authenticateUser] },
    updateNotificationPreferences
  );

  // ----------------------------------------------------------
  // 🛠️ ADMIN ROUTES (for testing and manual management)
  // These should have admin auth middleware in production
  // ----------------------------------------------------------

  // POST /api/notifications/admin/create - Admin create notification
  app.post(
    "/admin/create",
    { preHandler: [authenticateUser] }, // TODO: Add admin check
    adminCreateNotification
  );

  // GET /api/notifications/admin/all - Admin get all notifications
  app.get(
    "/admin/all",
    { preHandler: [authenticateUser] }, // TODO: Add admin check
    adminGetAllNotifications
  );
}

