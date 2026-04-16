// ==========================================================
// 🔔 STORESGO NOTIFICATION CONTROLLER
// Handles all notification API operations
// ==========================================================

import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";
import { NotificationChannel, NotificationStatus, NotificationType } from "../types/notification.types.js";

// ----------------------------------------------------------
// 📋 TYPE DEFINITIONS
// ----------------------------------------------------------

interface GetNotificationsQuery {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  channel?: string;
}

interface MarkReadBody {
  notificationIds: number[];
}

interface UpdatePreferencesBody {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
  inAppEnabled?: boolean;
  orderUpdates?: boolean;
  promotions?: boolean;
  systemAlerts?: boolean;
  phoneNumber?: string;
}

interface CreateNotificationBody {
  userId?: string;
  sellerId?: number;
  title: string;
  message: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  referenceType?: string;
  referenceId?: number;
  metadata?: Record<string, any>;
}

// ----------------------------------------------------------
// 📬 GET USER NOTIFICATIONS
// ----------------------------------------------------------

export async function getUserNotifications(
  request: FastifyRequest<{ Querystring: GetNotificationsQuery }>,
  reply: FastifyReply
) {
  try {
    const user = request.user;
    if (!user) {
      return reply.code(401).send({ ok: false, error: "Unauthorized" });
    }

    const {
      page = 1,
      limit = 20,
      status,
      type,
      channel,
    } = request.query;

    const skip = (page - 1) * limit;

    // Build where clause based on user role
    const whereClause: any = {
      channel: channel ? (channel as NotificationChannel) : "IN_APP",
    };

    // Filter by user type
    if (user.role === "BUYER") {
      whereClause.userId = user.id;
    } else if (user.role === "SELLER" && user.sellerId) {
      whereClause.sellerId = user.sellerId;
    } else {
      whereClause.userId = user.id;
    }

    // Optional filters
    if (status) {
      whereClause.status = status as NotificationStatus;
    }
    if (type) {
      whereClause.type = type as NotificationType;
    }

    // Get notifications with pagination
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: whereClause }),
    ]);

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        ...whereClause,
        read: false,
      },
    });

    return reply.send({
      ok: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        unreadCount,
      },
    });
  } catch (err: any) {
    console.error("❌ Get notifications failed:", err);
    return reply.code(500).send({ ok: false, error: "Failed to fetch notifications" });
  }
}

// ----------------------------------------------------------
// 📊 GET NOTIFICATION STATS
// ----------------------------------------------------------

export async function getNotificationStats(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const user = request.user;
    if (!user) {
      return reply.code(401).send({ ok: false, error: "Unauthorized" });
    }

    const whereClause: any = {};

    if (user.role === "BUYER") {
      whereClause.userId = user.id;
    } else if (user.role === "SELLER" && user.sellerId) {
      whereClause.sellerId = user.sellerId;
    } else {
      whereClause.userId = user.id;
    }

    // Get counts by status
    const [total, unread, pending, failed] = await Promise.all([
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({
        where: { ...whereClause, status: { in: ["PENDING", "SENT", "DELIVERED", "UNREAD"] } },
      }),
      prisma.notification.count({
        where: { ...whereClause, status: "PENDING" },
      }),
      prisma.notification.count({
        where: { ...whereClause, status: "FAILED" },
      }),
    ]);

    // Get counts by type (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const byType = await prisma.notification.groupBy({
      by: ["type"],
      where: {
        ...whereClause,
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
    });

    return reply.send({
      ok: true,
      data: {
        total,
        unread,
        pending,
        failed,
        byType: byType.map((t) => ({ type: t.type, count: t._count.id })),
      },
    });
  } catch (err: any) {
    console.error("❌ Get notification stats failed:", err);
    return reply.code(500).send({ ok: false, error: "Failed to fetch notification stats" });
  }
}

// ----------------------------------------------------------
// ✅ MARK NOTIFICATIONS AS READ
// ----------------------------------------------------------

export async function markNotificationsRead(
  request: FastifyRequest<{ Body: MarkReadBody }>,
  reply: FastifyReply
) {
  try {
    const user = request.user;
    if (!user) {
      return reply.code(401).send({ ok: false, error: "Unauthorized" });
    }

    const { notificationIds } = request.body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return reply.code(400).send({ ok: false, error: "notificationIds array required" });
    }

    // Build where clause to ensure user owns these notifications
    const whereClause: any = {
      id: { in: notificationIds },
    };

    if (user.role === "BUYER") {
      whereClause.userId = user.id;
    } else if (user.role === "SELLER" && user.sellerId) {
      whereClause.sellerId = user.sellerId;
    } else {
      whereClause.userId = user.id;
    }

    const result = await prisma.notification.updateMany({
      where: whereClause,
      data: {
        read: true,
        status: "READ",
        readAt: new Date(),
      },
    });

    return reply.send({
      ok: true,
      data: {
        updated: result.count,
      },
    });
  } catch (err: any) {
    console.error("❌ Mark notifications read failed:", err);
    return reply.code(500).send({ ok: false, error: "Failed to mark notifications as read" });
  }
}

// ----------------------------------------------------------
// ✅ MARK ALL NOTIFICATIONS AS READ
// ----------------------------------------------------------

export async function markAllNotificationsRead(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const user = request.user;
    if (!user) {
      return reply.code(401).send({ ok: false, error: "Unauthorized" });
    }

    const whereClause: any = {
      read: false,
    };

    if (user.role === "BUYER") {
      whereClause.userId = user.id;
    } else if (user.role === "SELLER" && user.sellerId) {
      whereClause.sellerId = user.sellerId;
    } else {
      whereClause.userId = user.id;
    }

    const result = await prisma.notification.updateMany({
      where: whereClause,
      data: {
        status: "READ",
        read: true,
        readAt: new Date(),
      },
    });

    return reply.send({
      ok: true,
      data: {
        updated: result.count,
      },
    });
  } catch (err: any) {
    console.error("❌ Mark all notifications read failed:", err);
    return reply.code(500).send({ ok: false, error: "Failed to mark all notifications as read" });
  }
}

// ----------------------------------------------------------
// 🗑️ DELETE NOTIFICATION
// ----------------------------------------------------------

export async function deleteNotification(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const user = request.user;
    if (!user) {
      return reply.code(401).send({ ok: false, error: "Unauthorized" });
    }

    const notificationId = parseInt(request.params.id, 10);
    if (isNaN(notificationId)) {
      return reply.code(400).send({ ok: false, error: "Invalid notification ID" });
    }

    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return reply.code(404).send({ ok: false, error: "Notification not found" });
    }

    // Check ownership
    const isOwner =
      (user.role === "BUYER" && notification.userId === user.id) ||
      (user.role === "SELLER" && notification.sellerId === user.sellerId);

    if (!isOwner) {
      return reply.code(403).send({ ok: false, error: "Not authorized to delete this notification" });
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return reply.send({ ok: true, message: "Notification deleted" });
  } catch (err: any) {
    console.error("❌ Delete notification failed:", err);
    return reply.code(500).send({ ok: false, error: "Failed to delete notification" });
  }
}

// ----------------------------------------------------------
// ⚙️ GET NOTIFICATION PREFERENCES
// ----------------------------------------------------------

export async function getNotificationPreferences(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const user = request.user;
    if (!user) {
      return reply.code(401).send({ ok: false, error: "Unauthorized" });
    }

    let preferences = await prisma.notificationPreference.findFirst({
      where:
        user.role === "SELLER" && user.sellerId
          ? { sellerId: user.sellerId }
          : { userId: user.id },
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data:
          user.role === "SELLER" && user.sellerId
            ? {
                sellerId: user.sellerId,
                emailEnabled: true,
                smsEnabled: false,
                pushEnabled: true,
                inAppEnabled: true,
                orderUpdates: true,
                promotions: true,
                systemAlerts: true,
              }
            : {
                userId: user.id,
                emailEnabled: true,
                smsEnabled: false,
                pushEnabled: true,
                inAppEnabled: true,
                orderUpdates: true,
                promotions: true,
                systemAlerts: true,
              },
      });
    }

    return reply.send({ ok: true, data: preferences });
  } catch (err: any) {
    console.error("❌ Get notification preferences failed:", err);
    return reply.code(500).send({ ok: false, error: "Failed to fetch notification preferences" });
  }
}

// ----------------------------------------------------------
// ⚙️ UPDATE NOTIFICATION PREFERENCES
// ----------------------------------------------------------

export async function updateNotificationPreferences(
  request: FastifyRequest<{ Body: UpdatePreferencesBody }>,
  reply: FastifyReply
) {
  try {
    const user = request.user;
    if (!user) {
      return reply.code(401).send({ ok: false, error: "Unauthorized" });
    }

    const {
      emailEnabled,
      smsEnabled,
      pushEnabled,
      inAppEnabled,
      orderUpdates,
      promotions,
      systemAlerts,
      phoneNumber,
    } = request.body;

    const updateData: any = {};

    if (emailEnabled !== undefined) updateData.emailEnabled = emailEnabled;
    if (smsEnabled !== undefined) updateData.smsEnabled = smsEnabled;
    if (pushEnabled !== undefined) updateData.pushEnabled = pushEnabled;
    if (inAppEnabled !== undefined) updateData.inAppEnabled = inAppEnabled;
    if (orderUpdates !== undefined) updateData.orderUpdates = orderUpdates;
    if (promotions !== undefined) updateData.promotions = promotions;
    if (systemAlerts !== undefined) updateData.systemAlerts = systemAlerts;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

    const whereClause =
      user.role === "SELLER" && user.sellerId
        ? { sellerId: user.sellerId }
        : { userId: user.id };

    // Upsert preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: whereClause,
      update: updateData,
      create: {
        ...whereClause,
        emailEnabled: emailEnabled ?? true,
        smsEnabled: smsEnabled ?? false,
        pushEnabled: pushEnabled ?? true,
        inAppEnabled: inAppEnabled ?? true,
        orderUpdates: orderUpdates ?? true,
        promotions: promotions ?? true,
        systemAlerts: systemAlerts ?? true,
        phoneNumber,
      },
    });

    return reply.send({ ok: true, data: preferences });
  } catch (err: any) {
    console.error("❌ Update notification preferences failed:", err);
    return reply.code(500).send({ ok: false, error: "Failed to update notification preferences" });
  }
}

// ----------------------------------------------------------
// 🔔 GET SINGLE NOTIFICATION
// ----------------------------------------------------------

export async function getNotificationById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const user = request.user;
    if (!user) {
      return reply.code(401).send({ ok: false, error: "Unauthorized" });
    }

    const notificationId = parseInt(request.params.id, 10);
    if (isNaN(notificationId)) {
      return reply.code(400).send({ ok: false, error: "Invalid notification ID" });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return reply.code(404).send({ ok: false, error: "Notification not found" });
    }

    // Check ownership
    const isOwner =
      (user.role === "BUYER" && notification.userId === user.id) ||
      (user.role === "SELLER" && notification.sellerId === user.sellerId);

    if (!isOwner) {
      return reply.code(403).send({ ok: false, error: "Not authorized to view this notification" });
    }

    return reply.send({ ok: true, data: notification });
  } catch (err: any) {
    console.error("❌ Get notification failed:", err);
    return reply.code(500).send({ ok: false, error: "Failed to fetch notification" });
  }
}

// ----------------------------------------------------------
// 🛠️ ADMIN: CREATE NOTIFICATION (for testing/manual sends)
// ----------------------------------------------------------

export async function adminCreateNotification(
  request: FastifyRequest<{ Body: CreateNotificationBody }>,
  reply: FastifyReply
) {
  try {
    const {
      userId,
      sellerId,
      title,
      message,
      type = "SYSTEM",
      channel = "IN_APP",
      referenceType,
      referenceId,
      metadata,
    } = request.body;

    if (!userId && !sellerId) {
      return reply.code(400).send({ ok: false, error: "userId or sellerId required" });
    }

    if (!title || !message) {
      return reply.code(400).send({ ok: false, error: "title and message required" });
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        sellerId,
        title,
        message,
        type,
        channel,
        status: "PENDING",
        referenceType,
        referenceId,
        metadata: metadata || undefined,
      },
    });

    return reply.send({ ok: true, data: notification });
  } catch (err: any) {
    console.error("❌ Admin create notification failed:", err);
    return reply.code(500).send({ ok: false, error: "Failed to create notification" });
  }
}

// ----------------------------------------------------------
// 🛠️ ADMIN: GET ALL NOTIFICATIONS (with filters)
// ----------------------------------------------------------

export async function adminGetAllNotifications(
  request: FastifyRequest<{
    Querystring: GetNotificationsQuery & { userId?: string; sellerId?: number };
  }>,
  reply: FastifyReply
) {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      type,
      channel,
    } = request.query;
    const { userId, sellerId } = request.query;

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (userId) whereClause.userId = userId;
    if (sellerId) whereClause.sellerId = Number(sellerId);
    if (status) whereClause.status = status as NotificationStatus;
    if (type) whereClause.type = type as NotificationType;
    if (channel) whereClause.channel = channel as NotificationChannel;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, email: true } },
          seller: { select: { id: true, storeName: true } },
        },
      }),
      prisma.notification.count({ where: whereClause }),
    ]);

    return reply.send({
      ok: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err: any) {
    console.error("❌ Admin get all notifications failed:", err);
    return reply.code(500).send({ ok: false, error: "Failed to fetch notifications" });
  }
}

