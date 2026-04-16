import { FastifyInstance } from "fastify";
import * as promoService from "../services/promo.service.js";

export default async function promoRoutes(fastify: FastifyInstance) {
  
  // Validate promo code (public - for checkout)
  fastify.post("/validate", async (request, reply) => {
    const { code, subtotalCents } = request.body as any;
    const userId = (request as any).userId;
    
    if (!code) return reply.status(400).send({ ok: false, error: "Promo code required" });
    if (!subtotalCents) return reply.status(400).send({ ok: false, error: "Subtotal required" });
    
    const result = await promoService.validatePromoCode(code, subtotalCents, userId);
    
    if (!result.valid) {
      return reply.status(400).send({ ok: false, error: result.error });
    }
    
    const discountCents = promoService.calculateDiscount(
      subtotalCents,
      result.discount!.type,
      result.discount!.value,
      result.discount!.maxDiscount
    );
    
    return { 
      ok: true, 
      data: {
        valid: true,
        discountCents,
        discountType: result.discount!.type,
        message: `You'll save $${(discountCents / 100).toFixed(2)}!`
      }
    };
  });
  
  // Apply promo code (when order is placed)
  fastify.post("/apply", async (request, reply) => {
    const { code, subtotalCents, orderId, visitorId } = request.body as any;
    const userId = (request as any).userId;
    
    if (!code || !subtotalCents) {
      return reply.status(400).send({ ok: false, error: "Code and subtotal required" });
    }
    
    const result = await promoService.applyPromoCode(code, subtotalCents, userId, orderId, visitorId);
    
    if (!result.success) {
      return reply.status(400).send({ ok: false, error: result.message });
    }
    
    return { ok: true, data: result };
  });
  
  // List promo codes (admin/seller)
  fastify.get("/", async (request, reply) => {
    const { sellerId, activeOnly, page, limit } = request.query as any;
    
    const result = await promoService.listPromoCodes({
      sellerId: sellerId ? parseInt(sellerId) : undefined,
      activeOnly: activeOnly === "true",
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20
    });
    
    return { ok: true, data: result.codes, total: result.total, page: result.page };
  });
  
  // Create promo code (admin/seller)
  fastify.post("/", async (request, reply) => {
    const data = request.body as any;
    
    if (!data.code || !data.discountValue) {
      return reply.status(400).send({ ok: false, error: "Code and discount value required" });
    }
    
    try {
      const promo = await promoService.createPromoCode({
        code: data.code,
        description: data.description,
        discountType: data.discountType || "percentage",
        discountValue: parseFloat(data.discountValue),
        minOrderCents: data.minOrderCents ? parseInt(data.minOrderCents) : undefined,
        maxDiscountCents: data.maxDiscountCents ? parseInt(data.maxDiscountCents) : undefined,
        usageLimit: data.usageLimit ? parseInt(data.usageLimit) : undefined,
        perUserLimit: data.perUserLimit ? parseInt(data.perUserLimit) : 1,
        validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        applicableTo: data.applicableTo,
        applicableIds: data.applicableIds,
        sellerId: data.sellerId ? parseInt(data.sellerId) : undefined
      });
      
      return { ok: true, data: promo };
    } catch (error: any) {
      if (error.code === "P2002") {
        return reply.status(400).send({ ok: false, error: "Promo code already exists" });
      }
      throw error;
    }
  });
  
  // Get promo code stats
  fastify.get("/:id/stats", async (request, reply) => {
    const { id } = request.params as any;
    const stats = await promoService.getPromoCodeStats(parseInt(id));
    
    if (!stats) {
      return reply.status(404).send({ ok: false, error: "Promo code not found" });
    }
    
    return { ok: true, data: stats };
  });
  
  // Update promo code
  fastify.patch("/:id", async (request, reply) => {
    const { id } = request.params as any;
    const data = request.body as any;
    
    const updated = await promoService.updatePromoCode(parseInt(id), data);
    return { ok: true, data: updated };
  });
  
  // Delete (deactivate) promo code
  fastify.delete("/:id", async (request, reply) => {
    const { id } = request.params as any;
    await promoService.deletePromoCode(parseInt(id));
    return { ok: true, message: "Promo code deactivated" };
  });
}
