import { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma.js";
import jwt from "jsonwebtoken";

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN || "";
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID || "";
const SQUARE_ENV = process.env.SQUARE_ENV || "sandbox";
const SQUARE_API_URL = SQUARE_ENV === "production"
  ? "https://connect.squareup.com"
  : "https://connect.squareupsandbox.com";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const squareHeaders = {
  "Square-Version": "2024-01-18",
  "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
  "Content-Type": "application/json",
};

async function getOrCreateSquareCustomer(userId: string, email: string, firstName?: string, lastName?: string): Promise<string | null> {
  const profile = await prisma.buyerProfile.findUnique({
    where: { userId },
  });

  if (profile?.squareCustomerId) {
    return profile.squareCustomerId;
  }

  try {
    const response = await fetch(`${SQUARE_API_URL}/v2/customers`, {
      method: "POST",
      headers: squareHeaders,
      body: JSON.stringify({
        idempotency_key: `customer_${userId}_${Date.now()}`,
        email_address: email,
        given_name: firstName || undefined,
        family_name: lastName || undefined,
        reference_id: userId,
      }),
    });

    const data = await response.json();

    if (data.customer?.id) {
      await prisma.buyerProfile.upsert({
        where: { userId },
        update: { squareCustomerId: data.customer.id },
        create: {
          userId,
          firstName,
          lastName,
          squareCustomerId: data.customer.id,
        },
      });
      return data.customer.id;
    }

    console.error("Failed to create Square customer:", data.errors);
    return null;
  } catch (error) {
    console.error("Square customer creation error:", error);
    return null;
  }
}

function getUserFromAuth(request: any): { id: string; email: string } | null {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { id: decoded.id, email: decoded.email };
  } catch {
    return null;
  }
}

const squareRoutes: FastifyPluginAsync = async (app) => {
  app.get("/config", async () => {
    return {
      ok: true,
      appId: process.env.SQUARE_APP_ID || "",
      locationId: SQUARE_LOCATION_ID,
      environment: SQUARE_ENV
    };
  });

  app.post("/create-payment", async (request) => {
    const { sourceId, cardId, customerId, verificationToken, amount, orderId, email, billingAddress, saveCard } = request.body as any;

    if (!sourceId && !cardId) return { success: false, error: "Payment source required" };
    if (cardId && !customerId) return { success: false, error: "Customer ID required for saved card" };
    if (!amount || amount <= 0) return { success: false, error: "Valid amount required" };

    if (!SQUARE_ACCESS_TOKEN) {
      return {
        success: true,
        testMode: true,
        transactionId: "test_" + Date.now(),
        orderId,
        amount,
        paymentStatus: "AUTHORIZED"
      };
    }

    try {
      let paymentSourceId = cardId || sourceId;
      let paymentCustomerId = cardId ? customerId : undefined;
      let cardSaved = false;
      let savedCardInfo = null;

      if (saveCard && sourceId && !cardId) {
        const user = getUserFromAuth(request);
        if (user) {
          console.log("[Square] Save card requested for user " + user.id + " - saving BEFORE payment");

          const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { buyerProfile: true },
          });

          if (fullUser) {
            const sqCustomerId = await getOrCreateSquareCustomer(
              user.id,
              fullUser.email,
              fullUser.buyerProfile?.firstName || undefined,
              fullUser.buyerProfile?.lastName || undefined
            );

            if (sqCustomerId) {
              console.log("[Square] Creating card on file for customer " + sqCustomerId);

              try {
                const cardResponse = await fetch(SQUARE_API_URL + "/v2/cards", {
                  method: "POST",
                  headers: squareHeaders,
                  body: JSON.stringify({
                    idempotency_key: "card_" + user.id + "_" + Date.now(),
                    source_id: sourceId,
                    verification_token: verificationToken || undefined,
                    card: {
                      customer_id: sqCustomerId,
                    }
                  }),
                });
                const cardData = await cardResponse.json();

                if (cardData.card) {
                  console.log("[Square] Card saved successfully: " + cardData.card.id);
                  cardSaved = true;
                  savedCardInfo = {
                    id: cardData.card.id,
                    brand: cardData.card.card_brand,
                    last4: cardData.card.last_4,
                    expMonth: cardData.card.exp_month,
                    expYear: cardData.card.exp_year,
                  };
                  paymentSourceId = cardData.card.id;
                  paymentCustomerId = sqCustomerId;
                } else {
                  console.error("[Square] Failed to save card:", JSON.stringify(cardData.errors));
                }
              } catch (cardErr: any) {
                console.error("[Square] Card save error:", cardErr.message);
              }
            } else {
              console.error("[Square] Could not get/create Square customer");
            }
          }
        } else {
          console.log("[Square] Save card requested but user not authenticated");
        }
      }

      const response = await fetch(SQUARE_API_URL + "/v2/payments", {
        method: "POST",
        headers: squareHeaders,
        body: JSON.stringify({
          source_id: paymentSourceId,
          customer_id: paymentCustomerId,
          idempotency_key: orderId + "_" + Date.now(),
          amount_money: { amount: Math.round(amount * 100), currency: "USD" },
          location_id: SQUARE_LOCATION_ID,
          reference_id: String(orderId),
          autocomplete: false,
          billing_address: billingAddress ? {
            address_line_1: billingAddress.street || "",
            locality: billingAddress.city || "",
            administrative_district_level_1: billingAddress.state || "",
            postal_code: billingAddress.zip || "",
            country: "US"
          } : undefined,
          buyer_email_address: email || undefined
        })
      });

      const data = await response.json();

      if (data.payment && (data.payment.status === "APPROVED" || data.payment.status === "COMPLETED")) {
        const cardDetails = data.payment.card_details?.card;

        if (orderId) {
          try {
            await prisma.order.update({
              where: { id: Number(orderId) },
              data: { 
                squarePaymentId: data.payment.id,
                paymentStatus: "AUTHORIZED"
              }
            });
          } catch (e) {
            console.log("[Square] Could not update order:", e);
          }
        }

        return {
          success: true,
          transactionId: data.payment.id,
          orderId,
          amount: data.payment.amount_money.amount / 100,
          status: data.payment.status,
          paymentStatus: "AUTHORIZED",
          cardSaved,
          card: savedCardInfo || (cardDetails ? {
            brand: cardDetails.card_brand,
            last4: cardDetails.last_4,
            expMonth: cardDetails.exp_month,
            expYear: cardDetails.exp_year
          } : null)
        };
      } else if (data.errors) {
        console.error("[Square] Payment error:", JSON.stringify(data.errors));
        return { success: false, error: data.errors[0]?.detail || "Payment failed" };
      }
      return { success: false, error: "Payment failed" };
    } catch (error: any) {
      console.error("[Square] Payment exception:", error);
      return { success: false, error: error.message };
    }
  });

  app.post("/capture-payment", async (request) => {
    const { paymentId, orderId } = request.body as any;
    let pid = paymentId;
    
    if (!pid && orderId) {
      const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });
      pid = order?.squarePaymentId;
    }
    
    if (!pid) return { success: false, error: "Payment ID required" };
    
    if (!SQUARE_ACCESS_TOKEN) {
      return { success: true, testMode: true, status: "COMPLETED" };
    }

    try {
      const response = await fetch(`${SQUARE_API_URL}/v2/payments/${pid}/complete`, {
        method: "POST",
        headers: squareHeaders,
      });
      const data = await response.json();
      
      if (data.payment?.status === "COMPLETED") {
        if (orderId) {
          try {
            await prisma.order.update({ 
              where: { id: Number(orderId) }, 
              data: { paymentStatus: "CAPTURED" } 
            });
          } catch (e) {
            console.log("[Square] Could not update order:", e);
          }
        }
        return { 
          success: true, 
          transactionId: data.payment.id,
          status: "COMPLETED", 
          amount: data.payment.amount_money.amount / 100,
          message: "Payment captured. Customer has been charged." 
        };
      }
      return { success: false, error: data.errors?.[0]?.detail || "Capture failed" };
    } catch (e: any) {
      console.error("[Square] Capture error:", e);
      return { success: false, error: e.message };
    }
  });

  app.post("/void-payment", async (request) => {
    const { paymentId, orderId } = request.body as any;
    let pid = paymentId;
    
    if (!pid && orderId) {
      const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });
      pid = order?.squarePaymentId;
    }
    
    if (!pid) return { success: false, error: "Payment ID required" };
    
    if (!SQUARE_ACCESS_TOKEN) {
      return { success: true, testMode: true, status: "CANCELED" };
    }

    try {
      const response = await fetch(`${SQUARE_API_URL}/v2/payments/${pid}/cancel`, {
        method: "POST",
        headers: squareHeaders,
      });
      const data = await response.json();
      
      if (data.payment?.status === "CANCELED") {
        if (orderId) {
          try {
            await prisma.order.update({ 
              where: { id: Number(orderId) }, 
              data: { paymentStatus: "VOIDED", status: "cancelled" } 
            });
          } catch (e) {
            console.log("[Square] Could not update order:", e);
          }
        }
        return { 
          success: true, 
          transactionId: data.payment.id,
          status: "CANCELED", 
          message: "Payment voided. Customer not charged." 
        };
      }
      return { success: false, error: data.errors?.[0]?.detail || "Void failed" };
    } catch (e: any) {
      console.error("[Square] Void error:", e);
      return { success: false, error: e.message };
    }
  });

  app.get("/status", async () => {
    return {
      ok: true,
      configured: !!SQUARE_ACCESS_TOKEN,
      environment: SQUARE_ENV
    };
  });
};

export default squareRoutes;
