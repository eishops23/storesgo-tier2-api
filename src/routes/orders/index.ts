import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../plugins/prisma.js";
import * as notifications from "../../services/orderNotification.service.js";
import * as klaviyo from "../../services/klaviyo.service.js";

const orderRoutes: FastifyPluginAsync = async (app) => {

  // Create order
  app.post("/", async (request) => {
    const { items, shippingAddress, shippingOption, tip, promoCode,
            subtotal, shippingFee, serviceFee, tax, discount, total,
            buyerEmail, buyerPhone, buyerName, smsConsent, paymentId } = request.body as any;

    try {
      // Validate items exist
      if (!items || !Array.isArray(items) || items.length === 0) {
        return { ok: false, error: "No items in order" };
      }

      // Validate all products exist
      for (const item of items) {
        const product = await prisma.product.findUnique({
          where: { id: parseInt(item.productId) },
          select: { id: true, name: true, isActive: true }
        });
        if (!product) {
          return { ok: false, error: `Product ID ${item.productId} not found` };
        }
        if (!product.isActive) {
          return { ok: false, error: `${product.name} is no longer available` };
        }
      }

      // SECURITY: Extract buyerId from JWT token, never trust client-sent buyerId
      let finalBuyerId: string | null = null;
      const authHeader = request.headers["authorization"];
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const jwtLib = await import("jsonwebtoken");
          const token = authHeader.substring(7);
          const decoded = jwtLib.default.verify(token, process.env.JWT_SECRET || "storesgo-secret") as any;
          finalBuyerId = decoded.id;
        } catch (err) {
          console.warn("Order creation: Invalid JWT token, proceeding as guest");
        }
      }

      if (!finalBuyerId) {
        const guestEmail = buyerEmail || `guest-${Date.now()}@storesgo.com`;
        let user = await prisma.user.findUnique({ where: { email: guestEmail } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: guestEmail,
              password: "guest-no-login",
              role: "BUYER"
            }
          });
        }
        finalBuyerId = user.id;
      }

      // Get buyer email - for authenticated users, fetch from database
      let finalBuyerEmail = buyerEmail;
      if (!finalBuyerEmail && finalBuyerId) {
        const buyer = await prisma.user.findUnique({
          where: { id: finalBuyerId },
          select: { email: true }
        });
        if (buyer?.email && !buyer.email.startsWith('guest-')) {
          finalBuyerEmail = buyer.email;
        }
      }

      // Group items by seller
      const sellerItems: Record<number, any[]> = {};
      for (const item of items) {
        const sellerId = item.sellerId || 1;
        if (!sellerItems[sellerId]) sellerItems[sellerId] = [];
        sellerItems[sellerId].push(item);
      }

      const createdOrders: any[] = [];

      for (const [sellerIdStr, sellerItemsList] of Object.entries(sellerItems)) {
        const sellerId = parseInt(sellerIdStr);
        const sellerTotal = sellerItemsList.reduce((sum: number, i: any) =>
          sum + (i.priceCents * i.quantity), 0);

        const sellerShipping = Array.isArray(shippingOption)
          ? shippingOption.find((s: any) => s.sellerId === sellerId)
          : shippingOption;

        const order = await prisma.order.create({
          data: {
            buyerId: finalBuyerId,
            sellerId,
            totalAmountCents: sellerTotal + (shippingFee || 0) + (tax || 0) + (tip || 0) + (serviceFee || 0) - (discount || 0),
            status: "pending",
            shippingName: shippingAddress?.name || buyerName || null,
            shippingStreet: shippingAddress?.street || shippingAddress?.address || null,
            shippingCity: shippingAddress?.city || null,
            shippingState: shippingAddress?.state || null,
            shippingZip: shippingAddress?.zip || shippingAddress?.zipCode || null,
            shippingPhone: shippingAddress?.phone || buyerPhone || null,
            shippingCarrier: sellerShipping?.carrier || null,
            shippingService: sellerShipping?.service || null,
            shippingPriceCents: shippingFee || 0,
            taxCents: tax || 0,
            tipCents: tip || 0,
            serviceFeeCents: serviceFee || 0,
            discountCents: discount || 0,
            stripePaymentId: paymentId || null,
            paymentStatus: paymentId ? "AUTHORIZED" : "PENDING",
            orderItems: {
              create: sellerItemsList.map((item: any) => ({
                productId: parseInt(item.productId),
                quantity: item.quantity,
                priceCents: item.priceCents,
                substitutionPreference: item.substitutionPreference || "best_match"
              }))
            }
          },
          include: { orderItems: true }
        });

        createdOrders.push(order);
        notifications.sendSellerNotification({ id: order.id, items: sellerItemsList, shippingAddress, total: sellerTotal }, sellerId).catch(console.error);
      }

      const enrichedItems = await Promise.all(items.map(async (item: any) => {
        const product = await prisma.product.findUnique({
          where: { id: parseInt(item.productId) },
          select: { name: true }
        });
        return { ...item, name: product?.name || 'Product' };
      }));

      notifications.sendBuyerConfirmation({
        id: createdOrders.map(o => o.id).join("-"),
        buyerId: finalBuyerId, buyerEmail: finalBuyerEmail, buyerPhone, buyerName, items: enrichedItems, shippingAddress, subtotal, shippingFee, tax, total
      }).catch(console.error);

      // Subscribe to SMS if consent given
      if (smsConsent && buyerPhone && finalBuyerEmail) {
        klaviyo.subscribeToSMS(finalBuyerEmail, buyerPhone, true).catch(console.error);
      }

      // Track Placed Order in Klaviyo
      if (finalBuyerEmail) {
        klaviyo.trackPlacedOrder({
          orderId: createdOrders.map(o => o.id).join("-"),
          email: finalBuyerEmail,
          phone: buyerPhone,
          name: buyerName,
          items: enrichedItems.map((item: any) => ({ productId: parseInt(item.productId), name: item.name, quantity: item.quantity, priceCents: item.priceCents, imageUrl: item.imageUrl })),
          subtotal: subtotal || 0,
          shippingFee: shippingFee || 0,
          tax: tax || 0,
          discount: discount || 0,
          total: total || 0,
          shippingAddress: shippingAddress ? { street: shippingAddress.street || shippingAddress.address, city: shippingAddress.city, state: shippingAddress.state, zip: shippingAddress.zip || shippingAddress.zipCode } : undefined
        }).catch(console.error);
      }

      return {
        ok: true,
        data: {
          orders: createdOrders,
          orderIds: createdOrders.map(o => o.id),
          message: `Order${createdOrders.length > 1 ? 's' : ''} created successfully`
        }
      };
    } catch (error: any) {
      console.error("Order creation error:", error);
      return { ok: false, error: error.message || "Failed to create order" };
    }
  });

  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };
    try {
      const order = await prisma.order.findUnique({
        where: { id: parseInt(id) },
        include: {
          orderItems: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
          seller: { select: { id: true, storeName: true, slug: true } }
        }
      });
      if (!order) return { ok: false, error: "Order not found" };
      return { ok: true, data: order };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  });

  app.get("/", async (request, reply) => {
    const { page = 1, limit = 20 } = request.query as any;

    // Get buyerId from auth token
    const authHeader = request.headers["authorization"];
    if (!authHeader) {
      return reply.code(401).send({ ok: false, error: "Authentication required" });
    }

    let buyerId: string | null = null;
    try {
      const token = authHeader.replace("Bearer ", "").trim();
      const jwtLib = await import("jsonwebtoken");
      const payload = jwtLib.default.verify(token, process.env.JWT_SECRET || "super-secret-change-me") as any;
      buyerId = payload?.id;
    } catch (err) {
      return reply.code(401).send({ ok: false, error: "Invalid token" });
    }

    if (!buyerId) {
      return reply.code(401).send({ ok: false, error: "Invalid token payload" });
    }

    try {
      const orders = await prisma.order.findMany({
        where: { buyerId },
        orderBy: { createdAt: "desc" },
        take: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
        include: {
          orderItems: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
          seller: { select: { id: true, storeName: true, slug: true, city: true, state: true } }
        }
      });
      const total = await prisma.order.count({ where: { buyerId } });
      return { ok: true, data: { orders, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  });

  // Track order by ID and email (no auth required)
  app.get("/:id/track", async (request) => {
    const { id } = request.params as { id: string };
    const { email } = request.query as { email?: string };
    try {
      const order = await prisma.order.findUnique({
        where: { id: parseInt(id) },
        include: {
          orderItems: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
          seller: { select: { id: true, storeName: true } },
          buyer: { select: { email: true } }
        }
      });
      if (!order) return { ok: false, error: "Order not found" };
      if (email && order.buyer?.email?.toLowerCase() !== email.toLowerCase()) {
        return { ok: false, error: "Email does not match order" };
      }
      const { buyer, ...orderData } = order;
      const items = order.orderItems.map(item => ({
        id: item.id,
        productName: item.product?.name || "Unknown Product",
        quantity: item.quantity,
        priceCents: item.priceCents
      }));
      return { ok: true, data: { ...orderData, orderItems: items } };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  });

};
export default orderRoutes; 
