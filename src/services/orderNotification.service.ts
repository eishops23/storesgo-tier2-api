// Order Notification Service - Email & SMS
import { prisma } from "../plugins/prisma.js";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "orders@storesgo.com";

// Send email via SendGrid
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  console.log(`[EMAIL] Sending to: ${to}, From: ${FROM_EMAIL}`);
  if (!SENDGRID_API_KEY) {
    console.log(`[EMAIL MOCK] To: ${to}, Subject: ${subject}`);
    return true;
  }

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: FROM_EMAIL, name: "StoresGo" },
        subject,
        content: [{ type: "text/html", value: html }]
      })
    });
    if (!res.ok) { const errText = await res.text(); console.error(`[EMAIL] SendGrid error ${res.status}: ${errText}`); return false; } console.log(`[EMAIL] ✅ Sent to ${to}`); return true;
  } catch (err) {
    console.error("Email error:", err);
    return false;
  }
}

// Send SMS via Twilio
async function sendSMS(to: string, message: string): Promise<boolean> {
  if (!TWILIO_SID || !TWILIO_AUTH) {
    console.log(`[SMS MOCK] To: ${to}, Message: ${message}`);
    return true;
  }

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        To: to,
        From: TWILIO_PHONE,
        Body: message
      })
    });
    if (!res.ok) { const errText = await res.text(); console.error(`[EMAIL] SendGrid error ${res.status}: ${errText}`); return false; } console.log(`[EMAIL] ✅ Sent to ${to}`); return true;
  } catch (err) {
    console.error("SMS error:", err);
    return false;
  }
}

// Format price
const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

// Send order confirmation to buyer
export async function sendBuyerConfirmation(order: any): Promise<void> {
  const itemsList = order.items?.map((i: any) => 
    `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee;">×${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatPrice(i.priceCents * i.quantity)}</td></tr>`
  ).join("") || "";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#10b981;color:white;padding:20px;text-align:center;">
        <h1 style="margin:0;">Order Confirmed! ✓</h1>
      </div>
      <div style="padding:20px;">
        <p>Hi ${order.buyerName || "Customer"},</p>
        <p>Thanks for your order! We're getting it ready.</p>
        
        <div style="background:#f3f4f6;padding:15px;border-radius:8px;margin:20px 0;">
          <strong>Order #${order.id}</strong><br>
          <span style="color:#6b7280;">Placed ${new Date().toLocaleDateString()}</span>
        </div>

        <h3>Items</h3>
        <table style="width:100%;border-collapse:collapse;">
          ${itemsList}
        </table>

        <div style="margin-top:20px;padding-top:20px;border-top:2px solid #10b981;">
          <table style="width:100%;">
            <tr><td>Subtotal</td><td style="text-align:right;">${formatPrice(order.subtotal)}</td></tr>
            <tr><td>Shipping</td><td style="text-align:right;">${formatPrice(order.shippingFee)}</td></tr>
            <tr><td>Tax</td><td style="text-align:right;">${formatPrice(order.tax)}</td></tr>
            <tr style="font-weight:bold;font-size:18px;"><td>Total</td><td style="text-align:right;">${formatPrice(order.total)}</td></tr>
          </table>
        </div>

        <div style="background:#ecfdf5;padding:15px;border-radius:8px;margin:20px 0;">
          <strong>📦 Estimated Delivery</strong><br>
          3-5 business days
        </div>

        <p style="color:#6b7280;font-size:14px;">
          You'll receive tracking info once your order ships.
        </p>

        <a href="https://storesgo.com/account/orders" style="display:inline-block;background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;margin-top:20px;">
          Track Your Order
        </a>
      </div>
      <div style="background:#f3f4f6;padding:15px;text-align:center;font-size:12px;color:#6b7280;">
        StoresGo • Miami, FL • support@storesgo.com
      </div>
    </div>
  `;

  if (order.buyerEmail) {
    await sendEmail(order.buyerEmail, `Order Confirmed #${order.id}`, html);
  }

  if (order.buyerPhone) {
    await sendSMS(order.buyerPhone, 
      `StoresGo: Order #${order.id} confirmed! Total: ${formatPrice(order.total)}. Track at storesgo.com/orders`
    );
  }

  // Create in-app notification for buyer
  if (order.buyerId) {
    try {
      await prisma.notification.create({
        data: {
          userId: order.buyerId,
          type: "ORDER_PLACED",
          title: "Order Confirmed",
          message: `Your order #${order.id} has been placed! Total: ${formatPrice(order.total)}`,
          channel: "IN_APP",
          metadata: { orderId: order.id }
        }
      });
    } catch (e) { console.error("Buyer notification error:", e); }
  }
}

// Send notification to seller(s)
export async function sendSellerNotification(order: any, sellerId: number): Promise<void> {
  try {
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: { user: true }
    });

    if (!seller?.user?.email) return;

    const sellerItems = order.items?.filter((i: any) => i.sellerId === sellerId) || [];
    const itemsList = sellerItems.map((i: any) => 
      `• ${i.name} × ${i.quantity}`
    ).join("\n");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#3b82f6;color:white;padding:20px;text-align:center;">
          <h1 style="margin:0;">New Order! 🎉</h1>
        </div>
        <div style="padding:20px;">
          <p>Hi ${seller.storeName},</p>
          <p>You have a new order to fulfill!</p>
          
          <div style="background:#f3f4f6;padding:15px;border-radius:8px;margin:20px 0;">
            <strong>Order #${order.id}</strong>
          </div>

          <h3>Your Items</h3>
          <pre style="background:#f3f4f6;padding:15px;border-radius:8px;">${itemsList}</pre>

          <div style="background:#fef3c7;padding:15px;border-radius:8px;margin:20px 0;">
            <strong>⚡ Ship within 24 hours</strong><br>
            Ship to: ${order.shippingAddress?.city}, ${order.shippingAddress?.state}
          </div>

          <a href="https://storesgo.com/seller/orders" style="display:inline-block;background:#3b82f6;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">
            View Order Details
          </a>
        </div>
      </div>
    `;

    await sendEmail(seller.user.email, `New Order #${order.id}`, html);

    // Also create in-app notification
    await prisma.notification.create({
      data: {
        sellerId,
        type: "ORDER_PLACED",
        title: "New Order Received",
        message: `Order #${order.id} - ${sellerItems.length} item(s)`,
        channel: "IN_APP",
          metadata: { orderId: order.id }
      }
    });
  } catch (err) {
    console.error("Seller notification error:", err);
  }
}

// Send notifications for an order to all parties
export async function sendOrderNotifications(order: any): Promise<void> {
  // Notify buyer
  await sendBuyerConfirmation(order);

  // Notify each seller
  const sellerIds = [...new Set(order.items?.map((i: any) => i.sellerId).filter(Boolean))] as number[];
  for (const sellerId of sellerIds) {
    await sendSellerNotification(order, sellerId);
  }
}

// Send shipping notification to buyer
export async function sendShippingNotification(order: any, trackingNumber: string, carrier: string): Promise<void> {
  try {
    const buyerEmail = order.buyer?.email || order.buyerEmail;
    const buyerPhone = order.shippingPhone || order.buyerPhone;
    const storeName = order.seller?.storeName || "Your seller";

    const trackingUrl = carrier.toLowerCase().includes("usps") ? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}` :
      carrier.toLowerCase().includes("ups") ? `https://www.ups.com/track?tracknum=${trackingNumber}` :
      carrier.toLowerCase().includes("fedex") ? `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}` :
      `https://www.google.com/search?q=${carrier}+tracking+${trackingNumber}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#3b82f6;color:white;padding:20px;text-align:center;">
          <h1 style="margin:0;">Your Order Has Shipped! 📦</h1>
        </div>
        <div style="padding:20px;">
          <p>Great news! Your order #${order.id} is on its way.</p>
          <div style="background:#f3f4f6;padding:15px;border-radius:8px;margin:20px 0;">
            <strong>Tracking Number:</strong> ${trackingNumber}<br>
            <strong>Carrier:</strong> ${carrier}<br>
            <strong>Shipped by:</strong> ${storeName}
          </div>
          <a href="${trackingUrl}" style="display:inline-block;background:#3b82f6;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">
            Track Your Package
          </a>
          <p style="margin-top:20px;color:#6b7280;">Shipping to: ${order.shippingName}<br>${order.shippingStreet}<br>${order.shippingCity}, ${order.shippingState} ${order.shippingZip}</p>
        </div>
      </div>
    `;

    if (buyerEmail) await sendEmail(buyerEmail, `Your Order #${order.id} Has Shipped!`, html);
    if (buyerPhone) await sendSMS(buyerPhone, `StoresGo: Order #${order.id} shipped! Track: ${trackingNumber} via ${carrier}`);
  } catch (err) {
    console.error("Shipping notification error:", err);
  }
}

export default {
  sendShippingNotification,
  sendBuyerConfirmation,
  sendSellerNotification,
  sendOrderNotifications
};
