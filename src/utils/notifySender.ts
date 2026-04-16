// ==========================================================
// 🔔 STORESGO NOTIFICATION SENDER UTILITY
// Email (Nodemailer/SendGrid) + SMS (Twilio) Integration
// ==========================================================

import nodemailer from "nodemailer";

// ----------------------------------------------------------
// 📧 EMAIL CONFIGURATION
// ----------------------------------------------------------

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SendGridConfig {
  apiKey: string;
}

// Create email transporter based on environment
function createEmailTransporter() {
  // Check if using SendGrid API
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // Fallback to SMTP configuration
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  });
}

// ----------------------------------------------------------
// 📧 EMAIL SENDER
// ----------------------------------------------------------

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: options.from || process.env.MAIL_FROM || "StoresGo <no-reply@storesgo.com>",
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo,
      attachments: options.attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent to ${options.to}: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error(`❌ Email send failed to ${options.to}:`, error.message);
    
    return {
      success: false,
      error: error.message,
    };
  }
}

// ----------------------------------------------------------
// 📱 SMS CONFIGURATION (TWILIO)
// ----------------------------------------------------------

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return null;
  }

  return { accountSid, authToken, fromNumber };
}

// ----------------------------------------------------------
// 📱 SMS SENDER
// ----------------------------------------------------------

export interface SmsOptions {
  to: string;
  message: string;
  from?: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSms(options: SmsOptions): Promise<SmsResult> {
  const config = getTwilioConfig();

  if (!config) {
    console.warn("⚠️ Twilio not configured. SMS not sent.");
    return {
      success: false,
      error: "Twilio not configured",
    };
  }

  try {
    // Dynamic import to avoid issues if twilio is not installed
    const twilio = await import("twilio");
    const client = twilio.default(config.accountSid, config.authToken);

    // Format phone number (ensure it has country code)
    let toNumber = options.to.replace(/\D/g, "");
    if (!toNumber.startsWith("1") && toNumber.length === 10) {
      toNumber = "1" + toNumber; // Default to US
    }
    if (!toNumber.startsWith("+")) {
      toNumber = "+" + toNumber;
    }

    const message = await client.messages.create({
      body: options.message,
      from: options.from || config.fromNumber,
      to: toNumber,
    });

    console.log(`✅ SMS sent to ${options.to}: ${message.sid}`);

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error: any) {
    console.error(`❌ SMS send failed to ${options.to}:`, error.message);

    return {
      success: false,
      error: error.message,
    };
  }
}

// ----------------------------------------------------------
// 🔔 UNIFIED NOTIFICATION SENDER
// ----------------------------------------------------------

export type NotificationChannel = "email" | "sms" | "both";

export interface NotificationOptions {
  channel: NotificationChannel;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
  htmlContent?: string;
}

export interface NotificationResult {
  email?: EmailResult;
  sms?: SmsResult;
}

export async function sendNotification(
  options: NotificationOptions
): Promise<NotificationResult> {
  const result: NotificationResult = {};

  // Send email if channel includes email
  if (
    (options.channel === "email" || options.channel === "both") &&
    options.email
  ) {
    result.email = await sendEmail({
      to: options.email,
      subject: options.subject || "StoresGo Notification",
      text: options.message,
      html: options.htmlContent,
    });
  }

  // Send SMS if channel includes SMS
  if (
    (options.channel === "sms" || options.channel === "both") &&
    options.phone
  ) {
    result.sms = await sendSms({
      to: options.phone,
      message: options.message,
    });
  }

  return result;
}

// ----------------------------------------------------------
// 📧 EMAIL TEMPLATE HELPERS
// ----------------------------------------------------------

export function wrapHtmlTemplate(content: string, title: string = "StoresGo"): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f4f6f9;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #00875A 0%, #00A36C 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .btn {
      display: inline-block;
      background: #00875A;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 10px 0;
    }
    .btn:hover {
      background: #006644;
    }
    .highlight {
      background: #e8f5e9;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛒 StoresGo</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} StoresGo Inc. All rights reserved.</p>
      <p>This email was sent by StoresGo Marketplace</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Pre-built notification templates
export const emailTemplates = {
  orderPlaced: (data: { orderId: number; customerName: string; totalAmount: string }) => ({
    subject: `Order #${data.orderId} Confirmed - StoresGo`,
    html: wrapHtmlTemplate(`
      <h2>Thank you for your order, ${data.customerName}! 🎉</h2>
      <p>Your order has been successfully placed and is being processed.</p>
      <div class="highlight">
        <p><strong>Order Number:</strong> #${data.orderId}</p>
        <p><strong>Total Amount:</strong> ${data.totalAmount}</p>
      </div>
      <p>You will receive another email once your order ships.</p>
      <a href="${process.env.FRONTEND_URL || 'https://storesgo.com'}/orders/${data.orderId}" class="btn">View Order Details</a>
    `),
    text: `Thank you for your order, ${data.customerName}! Order #${data.orderId} has been confirmed. Total: ${data.totalAmount}`,
  }),

  orderShipped: (data: { orderId: number; customerName: string; trackingNumber?: string }) => ({
    subject: `Order #${data.orderId} Shipped - StoresGo`,
    html: wrapHtmlTemplate(`
      <h2>Great news, ${data.customerName}! 📦</h2>
      <p>Your order is on its way!</p>
      <div class="highlight">
        <p><strong>Order Number:</strong> #${data.orderId}</p>
        ${data.trackingNumber ? `<p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ''}
      </div>
      <a href="${process.env.FRONTEND_URL || 'https://storesgo.com'}/orders/${data.orderId}" class="btn">Track Your Order</a>
    `),
    text: `Your order #${data.orderId} has shipped!${data.trackingNumber ? ` Tracking: ${data.trackingNumber}` : ''}`,
  }),

  newOrderForSeller: (data: { orderId: number; storeName: string; totalAmount: string; itemCount: number }) => ({
    subject: `New Order #${data.orderId} - ${data.storeName}`,
    html: wrapHtmlTemplate(`
      <h2>You have a new order! 🎊</h2>
      <p>A customer has placed an order in your store.</p>
      <div class="highlight">
        <p><strong>Order Number:</strong> #${data.orderId}</p>
        <p><strong>Items:</strong> ${data.itemCount} item(s)</p>
        <p><strong>Total:</strong> ${data.totalAmount}</p>
      </div>
      <p>Please process this order as soon as possible.</p>
      <a href="${process.env.SELLER_DASHBOARD_URL || 'https://seller.storesgo.com'}/orders/${data.orderId}" class="btn">View Order</a>
    `),
    text: `New order #${data.orderId} received! ${data.itemCount} items for ${data.totalAmount}. Please process ASAP.`,
  }),

  sellerApproved: (data: { storeName: string }) => ({
    subject: `Congratulations! Your Store "${data.storeName}" is Approved - StoresGo`,
    html: wrapHtmlTemplate(`
      <h2>Welcome to StoresGo, ${data.storeName}! 🎉</h2>
      <p>Great news! Your seller account has been approved and you can now start selling on our marketplace.</p>
      <div class="highlight">
        <p><strong>Next Steps:</strong></p>
        <ul>
          <li>Complete your store profile</li>
          <li>Add your first products</li>
          <li>Set up your payment information</li>
        </ul>
      </div>
      <a href="${process.env.SELLER_DASHBOARD_URL || 'https://seller.storesgo.com'}" class="btn">Go to Dashboard</a>
    `),
    text: `Congratulations! Your store "${data.storeName}" has been approved on StoresGo. You can now start selling!`,
  }),

  paymentReceived: (data: { amount: string; orderId: number }) => ({
    subject: `Payment Received - Order #${data.orderId} - StoresGo`,
    html: wrapHtmlTemplate(`
      <h2>Payment Confirmed! ✅</h2>
      <p>We've received your payment for order #${data.orderId}.</p>
      <div class="highlight">
        <p><strong>Amount Paid:</strong> ${data.amount}</p>
        <p><strong>Order Number:</strong> #${data.orderId}</p>
      </div>
      <a href="${process.env.FRONTEND_URL || 'https://storesgo.com'}/orders/${data.orderId}" class="btn">View Order</a>
    `),
    text: `Payment of ${data.amount} received for order #${data.orderId}. Thank you!`,
  }),

  welcome: (data: { name: string; userType: 'buyer' | 'seller' }) => ({
    subject: `Welcome to StoresGo! 🛒`,
    html: wrapHtmlTemplate(`
      <h2>Welcome to StoresGo, ${data.name}! 👋</h2>
      <p>Thank you for joining our marketplace. We're excited to have you!</p>
      ${data.userType === 'buyer' 
        ? `<p>Start exploring thousands of products from local sellers.</p>
           <a href="${process.env.FRONTEND_URL || 'https://storesgo.com'}" class="btn">Start Shopping</a>`
        : `<p>Set up your store and start selling to customers around the world.</p>
           <a href="${process.env.SELLER_DASHBOARD_URL || 'https://seller.storesgo.com'}" class="btn">Set Up Your Store</a>`
      }
    `),
    text: `Welcome to StoresGo, ${data.name}! Thank you for joining our marketplace.`,
  }),

  newReview: (data: { storeName: string; productName: string; rating: number; reviewText?: string }) => ({
    subject: `New ${data.rating}⭐ Review for "${data.productName}" - StoresGo`,
    html: wrapHtmlTemplate(`
      <h2>You received a new review! ⭐</h2>
      <p>A customer left a review for one of your products.</p>
      <div class="highlight">
        <p><strong>Product:</strong> ${data.productName}</p>
        <p><strong>Rating:</strong> ${'⭐'.repeat(data.rating)}</p>
        ${data.reviewText ? `<p><strong>Review:</strong> "${data.reviewText}"</p>` : ''}
      </div>
      <a href="${process.env.SELLER_DASHBOARD_URL || 'https://seller.storesgo.com'}/reviews" class="btn">View All Reviews</a>
    `),
    text: `New ${data.rating}-star review for "${data.productName}": ${data.reviewText || 'No comment'}`,
  }),

  // Password Reset Templates (Phase 15)
  passwordReset: (data: { resetUrl: string; userType: string; expiryMinutes: number }) => ({
    subject: `Reset Your Password - StoresGo`,
    html: wrapHtmlTemplate(`
      <h2>Password Reset Request 🔐</h2>
      <p>We received a request to reset the password for your ${data.userType} account.</p>
      <p>Click the button below to reset your password. This link will expire in ${data.expiryMinutes} minutes.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetUrl}" class="btn" style="display: inline-block; background: #00875A; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500;">
          Reset Password
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        If you didn't request this password reset, you can safely ignore this email.
      </p>
      
      <p style="color: #666; font-size: 14px;">
        If the button doesn't work, copy this link:<br>
        <a href="${data.resetUrl}" style="color: #00875A; word-break: break-all;">${data.resetUrl}</a>
      </p>
    `),
    text: `Reset your StoresGo password: ${data.resetUrl}. This link expires in ${data.expiryMinutes} minutes.`,
  }),

  passwordChanged: (data: { userType: string; changedAt: string }) => ({
    subject: `Your Password Has Been Changed - StoresGo`,
    html: wrapHtmlTemplate(`
      <h2>Password Changed Successfully ✅</h2>
      <p>Your ${data.userType} account password has been successfully changed.</p>
      
      <div class="highlight">
        <p><strong>When:</strong> ${data.changedAt}</p>
        <p><strong>Account Type:</strong> ${data.userType}</p>
      </div>
      
      <p style="color: #d32f2f; font-weight: 500;">
        If you didn't make this change, please contact our support team immediately.
      </p>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.FRONTEND_URL || 'https://storesgo.com'}/support" class="btn" style="background: #d32f2f;">
          Contact Support
        </a>
      </div>
    `),
    text: `Your StoresGo password was changed on ${data.changedAt}. If you didn't make this change, contact support immediately.`,
  }),
};

// Pre-built SMS templates (keep short - SMS has character limits)
export const smsTemplates = {
  orderPlaced: (data: { orderId: number }) =>
    `StoresGo: Order #${data.orderId} confirmed! We'll notify you when it ships.`,

  orderShipped: (data: { orderId: number; trackingNumber?: string }) =>
    `StoresGo: Order #${data.orderId} shipped!${data.trackingNumber ? ` Track: ${data.trackingNumber}` : ''}`,

  newOrderForSeller: (data: { orderId: number; totalAmount: string }) =>
    `StoresGo: New order #${data.orderId} for ${data.totalAmount}. Check your dashboard!`,

  sellerApproved: (data: { storeName: string }) =>
    `StoresGo: Congratulations! Your store "${data.storeName}" is now approved. Start selling today!`,

  paymentReceived: (data: { amount: string; orderId: number }) =>
    `StoresGo: Payment of ${data.amount} received for order #${data.orderId}.`,

  verificationCode: (data: { code: string }) =>
    `StoresGo: Your verification code is ${data.code}. Valid for 10 minutes.`,

  passwordResetRequest: (data: { expiryMinutes: number }) =>
    `StoresGo: Password reset requested. Check your email for the reset link. Expires in ${data.expiryMinutes} min.`,

  passwordChanged: () =>
    `StoresGo: Your password has been changed. If you didn't do this, contact support immediately.`,
};

