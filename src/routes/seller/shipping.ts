import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticateSeller } from "../../middleware/authSeller.js";
import { prisma } from "../../lib/prisma.js";

interface SellerRequest extends FastifyRequest {
  seller?: { id: number; userId: string; storeName: string };
}

interface GetRatesBody {
  length?: number;
  width?: number;
  height?: number;
  weightOz?: number;
}

interface BuyLabelBody {
  rateId: string;
  shipmentId: string;
  rateCents: number;
  carrier: string;
  service: string;
}

const EASYPOST_API_KEY = process.env.EASYPOST_API_KEY || "";

export default async function sellerShippingRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticateSeller);

  // GET /api/seller/shipping/:orderId/rates - Preview shipping rates WITHOUT buying
  app.post("/:orderId/rates", async (request: SellerRequest, reply: FastifyReply) => {
    const sellerId = request.seller?.id;
    if (!sellerId) return reply.code(401).send({ ok: false, error: "Unauthorized" });

    if (!EASYPOST_API_KEY) {
      return reply.code(503).send({ ok: false, error: "Shipping service not configured" });
    }

    const { orderId } = request.params as { orderId: string };
    const body = request.body as GetRatesBody;

    try {
      const order = await prisma.order.findFirst({
        where: { id: parseInt(orderId), sellerId },
        include: {
          orderItems: { include: { product: { select: { name: true, shippingWeightGrams: true } } } },
          seller: { select: { storeName: true, street: true, city: true, state: true, zipCode: true } }
        }
      });

      if (!order) return reply.code(404).send({ ok: false, error: "Order not found" });

      // Validate addresses
      if (!order.seller?.street || !order.seller?.city || !order.seller?.zipCode) {
        return reply.code(400).send({ 
          ok: false, 
          error: "Seller address incomplete. Please update your store address in Settings.",
          needsAddress: true
        });
      }

      if (!order.shippingStreet || !order.shippingCity || !order.shippingState || !order.shippingZip) {
        return reply.code(400).send({ ok: false, error: "Order missing shipping address" });
      }

      // Calculate weight
      const totalGrams = order.orderItems.reduce((sum, item) => {
        return sum + (item.product?.shippingWeightGrams || 500) * item.quantity;
      }, 0);
      const calculatedWeightOz = Math.max(1, Math.round(totalGrams / 28.35));
      const weightOz = body.weightOz || calculatedWeightOz;

      // Package dimensions (defaults or user-provided)
      const length = body.length || 10;
      const width = body.width || 8;
      const height = body.height || 4;

      const EasyPost = (await import("@easypost/api")).default;
      const client = new EasyPost(EASYPOST_API_KEY);

      const shipment = await client.Shipment.create({
        from_address: {
          name: order.seller.storeName,
          street1: order.seller.street,
          city: order.seller.city,
          state: order.seller.state,
          zip: order.seller.zipCode,
          country: "US",
          phone: "5551234567"
        },
        to_address: {
          name: order.shippingName || "Customer",
          street1: order.shippingStreet,
          city: order.shippingCity,
          state: order.shippingState,
          zip: order.shippingZip,
          country: "US",
          phone: order.shippingPhone || ""
        },
        parcel: { length, width, height, weight: weightOz }
      });

      if (!shipment.rates || shipment.rates.length === 0) {
        return reply.code(400).send({ ok: false, error: "No shipping rates available for this route" });
      }

      // Format rates for frontend
      const rates = shipment.rates
        .map((r: any) => ({
          id: r.id,
          carrier: r.carrier,
          service: r.service,
          rate: parseFloat(r.rate),
          rateCents: Math.round(parseFloat(r.rate) * 100),
          deliveryDays: r.delivery_days,
          deliveryDate: r.delivery_date,
          guaranteed: r.delivery_date_guaranteed
        }))
        .sort((a: any, b: any) => a.rate - b.rate);

      return {
        ok: true,
        data: {
          shipmentId: shipment.id,
          rates,
          package: { length, width, height, weightOz },
          calculatedWeightOz,
          fromAddress: {
            name: order.seller.storeName,
            street: order.seller.street,
            city: order.seller.city,
            state: order.seller.state,
            zip: order.seller.zipCode
          },
          toAddress: {
            name: order.shippingName,
            street: order.shippingStreet,
            city: order.shippingCity,
            state: order.shippingState,
            zip: order.shippingZip
          }
        }
      };
    } catch (error: any) {
      console.error("EasyPost rates error:", error);
      return reply.code(500).send({ ok: false, error: error.message || "Failed to get shipping rates" });
    }
  });

  // POST /api/seller/shipping/:orderId/buy - Purchase a specific rate
  app.post("/:orderId/buy", async (request: SellerRequest, reply: FastifyReply) => {
    const sellerId = request.seller?.id;
    if (!sellerId) return reply.code(401).send({ ok: false, error: "Unauthorized" });

    if (!EASYPOST_API_KEY) {
      return reply.code(503).send({ ok: false, error: "Shipping service not configured" });
    }

    const { orderId } = request.params as { orderId: string };
    const { rateId, shipmentId, rateCents, carrier, service } = request.body as BuyLabelBody;

    if (!rateId || !shipmentId || !rateCents) {
      return reply.code(400).send({ ok: false, error: "Missing required fields: rateId, shipmentId, rateCents" });
    }

    try {
      // Verify order belongs to seller
      const order = await prisma.order.findFirst({
        where: { id: parseInt(orderId), sellerId }
      });

      if (!order) return reply.code(404).send({ ok: false, error: "Order not found" });

      // Check if label already purchased
      if (order.trackingNumber) {
        return reply.code(400).send({ ok: false, error: "Label already purchased for this order" });
      }

      const EasyPost = (await import("@easypost/api")).default;
      const client = new EasyPost(EASYPOST_API_KEY);

      // Buy the label
      const bought = await client.Shipment.buy(shipmentId, rateId);

      // Update order with tracking and shipping cost
      await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: {
          status: "processing",
          trackingNumber: bought.tracking_code,
          shippingCarrier: carrier,
          shippingService: service,
          shippingPriceCents: rateCents
        }
      });

      return {
        ok: true,
        data: {
          trackingNumber: bought.tracking_code,
          carrier,
          service,
          labelUrl: bought.postage_label?.label_url,
          ratePaid: rateCents / 100
        }
      };
    } catch (error: any) {
      console.error("EasyPost buy error:", error);
      return reply.code(500).send({ ok: false, error: error.message || "Failed to purchase label" });
    }
  });

  app.log.info("📦 Seller shipping routes registered");
}
