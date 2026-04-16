// Klaviyo Service - Full Integration for StoresGo
const KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY;
const KLAVIYO_API_URL = "https://a.klaviyo.com/api";

function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return cleanPhone.startsWith('1') ? '+' + cleanPhone : '+1' + cleanPhone;
}

export async function trackPlacedOrder(orderData: {
  orderId: string | number;
  email: string;
  phone?: string;
  name?: string;
  items: Array<{ productId: number; name: string; quantity: number; priceCents: number; imageUrl?: string; }>;
  subtotal: number;
  shippingFee: number;
  tax: number;
  discount?: number;
  total: number;
  shippingAddress?: { street?: string; city?: string; state?: string; zip?: string; };
}) {
  if (!KLAVIYO_API_KEY || !orderData.email) {
    console.log("[Klaviyo] Skipping order track - no API key or email");
    return null;
  }
  try {
    const eventPayload = {
      data: {
        type: "event",
        attributes: {
          profile: { data: { type: "profile", attributes: { email: orderData.email, phone_number: orderData.phone ? formatPhone(orderData.phone) : undefined, first_name: orderData.name?.split(' ')[0], last_name: orderData.name?.split(' ').slice(1).join(' ') || undefined } } },
          metric: { data: { type: "metric", attributes: { name: "Placed Order" } } },
          properties: {
            OrderId: String(orderData.orderId),
            Categories: ["Grocery"],
            ItemNames: orderData.items.map(i => i.name),
            Items: orderData.items.map(item => ({ ProductID: String(item.productId), SKU: String(item.productId), ProductName: item.name, Quantity: item.quantity, ItemPrice: item.priceCents / 100, RowTotal: (item.priceCents * item.quantity) / 100, ProductURL: "https://storesgo.com/product/" + item.productId, ImageURL: item.imageUrl || "" })),
            ShippingAddress: { City: orderData.shippingAddress?.city || "", Region: orderData.shippingAddress?.state || "", Zip: orderData.shippingAddress?.zip || "", Country: "US" }
          },
          value: orderData.total / 100,
          unique_id: "order-" + orderData.orderId,
          time: new Date().toISOString()
        }
      }
    };
    const response = await fetch(KLAVIYO_API_URL + "/events/", {
      method: "POST",
      headers: { "Authorization": "Klaviyo-API-Key " + KLAVIYO_API_KEY, "Content-Type": "application/json", "revision": "2024-02-15" },
      body: JSON.stringify(eventPayload)
    });
    if (response.ok) {
      console.log("[Klaviyo] Placed Order tracked for " + orderData.email + ", Order #" + orderData.orderId);
      return true;
    } else {
      console.error("[Klaviyo] Placed Order failed: " + response.status);
      return false;
    }
  } catch (error) {
    console.error("[Klaviyo] Placed Order error:", error);
    return false;
  }
}

export async function subscribeToSMS(email: string, phone: string, consent: boolean = true) {
  if (!KLAVIYO_API_KEY || !phone || !consent) {
    console.log("[Klaviyo] Skipping SMS subscription - missing key, phone, or consent");
    return null;
  }
  const formattedPhone = formatPhone(phone);
  try {
    const response = await fetch(KLAVIYO_API_URL + "/profile-subscription-bulk-create-jobs/", {
      method: "POST",
      headers: { "Authorization": "Klaviyo-API-Key " + KLAVIYO_API_KEY, "Content-Type": "application/json", "revision": "2024-02-15" },
      body: JSON.stringify({
        data: {
          type: "profile-subscription-bulk-create-job",
          attributes: {
            profiles: {
              data: [{
                type: "profile",
                attributes: { email: email, phone_number: formattedPhone, subscriptions: { sms: { marketing: { consent: "SUBSCRIBED" }, transactional: { consent: "SUBSCRIBED" } }, email: { marketing: { consent: "SUBSCRIBED" } } } }
              }]
            }
          }
        }
      })
    });
    if (response.ok) {
      console.log("[Klaviyo] SMS subscription successful for " + email);
      return true;
    } else {
      console.error("[Klaviyo] SMS subscription failed: " + response.status);
      return false;
    }
  } catch (error) {
    console.error("[Klaviyo] SMS subscription error:", error);
    return false;
  }
}
