import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@storesgo.com";
const STORE_NAME = "StoresGo";
const STORE_URL = process.env.STORE_URL || "https://storesgo.com";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface OrderEmailData {
  orderId: number | string;
  customerEmail: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    priceCents: number;
    image?: string;
  }>;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  shippingMethod?: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

// Order Confirmation Email
export async function sendOrderConfirmation(data: OrderEmailData): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.log("[Email] SendGrid not configured, skipping email");
    return false;
  }

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong><br>
        <span style="color: #666;">Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        ${formatCurrency(item.priceCents * item.quantity)}
      </td>
    </tr>
  `).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Order Confirmed!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Thank you for shopping with ${STORE_NAME}</p>
        </div>
        
        <!-- Order Info -->
        <div style="padding: 30px;">
          <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <p style="margin: 0; color: #166534;">
              <strong>Order #${data.orderId}</strong><br>
              <span style="font-size: 14px; color: #666;">Placed on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </p>
          </div>
          
          <p style="color: #333;">Hi ${data.customerName},</p>
          <p style="color: #666; line-height: 1.6;">We've received your order and it's being prepared. You'll receive another email when it ships.</p>
          
          <!-- Items -->
          <h3 style="color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsHtml}
          </table>
          
          <!-- Totals -->
          <table style="width: 100%; margin-top: 20px;">
            <tr><td style="padding: 5px 0; color: #666;">Subtotal</td><td style="text-align: right;">${formatCurrency(data.subtotalCents)}</td></tr>
            <tr><td style="padding: 5px 0; color: #666;">Shipping</td><td style="text-align: right;">${formatCurrency(data.shippingCents)}</td></tr>
            <tr><td style="padding: 5px 0; color: #666;">Tax</td><td style="text-align: right;">${formatCurrency(data.taxCents)}</td></tr>
            <tr><td style="padding: 10px 0; font-weight: bold; font-size: 18px; border-top: 2px solid #eee;">Total</td><td style="text-align: right; font-weight: bold; font-size: 18px; color: #10b981; border-top: 2px solid #eee;">${formatCurrency(data.totalCents)}</td></tr>
          </table>
          
          <!-- Shipping Address -->
          <h3 style="color: #333; margin-top: 30px;">Shipping To</h3>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
            <p style="margin: 0; color: #333;">
              ${data.customerName}<br>
              ${data.shippingAddress.street}<br>
              ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}
            </p>
            ${data.estimatedDelivery ? `<p style="margin: 10px 0 0; color: #10b981;"><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ''}
          </div>
          
          <!-- CTA -->
          <div style="text-align: center; margin-top: 30px;">
            <a href="${STORE_URL}/account/orders" style="display: inline-block; background: #10b981; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Order Status</a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="margin: 0; color: #666; font-size: 14px;">Questions? Reply to this email or contact <a href="mailto:support@storesgo.com" style="color: #10b981;">support@storesgo.com</a></p>
          <p style="margin: 10px 0 0; color: #999; font-size: 12px;">© ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sgMail.send({
      to: data.customerEmail,
      from: { email: FROM_EMAIL, name: STORE_NAME },
      subject: `Order Confirmed! #${data.orderId}`,
      html
    });
    console.log(`[Email] Order confirmation sent to ${data.customerEmail}`);
    return true;
  } catch (error: any) {
    console.error("[Email] Failed to send:", error.message);
    return false;
  }
}

// Shipping Confirmation Email
export async function sendShippingConfirmation(data: OrderEmailData): Promise<boolean> {
  if (!SENDGRID_API_KEY) return false;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📦 Your Order Has Shipped!</h1>
        </div>
        <div style="padding: 30px;">
          <p style="color: #333;">Hi ${data.customerName},</p>
          <p style="color: #666;">Great news! Your order #${data.orderId} is on its way.</p>
          
          ${data.trackingNumber ? `
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #666;">Tracking Number</p>
              <p style="margin: 5px 0 0; font-size: 20px; font-weight: bold; color: #1d4ed8;">${data.trackingNumber}</p>
              ${data.trackingUrl ? `<a href="${data.trackingUrl}" style="display: inline-block; margin-top: 10px; color: #3b82f6;">Track Package →</a>` : ''}
            </div>
          ` : ''}
          
          <p style="color: #666;"><strong>Estimated Delivery:</strong> ${data.estimatedDelivery || '3-5 business days'}</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${STORE_URL}/account/orders" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">Track Your Order</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sgMail.send({
      to: data.customerEmail,
      from: { email: FROM_EMAIL, name: STORE_NAME },
      subject: `Your Order #${data.orderId} Has Shipped! 📦`,
      html
    });
    return true;
  } catch (error: any) {
    console.error("[Email] Shipping email failed:", error.message);
    return false;
  }
}

// Delivery Confirmation
export async function sendDeliveryConfirmation(data: OrderEmailData): Promise<boolean> {
  if (!SENDGRID_API_KEY) return false;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✅ Delivered!</h1>
        </div>
        <div style="padding: 30px; text-align: center;">
          <p style="color: #333; font-size: 18px;">Your order #${data.orderId} has been delivered!</p>
          <p style="color: #666;">We hope you love your purchase. If you have any questions, we're here to help.</p>
          <div style="margin-top: 30px;">
            <a href="${STORE_URL}/account/orders/${data.orderId}/review" style="display: inline-block; background: #10b981; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">Leave a Review</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sgMail.send({
      to: data.customerEmail,
      from: { email: FROM_EMAIL, name: STORE_NAME },
      subject: `Your Order #${data.orderId} Has Been Delivered! ✅`,
      html
    });
    return true;
  } catch (error: any) {
    console.error("[Email] Delivery email failed:", error.message);
    return false;
  }
}

// Welcome Email
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  if (!SENDGRID_API_KEY) return false;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to ${STORE_NAME}! 🎉</h1>
        </div>
        <div style="padding: 30px;">
          <p style="color: #333; font-size: 18px;">Hi ${name},</p>
          <p style="color: #666; line-height: 1.6;">Thanks for joining ${STORE_NAME}! We're excited to have you as part of our community.</p>
          <p style="color: #666; line-height: 1.6;">Discover amazing products from local sellers and enjoy fast, reliable delivery.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${STORE_URL}" style="display: inline-block; background: #10b981; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">Start Shopping</a>
          </div>
          <p style="color: #999; font-size: 14px; text-align: center;">Use code <strong>WELCOME10</strong> for 10% off your first order!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sgMail.send({
      to: email,
      from: { email: FROM_EMAIL, name: STORE_NAME },
      subject: `Welcome to ${STORE_NAME}! 🎉`,
      html
    });
    return true;
  } catch (error: any) {
    console.error("[Email] Welcome email failed:", error.message);
    return false;
  }
}
