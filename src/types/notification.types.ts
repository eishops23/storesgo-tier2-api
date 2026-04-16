// Notification type definitions - using const objects for string compatibility

export const NotificationChannel = {
  EMAIL: "EMAIL",
  SMS: "SMS",
  PUSH: "PUSH",
  IN_APP: "IN_APP"
} as const;
export type NotificationChannel = typeof NotificationChannel[keyof typeof NotificationChannel];

export const NotificationStatus = {
  PENDING: "PENDING",
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  FAILED: "FAILED",
  READ: "READ",
  UNREAD: "unread"
} as const;
export type NotificationStatus = typeof NotificationStatus[keyof typeof NotificationStatus];

export const NotificationType = {
  ORDER: "ORDER",
  ORDER_PLACED: "ORDER_PLACED",
  ORDER_SHIPPED: "ORDER_SHIPPED",
  ORDER_DELIVERED: "ORDER_DELIVERED",
  ORDER_CANCELLED: "ORDER_CANCELLED",
  SHIPPING: "SHIPPING",
  PROMO: "PROMO",
  PROMOTIONAL: "PROMOTIONAL",
  SYSTEM: "SYSTEM",
  ALERT: "ALERT",
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  PAYOUT_COMPLETED: "PAYOUT_COMPLETED",
  NEW_REVIEW: "NEW_REVIEW",
  SELLER_APPROVED: "SELLER_APPROVED",
  SELLER_BANNED: "SELLER_BANNED",
  PRODUCT_APPROVED: "PRODUCT_APPROVED",
  PRODUCT_REJECTED: "PRODUCT_REJECTED",
  LOW_STOCK: "LOW_STOCK",
  WELCOME: "WELCOME",
  PASSWORD_RESET: "PASSWORD_RESET"
} as const;
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];
