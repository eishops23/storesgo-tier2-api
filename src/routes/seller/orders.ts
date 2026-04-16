// ==========================================================
// STORESGO SELLER ORDERS ROUTES - Enterprise Grade
// Millions of sellers, proper auth, optimized queries
// ==========================================================
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticateSeller } from "../../middleware/authSeller.js";
import { sendShippingNotification } from "../../services/orderNotification.service.js";
import { prisma } from "../../lib/prisma.js";

interface SellerRequest extends FastifyRequest {
  seller?: { id: number; userId: string; storeName: string };
}

interface ListOrdersQuery {
  status?: string;
  page?: string;
  limit?: string;
  startDate?: string;
  endDate?: string;
}

interface UpdateStatusBody {
  status: string;
}

interface ShipOrderBody {
  trackingNumber: string;
  carrier: string;
}

const EASYPOST_API_KEY = process.env.EASYPOST_API_KEY || "";

async function sellerOrderRoutes(app: FastifyInstance) {
  // All routes require seller authentication
  app.addHook("preHandler", authenticateSeller);

  // GET /api/seller/orders - List seller's orders (paginated, filtered)
  app.get("/", async (request: SellerRequest, reply: FastifyReply) => {
    const sellerId = request.seller?.id;
    if (!sellerId) return reply.code(401).send({ ok: false, error: "Unauthorized" });

    const { status, page = "1", limit = "20", startDate, endDate } = request.query as ListOrdersQuery;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(500, Math.max(1, parseInt(limit))); // Cap at 100

    try {
      const where: any = { sellerId };
      if (status && status !== "all") where.status = status;
      if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
      if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limitNum,
          skip: (pageNum - 1) * limitNum,
          select: {
            id: true,
            status: true,
            totalAmountCents: true,
            currency: true,
            createdAt: true,
            shippingName: true,
            shippingCity: true,
            shippingState: true,
            trackingNumber: true,
            shippingCarrier: true,
            orderItems: {
              select: {
                id: true,
                quantity: true,
                priceCents: true,
                product: { select: { id: true, name: true, imageUrl: true, sku: true } }
              }
            }
          }
        }),
        prisma.order.count({ where })
      ]);

      return {
        ok: true,
        data: {
          orders,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum)
          }
        }
      };
    } catch (error: any) {
      console.error("Seller orders list error:", error);
      return reply.code(500).send({ ok: false, error: "Failed to fetch orders" });
    }
  });

  // GET /api/seller/orders/stats - Order statistics dashboard
  app.get("/stats", async (request: SellerRequest, reply: FastifyReply) => {
    const sellerId = request.seller?.id;
    if (!sellerId) return reply.code(401).send({ ok: false, error: "Unauthorized" });

    try {
      const [statusCounts, revenue, recentOrders] = await Promise.all([
        prisma.order.groupBy({
          by: ["status"],
          where: { sellerId },
          _count: { id: true }
        }),
        prisma.order.aggregate({
          where: { sellerId, status: { notIn: ["cancelled"] } },
          _sum: { totalAmountCents: true }
        }),
        prisma.order.findMany({
          where: { sellerId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, status: true, totalAmountCents: true, createdAt: true }
        })
      ]);

      const stats: Record<string, number> = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
      statusCounts.forEach(s => { stats[s.status] = s._count.id; });

      return {
        ok: true,
        data: {
          ...stats,
          total: Object.values(stats).reduce((a, b) => a + b, 0),
          revenue: revenue._sum.totalAmountCents || 0,
          recentOrders
        }
      };
    } catch (error: any) {
      console.error("Seller orders stats error:", error);
      return reply.code(500).send({ ok: false, error: "Failed to fetch stats" });
    }
  });

  // GET /api/seller/orders/:id - Single order details (FULL INVOICE DATA)
  app.get("/:id", async (request: SellerRequest, reply: FastifyReply) => {
    const sellerId = request.seller?.id;
    if (!sellerId) return reply.code(401).send({ ok: false, error: "Unauthorized" });
    const { id } = request.params as { id: string };
    try {
      const order = await prisma.order.findFirst({
        where: { id: parseInt(id), sellerId },
        include: {
          orderItems: {
            include: {
              product: {
                select: { id: true, name: true, imageUrl: true, sku: true, shippingWeightGrams: true }
              }
            }
          },
          buyer: { select: { id: true, email: true } },
          seller: { select: { id: true, storeName: true, street: true, city: true, state: true, zipCode: true, country: true } }
        }
      });
      if (!order) return reply.code(404).send({ ok: false, error: "Order not found" });
      return { ok: true, data: order };
    } catch (error: any) {
      console.error("Seller order detail error:", error);
      return reply.code(500).send({ ok: false, error: "Failed to fetch order" });
    }
  });

  // PATCH /api/seller/orders/:id/status - Update order status
  app.patch("/:id/status", async (request: SellerRequest, reply: FastifyReply) => {
    const sellerId = request.seller?.id;
    if (!sellerId) return reply.code(401).send({ ok: false, error: "Unauthorized" });

    const { id } = request.params as { id: string };
    const { status } = request.body as UpdateStatusBody;

    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return reply.code(400).send({ ok: false, error: "Invalid status: " + validStatuses.join(", ") });
    }

    try {
      const order = await prisma.order.findFirst({ where: { id: parseInt(id), sellerId }, include: { buyer: { select: { email: true } }, seller: { select: { storeName: true } } } });
      if (!order) return reply.code(404).send({ ok: false, error: "Order not found" });

      const updated = await prisma.order.update({
        where: { id: parseInt(id) },
        data: { status }
      });

      return { ok: true, data: updated };
    } catch (error: any) {
      console.error("Seller order status update error:", error);
      return reply.code(500).send({ ok: false, error: "Failed to update status" });
    }
  });

  // POST /api/seller/orders/:id/ship - Mark shipped with tracking
  app.post("/:id/ship", async (request: SellerRequest, reply: FastifyReply) => {
    const sellerId = request.seller?.id;
    if (!sellerId) return reply.code(401).send({ ok: false, error: "Unauthorized" });

    const { id } = request.params as { id: string };
    const { trackingNumber, carrier } = request.body as ShipOrderBody;

    if (!trackingNumber || !carrier) {
      return reply.code(400).send({ ok: false, error: "trackingNumber and carrier required" });
    }

    try {
      const order = await prisma.order.findFirst({ where: { id: parseInt(id), sellerId }, include: { buyer: { select: { email: true } }, seller: { select: { storeName: true } } } });
      if (!order) return reply.code(404).send({ ok: false, error: "Order not found" });

      const updated = await prisma.order.update({
        where: { id: parseInt(id) },
        data: { status: "shipped", trackingNumber, shippingCarrier: carrier }
      });

      await sendShippingNotification({ ...order, ...updated }, trackingNumber, carrier);
      return { ok: true, data: updated };
    } catch (error: any) {
      console.error("Seller order ship error:", error);
      return reply.code(500).send({ ok: false, error: "Failed to ship order" });
    }
  });

  // POST /api/seller/orders/:id/label - Generate shipping label via EasyPost
  app.post("/:id/label", async (request: SellerRequest, reply: FastifyReply) => {
    const sellerId = request.seller?.id;
    if (!sellerId) return reply.code(401).send({ ok: false, error: "Unauthorized" });

    if (!EASYPOST_API_KEY) {
      return reply.code(503).send({ ok: false, error: "Shipping label service not configured" });
    }

    const { id } = request.params as { id: string };

    try {
      const order = await prisma.order.findFirst({
        where: { id: parseInt(id), sellerId },
        include: {
          orderItems: { include: { product: { select: { shippingWeightGrams: true } } } },
          seller: { select: { storeName: true, city: true, state: true, zipCode: true } }
        }
      });

      if (!order) return reply.code(404).send({ ok: false, error: "Order not found" });
      if (!order.shippingStreet || !order.shippingCity || !order.shippingState || !order.shippingZip) {
        return reply.code(400).send({ ok: false, error: "Order missing shipping address" });
      }

      // Calculate weight in ounces
      const totalGrams = order.orderItems.reduce((sum, item) => {
        return sum + (item.product?.shippingWeightGrams || 500) * item.quantity;
      }, 0);
      const weightOz = Math.max(1, Math.round(totalGrams / 28.35));

      const EasyPost = (await import("@easypost/api")).default;
      const client = new EasyPost(EASYPOST_API_KEY);

      const shipment = await client.Shipment.create({
        from_address: {
          name: order.seller?.storeName || "StoresGo Seller",
          street1: order.seller?.city || "123 Seller St",
          city: order.seller?.city || "Miami",
          state: order.seller?.state || "FL",
          zip: order.seller?.zipCode || "33101",
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
        parcel: { length: 10, width: 8, height: 4, weight: weightOz }
      });

      const rates = shipment.rates.sort((a: any, b: any) => parseFloat(a.rate) - parseFloat(b.rate));
      if (!rates.length) {
        return reply.code(400).send({ ok: false, error: "No shipping rates available for this address" });
      }

      const bought = await client.Shipment.buy(shipment.id, rates[0].id);

      await prisma.order.update({
        where: { id: parseInt(id) },
        data: {
          status: "processing",
          trackingNumber: bought.tracking_code,
          shippingCarrier: rates[0].carrier
        }
      });

      return {
        ok: true,
        data: {
          trackingNumber: bought.tracking_code,
          carrier: rates[0].carrier,
          service: rates[0].service,
          labelUrl: bought.postage_label?.label_url,
          rate: rates[0].rate,
          estimatedDays: rates[0].delivery_days
        }
      };
    } catch (error: any) {
      console.error("EasyPost label error:", error);
      return reply.code(500).send({ ok: false, error: error.message || "Failed to create shipping label" });
    }
  });

  // PUT /:id/items/:itemId/substitution — Update item substitution status
  app.put("/:id/items/:itemId/substitution", async (request: SellerRequest, reply: FastifyReply) => {
    const sellerId = request.seller?.id;
    if (!sellerId) return reply.code(401).send({ ok: false, error: "Unauthorized" });
    const { id, itemId } = request.params as { id: string; itemId: string };
    const { status, note } = request.body as { status: string; note?: string };

    const validStatuses = ["fulfilled", "substituted", "refunded"];
    if (!validStatuses.includes(status)) {
      return reply.code(400).send({ ok: false, error: "Invalid status. Use: " + validStatuses.join(", ") });
    }

    try {
      const order = await prisma.order.findFirst({ where: { id: parseInt(id), sellerId } });
      if (!order) return reply.code(404).send({ ok: false, error: "Order not found" });

      const item = await prisma.orderItem.findFirst({ where: { id: parseInt(itemId), orderId: parseInt(id) } });
      if (!item) return reply.code(404).send({ ok: false, error: "Order item not found" });

      if (status === "substituted" && item.substitutionPreference === "refund") {
        return reply.code(400).send({ ok: false, error: "Customer requested refund only" });
      }

      const updated = await prisma.orderItem.update({
        where: { id: parseInt(itemId) },
        data: {
          substitutionStatus: status,
          substitutionNote: status === "substituted" ? (note || null) : null,
        },
      });

      return { ok: true, data: { id: updated.id, substitutionStatus: updated.substitutionStatus, substitutionNote: updated.substitutionNote } };
    } catch (error: any) {
      console.error("Substitution update error:", error);
      return reply.code(500).send({ ok: false, error: "Failed to update substitution" });
    }
  });

}

export default sellerOrderRoutes;
