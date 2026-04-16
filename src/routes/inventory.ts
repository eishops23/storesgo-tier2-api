import { FastifyInstance } from "fastify";
import * as inventoryService from "../services/inventory.service.js";

export default async function inventoryRoutes(fastify: FastifyInstance) {
  
  // Check product availability (public)
  fastify.get("/check/:productId", async (request, reply) => {
    const { productId } = request.params as any;
    const { quantity } = request.query as any;
    
    const result = await inventoryService.checkAvailability(
      parseInt(productId),
      quantity ? parseInt(quantity) : 1
    );
    
    return { ok: true, data: result };
  });
  
  // Get product inventory details
  fastify.get("/:productId", async (request, reply) => {
    const { productId } = request.params as any;
    const inventory = await inventoryService.getProductInventory(parseInt(productId));
    
    if (!inventory) {
      return { ok: true, data: { trackInventory: false, available: true } };
    }
    
    return { ok: true, data: inventory };
  });
  
  // Initialize inventory for a product
  fastify.post("/:productId", async (request, reply) => {
    const { productId } = request.params as any;
    const { initialStock, lowStockThreshold } = request.body as any;
    
    const inventory = await inventoryService.initializeInventory(
      parseInt(productId),
      initialStock ? parseInt(initialStock) : 0
    );
    
    return { ok: true, data: inventory };
  });
  
  // Update stock (restock, adjustment)
  fastify.post("/:productId/stock", async (request, reply) => {
    const { productId } = request.params as any;
    const { quantity, type, reason } = request.body as any;
    
    if (!quantity || !type) {
      return reply.status(400).send({ ok: false, error: "Quantity and type required" });
    }
    
    try {
      const updated = await inventoryService.updateStock(
        parseInt(productId),
        parseInt(quantity),
        type,
        reason
      );
      return { ok: true, data: updated };
    } catch (error: any) {
      return reply.status(400).send({ ok: false, error: error.message });
    }
  });
  
  // Get movement history
  fastify.get("/:productId/movements", async (request, reply) => {
    const { productId } = request.params as any;
    const { page, limit, type } = request.query as any;
    
    const result = await inventoryService.getInventoryMovements(parseInt(productId), {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      type
    });
    
    return { ok: true, data: result.movements, total: result.total };
  });
  
  // Get low stock alerts
  fastify.get("/alerts/low-stock", async (request, reply) => {
    const { sellerId } = request.query as any;
    const products = await inventoryService.getLowStockProducts(
      sellerId ? parseInt(sellerId) : undefined
    );
    return { ok: true, data: products };
  });
  
  // Get inventory summary
  fastify.get("/summary", async (request, reply) => {
    const { sellerId } = request.query as any;
    const summary = await inventoryService.getInventorySummary(
      sellerId ? parseInt(sellerId) : undefined
    );
    return { ok: true, data: summary };
  });
  
  // Bulk update inventory
  fastify.post("/bulk-update", async (request, reply) => {
    const { updates } = request.body as any;
    
    if (!updates || !Array.isArray(updates)) {
      return reply.status(400).send({ ok: false, error: "Updates array required" });
    }
    
    const results = await inventoryService.bulkUpdateInventory(updates);
    return { ok: true, data: results };
  });
  
  // Reserve stock (for cart/checkout)
  fastify.post("/:productId/reserve", async (request, reply) => {
    const { productId } = request.params as any;
    const { quantity } = request.body as any;
    
    const success = await inventoryService.reserveStock(
      parseInt(productId),
      parseInt(quantity) || 1
    );
    
    if (!success) {
      return reply.status(400).send({ ok: false, error: "Insufficient stock" });
    }
    
    return { ok: true, message: "Stock reserved" };
  });
  
  // Release reserved stock
  fastify.post("/:productId/release", async (request, reply) => {
    const { productId } = request.params as any;
    const { quantity } = request.body as any;
    
    await inventoryService.releaseReservedStock(
      parseInt(productId),
      parseInt(quantity) || 1
    );
    
    return { ok: true, message: "Reserved stock released" };
  });
}
