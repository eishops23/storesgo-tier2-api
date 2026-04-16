// ==========================================================
// 🔔 STORESGO NOTIFICATION SERVICE
// Comprehensive service for creating, storing, and delivering notifications
// ==========================================================

import { prisma } from "../lib/prisma.js";
import { NotificationChannel, NotificationStatus, NotificationType } from "../types/notification.types.js";
import { Prisma } from "@prisma/client";
import {
  sendEmail,
  sendSms,
  emailTemplates,
  smsTemplates,
  wrapHtmlTemplate,
} from "../utils/notifySender.js";

// ----------------------------------------------------------
// 📋 TYPE DEFINITIONS
// ----------------------------------------------------------

export interface CreateNotificationInput {
  // Recipient (at least one required)
  userId?: string;
  sellerId?: number;
  adminId?: number;

  // Content
  title: string;
  message: string;
  type?: NotificationType;

  // Delivery channels
  channels?: NotificationChannel[];

  // Contact info (for email/SMS)
  recipientEmail?: string;
  recipientPhone?: string;

  // Reference to related entity
  referenceType?: string;
  referenceId?: number;

  // Metadata
  metadata?: Record<string, any>;

  // Options
  sendImmediately?: boolean;
}

export interface NotificationResult {
  success: boolean;
  notificationIds: number[];
  errors?: string[];
}

// ----------------------------------------------------------
// 🔔 CREATE AND SEND NOTIFICATION
// Main function to create notification records and optionally send them
// ----------------------------------------------------------

export async function createNotification(
  input: CreateNotificationInput
): Promise<NotificationResult> {
  const {
    userId,
    sellerId,
    adminId,
    title,
    message,
    type = "SYSTEM",
    channels = ["IN_APP"],
    recipientEmail,
    recipientPhone,
    referenceType,
    referenceId,
    metadata,
    sendImmediately = true,
  } = input;

  // Validate recipient
  if (!userId && !sellerId && !adminId) {
    return {
      success: false,
      notificationIds: [],
      errors: ["At least one recipient (userId, sellerId, or adminId) is required"],
    };
  }

  const notificationIds: number[] = [];
  const errors: string[] = [];

  // Check user preferences if applicable
  let preferences: any = null;
  if (userId) {
    preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });
  } else if (sellerId) {
    preferences = await prisma.notificationPreference.findUnique({
      where: { sellerId },
    });
  }

  // Filter channels based on preferences
  let effectiveChannels = channels;
  if (preferences) {
    effectiveChannels = channels.filter((channel) => {
      if (channel === "EMAIL" && !preferences.emailEnabled) return false;
      if (channel === "SMS" && !preferences.smsEnabled) return false;
      if (channel === "IN_APP" && !preferences.inAppEnabled) return false;
      if (channel === "PUSH" && !preferences.pushEnabled) return false;
      return true;
    });

    // Filter by notification type preferences
    const isOrderRelated = [
      "ORDER_PLACED",
      "ORDER_SHIPPED",
      "ORDER_DELIVERED",
      "ORDER_CANCELLED",
    ].includes(type);
    const isPromotion = type === "PROMOTIONAL";
    const isSystem = type === "SYSTEM";

    if (isOrderRelated && !preferences.orderUpdates) {
      effectiveChannels = effectiveChannels.filter((c) => c === "IN_APP");
    }
    if (isPromotion && !preferences.promotions) {
      effectiveChannels = [];
    }
    if (isSystem && !preferences.systemAlerts) {
      effectiveChannels = effectiveChannels.filter((c) => c === "IN_APP");
    }
  }

  // Create notification record for each channel
  for (const channel of effectiveChannels) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          sellerId,
          adminId,
          title,
          message,
          type,
          channel,
          status: "PENDING",
          recipientEmail: channel === "EMAIL" ? recipientEmail : null,
          recipientPhone: channel === "SMS" ? recipientPhone : null,
          referenceType,
          referenceId,
          metadata: metadata || Prisma.JsonNull,
        },
      });

      notificationIds.push(notification.id);

      // Send immediately if requested
      if (sendImmediately && (channel === "EMAIL" || channel === "SMS")) {
        await deliverNotification(notification.id);
      } else if (channel === "IN_APP") {
        // Mark in-app notifications as delivered immediately
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: "DELIVERED",
            sentAt: new Date(),
          },
        });
      }
    } catch (err: any) {
      console.error(`❌ Failed to create ${channel} notification:`, err);
      errors.push(`Failed to create ${channel} notification: ${err.message}`);
    }
  }

  return {
    success: notificationIds.length > 0,
    notificationIds,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// ----------------------------------------------------------
// 📤 DELIVER NOTIFICATION
// Send the actual email/SMS for a notification
// ----------------------------------------------------------

export async function deliverNotification(notificationId: number): Promise<boolean> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    console.error(`❌ Notification ${notificationId} not found`);
    return false;
  }

  try {
    let success = false;

    if (notification.channel === "EMAIL" && notification.recipientEmail) {
      const result = await sendEmail({
        to: notification.recipientEmail,
        subject: notification.title,
        text: notification.message,
        html: wrapHtmlTemplate(`<p>${notification.message}</p>`, notification.title),
      });
      success = result.success;

      if (!success && result.error) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: "FAILED",
            failReason: result.error,
            retryCount: { increment: 1 },
          },
        });
        return false;
      }
    } else if (notification.channel === "SMS" && notification.recipientPhone) {
      const result = await sendSms({
        to: notification.recipientPhone,
        message: notification.message,
      });
      success = result.success;

      if (!success && result.error) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: "FAILED",
            failReason: result.error,
            retryCount: { increment: 1 },
          },
        });
        return false;
      }
    }

    if (success) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });
    }

    return success;
  } catch (err: any) {
    console.error(`❌ Failed to deliver notification ${notificationId}:`, err);

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: "FAILED",
        failReason: err.message,
        retryCount: { increment: 1 },
      },
    });

    return false;
  }
}

// ----------------------------------------------------------
// 📦 ORDER NOTIFICATIONS
// ----------------------------------------------------------

export async function notifyOrderPlaced(data: {
  orderId: number;
  buyerId: string;
  buyerEmail: string;
  buyerName?: string;
  sellerId: number;
  sellerEmail?: string;
  sellerPhone?: string;
  totalAmount: string;
  itemCount: number;
  storeName?: string;
}): Promise<void> {
  // Notify buyer
  const buyerTemplate = emailTemplates.orderPlaced({
    orderId: data.orderId,
    customerName: data.buyerName || "Customer",
    totalAmount: data.totalAmount,
  });

  await createNotification({
    userId: data.buyerId,
    title: buyerTemplate.subject,
    message: buyerTemplate.text,
    type: "ORDER_PLACED",
    channels: ["IN_APP", "EMAIL"],
    recipientEmail: data.buyerEmail,
    referenceType: "order",
    referenceId: data.orderId,
    metadata: {
      htmlContent: buyerTemplate.html,
      totalAmount: data.totalAmount,
    },
  });

  // Notify seller
  const sellerTemplate = emailTemplates.newOrderForSeller({
    orderId: data.orderId,
    storeName: data.storeName || "Your Store",
    totalAmount: data.totalAmount,
    itemCount: data.itemCount,
  });

  await createNotification({
    sellerId: data.sellerId,
    title: sellerTemplate.subject,
    message: sellerTemplate.text,
    type: "ORDER_PLACED",
    channels: ["IN_APP", "EMAIL", "SMS"],
    recipientEmail: data.sellerEmail,
    recipientPhone: data.sellerPhone,
    referenceType: "order",
    referenceId: data.orderId,
    metadata: {
      htmlContent: sellerTemplate.html,
      totalAmount: data.totalAmount,
      itemCount: data.itemCount,
      smsMessage: smsTemplates.newOrderForSeller({
        orderId: data.orderId,
        totalAmount: data.totalAmount,
      }),
    },
  });
}

export async function notifyOrderShipped(data: {
  orderId: number;
  buyerId: string;
  buyerEmail: string;
  buyerName?: string;
  buyerPhone?: string;
  trackingNumber?: string;
}): Promise<void> {
  const template = emailTemplates.orderShipped({
    orderId: data.orderId,
    customerName: data.buyerName || "Customer",
    trackingNumber: data.trackingNumber,
  });

  await createNotification({
    userId: data.buyerId,
    title: template.subject,
    message: template.text,
    type: "ORDER_SHIPPED",
    channels: ["IN_APP", "EMAIL", "SMS"],
    recipientEmail: data.buyerEmail,
    recipientPhone: data.buyerPhone,
    referenceType: "order",
    referenceId: data.orderId,
    metadata: {
      htmlContent: template.html,
      trackingNumber: data.trackingNumber,
      smsMessage: smsTemplates.orderShipped({
        orderId: data.orderId,
        trackingNumber: data.trackingNumber,
      }),
    },
  });
}

export async function notifyOrderDelivered(data: {
  orderId: number;
  buyerId: string;
  buyerEmail: string;
  buyerName?: string;
}): Promise<void> {
  await createNotification({
    userId: data.buyerId,
    title: `Order #${data.orderId} Delivered`,
    message: `Great news, ${data.buyerName || "Customer"}! Your order #${data.orderId} has been delivered. We hope you enjoy your purchase!`,
    type: "ORDER_DELIVERED",
    channels: ["IN_APP", "EMAIL"],
    recipientEmail: data.buyerEmail,
    referenceType: "order",
    referenceId: data.orderId,
  });
}

export async function notifyOrderCancelled(data: {
  orderId: number;
  buyerId: string;
  buyerEmail: string;
  sellerId: number;
  sellerEmail?: string;
  reason?: string;
}): Promise<void> {
  // Notify buyer
  await createNotification({
    userId: data.buyerId,
    title: `Order #${data.orderId} Cancelled`,
    message: `Your order #${data.orderId} has been cancelled.${data.reason ? ` Reason: ${data.reason}` : ""} If you have any questions, please contact support.`,
    type: "ORDER_CANCELLED",
    channels: ["IN_APP", "EMAIL"],
    recipientEmail: data.buyerEmail,
    referenceType: "order",
    referenceId: data.orderId,
  });

  // Notify seller
  await createNotification({
    sellerId: data.sellerId,
    title: `Order #${data.orderId} Cancelled`,
    message: `Order #${data.orderId} has been cancelled.${data.reason ? ` Reason: ${data.reason}` : ""}`,
    type: "ORDER_CANCELLED",
    channels: ["IN_APP", "EMAIL"],
    recipientEmail: data.sellerEmail,
    referenceType: "order",
    referenceId: data.orderId,
  });
}

// ----------------------------------------------------------
// 💰 PAYMENT NOTIFICATIONS
// ----------------------------------------------------------

export async function notifyPaymentReceived(data: {
  orderId: number;
  buyerId: string;
  buyerEmail: string;
  amount: string;
}): Promise<void> {
  const template = emailTemplates.paymentReceived({
    orderId: data.orderId,
    amount: data.amount,
  });

  await createNotification({
    userId: data.buyerId,
    title: template.subject,
    message: template.text,
    type: "PAYMENT_RECEIVED",
    channels: ["IN_APP", "EMAIL"],
    recipientEmail: data.buyerEmail,
    referenceType: "order",
    referenceId: data.orderId,
    metadata: {
      htmlContent: template.html,
      amount: data.amount,
    },
  });
}

export async function notifyPayoutCompleted(data: {
  sellerId: number;
  sellerEmail: string;
  amount: string;
  payoutId: number;
}): Promise<void> {
  await createNotification({
    sellerId: data.sellerId,
    title: `Payout of ${data.amount} Completed`,
    message: `Your payout of ${data.amount} has been processed and sent to your account. Please allow 2-3 business days for the funds to appear.`,
    type: "PAYOUT_COMPLETED",
    channels: ["IN_APP", "EMAIL"],
    recipientEmail: data.sellerEmail,
    referenceType: "payout",
    referenceId: data.payoutId,
    metadata: {
      amount: data.amount,
    },
  });
}

// ----------------------------------------------------------
// 🌟 REVIEW NOTIFICATIONS
// ----------------------------------------------------------

export async function notifyNewReview(data: {
  sellerId: number;
  sellerEmail?: string;
  productId: number;
  productName: string;
  rating: number;
  reviewText?: string;
  reviewId: number;
}): Promise<void> {
  const template = emailTemplates.newReview({
    storeName: "Your Store",
    productName: data.productName,
    rating: data.rating,
    reviewText: data.reviewText,
  });

  await createNotification({
    sellerId: data.sellerId,
    title: template.subject,
    message: template.text,
    type: "NEW_REVIEW",
    channels: ["IN_APP", "EMAIL"],
    recipientEmail: data.sellerEmail,
    referenceType: "review",
    referenceId: data.reviewId,
    metadata: {
      htmlContent: template.html,
      productId: data.productId,
      productName: data.productName,
      rating: data.rating,
    },
  });
}

// ----------------------------------------------------------
// 🏪 SELLER NOTIFICATIONS
// ----------------------------------------------------------

export async function notifySellerApproved(data: {
  sellerId: number;
  sellerEmail: string;
  sellerPhone?: string;
  storeName: string;
}): Promise<void> {
  const template = emailTemplates.sellerApproved({
    storeName: data.storeName,
  });

  await createNotification({
    sellerId: data.sellerId,
    title: template.subject,
    message: template.text,
    type: "SELLER_APPROVED",
    channels: ["IN_APP", "EMAIL", "SMS"],
    recipientEmail: data.sellerEmail,
    recipientPhone: data.sellerPhone,
    metadata: {
      htmlContent: template.html,
      smsMessage: smsTemplates.sellerApproved({ storeName: data.storeName }),
    },
  });
}

export async function notifySellerBanned(data: {
  sellerId: number;
  sellerEmail: string;
  storeName: string;
  reason?: string;
}): Promise<void> {
  await createNotification({
    sellerId: data.sellerId,
    title: `Store "${data.storeName}" Suspended`,
    message: `Your store "${data.storeName}" has been suspended from StoresGo.${data.reason ? ` Reason: ${data.reason}` : ""} Please contact support if you have questions.`,
    type: "SELLER_BANNED",
    channels: ["IN_APP", "EMAIL"],
    recipientEmail: data.sellerEmail,
  });
}

// ----------------------------------------------------------
// 📦 PRODUCT NOTIFICATIONS
// ----------------------------------------------------------

export async function notifyProductApproved(data: {
  sellerId: number;
  sellerEmail?: string;
  productId: number;
  productName: string;
}): Promise<void> {
  await createNotification({
    sellerId: data.sellerId,
    title: `Product "${data.productName}" Approved`,
    message: `Great news! Your product "${data.productName}" has been approved and is now live on StoresGo.`,
    type: "PRODUCT_APPROVED",
    channels: ["IN_APP", "EMAIL"],
    recipientEmail: data.sellerEmail,
    referenceType: "product",
    referenceId: data.productId,
  });
}

export async function notifyProductRejected(data: {
  sellerId: number;
  sellerEmail?: string;
  productId: number;
  productName: string;
  reason?: string;
}): Promise<void> {
  await createNotification({
    sellerId: data.sellerId,
    title: `Product "${data.productName}" Rejected`,
    message: `Your product "${data.productName}" was not approved.${data.reason ? ` Reason: ${data.reason}` : ""} Please review and resubmit.`,
    type: "PRODUCT_REJECTED",
    channels: ["IN_APP", "EMAIL"],
    recipientEmail: data.sellerEmail,
    referenceType: "product",
    referenceId: data.productId,
  });
}

export async function notifyLowStock(data: {
  sellerId: number;
  sellerEmail?: string;
  productId: number;
  productName: string;
  currentStock: number;
}): Promise<void> {
  await createNotification({
    sellerId: data.sellerId,
    title: `Low Stock Alert: ${data.productName}`,
    message: `Your product "${data.productName}" is running low on stock (${data.currentStock} remaining). Consider restocking soon.`,
    type: "LOW_STOCK",
    channels: ["IN_APP", "EMAIL"],
    recipientEmail: data.sellerEmail,
    referenceType: "product",
    referenceId: data.productId,
    metadata: {
      currentStock: data.currentStock,
    },
  });
}

// ----------------------------------------------------------
// 👋 WELCOME NOTIFICATIONS
// ----------------------------------------------------------

export async function notifyWelcomeBuyer(data: {
  userId: string;
  userEmail: string;
  name?: string;
}): Promise<void> {
  const template = emailTemplates.welcome({
    name: data.name || "there",
    userType: "buyer",
  });

  await createNotification({
    userId: data.userId,
    title: template.subject,
    message: template.text,
    type: "WELCOME",
    channels: ["IN_APP", "EMAIL"],
    recipientEmail: data.userEmail,
    metadata: {
      htmlContent: template.html,
    },
  });
}

export async function notifyWelcomeSeller(data: {
  sellerId: number;
  sellerEmail: string;
  storeName: string;
}): Promise<void> {
  const template = emailTemplates.welcome({
    name: data.storeName,
    userType: "seller",
  });

  await createNotification({
    sellerId: data.sellerId,
    title: template.subject,
    message: template.text,
    type: "WELCOME",
    channels: ["IN_APP", "EMAIL"],
    recipientEmail: data.sellerEmail,
    metadata: {
      htmlContent: template.html,
    },
  });
}

// ----------------------------------------------------------
// 🔐 SECURITY NOTIFICATIONS
// ----------------------------------------------------------

export async function notifyPasswordReset(data: {
  userId?: string;
  sellerId?: number;
  email: string;
  resetLink: string;
}): Promise<void> {
  await createNotification({
    userId: data.userId,
    sellerId: data.sellerId,
    title: "Password Reset Request - StoresGo",
    message: `You requested a password reset for your StoresGo account. Click the link to reset your password: ${data.resetLink}. This link expires in 1 hour.`,
    type: "PASSWORD_RESET",
    channels: ["EMAIL"],
    recipientEmail: data.email,
    metadata: {
      resetLink: data.resetLink,
    },
  });
}

// ----------------------------------------------------------
// 📢 PROMOTIONAL NOTIFICATIONS
// ----------------------------------------------------------

export async function sendPromotionalNotification(data: {
  title: string;
  message: string;
  htmlContent?: string;
  targetAudience: "all" | "buyers" | "sellers";
  metadata?: Record<string, any>;
}): Promise<number> {
  let recipients: Array<{ userId?: string; sellerId?: number; email: string }> = [];

  if (data.targetAudience === "all" || data.targetAudience === "buyers") {
    const buyers = await prisma.user.findMany({
      where: { role: "BUYER" },
      select: { id: true, email: true },
    });
    recipients.push(...buyers.map((b) => ({ userId: b.id, email: b.email })));
  }

  if (data.targetAudience === "all" || data.targetAudience === "sellers") {
    const sellers = await prisma.seller.findMany({
      where: { user: { isNot: null } },
      select: { id: true, user: { select: { email: true } } },
    });
    recipients.push(
      ...sellers
        .filter((s) => s.user?.email)
        .map((s) => ({ sellerId: s.id, email: s.user!.email }))
    );
  }

  let sentCount = 0;

  for (const recipient of recipients) {
    try {
      await createNotification({
        userId: recipient.userId,
        sellerId: recipient.sellerId,
        title: data.title,
        message: data.message,
        type: "PROMOTIONAL",
        channels: ["IN_APP", "EMAIL"],
        recipientEmail: recipient.email,
        metadata: {
          htmlContent: data.htmlContent,
          ...data.metadata,
        },
        sendImmediately: false, // Queue for batch processing
      });
      sentCount++;
    } catch (err: any) {
      console.error(`Failed to queue promotional notification for ${recipient.email}:`, err);
    }
  }

  return sentCount;
}

// ----------------------------------------------------------
// 🔄 RETRY FAILED NOTIFICATIONS
// ----------------------------------------------------------

export async function retryFailedNotifications(maxRetries: number = 3): Promise<number> {
  const failedNotifications = await prisma.notification.findMany({
    where: {
      status: "FAILED",
      retryCount: { lt: maxRetries },
      channel: { in: ["EMAIL", "SMS"] },
    },
    take: 50,
  });

  let retriedCount = 0;

  for (const notification of failedNotifications) {
    const success = await deliverNotification(notification.id);
    if (success) retriedCount++;
  }

  return retriedCount;
}

// ----------------------------------------------------------
// 🧹 CLEANUP OLD NOTIFICATIONS
// ----------------------------------------------------------

export async function cleanupOldNotifications(daysOld: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      status: "READ",
    },
  });

  return result.count;
}

