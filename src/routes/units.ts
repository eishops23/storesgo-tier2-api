// ==========================================================
// UNITS API - Enterprise Unit System for Sellers
// ==========================================================
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";

async function unitRoutes(app: FastifyInstance) {
  // GET /api/units - List all units grouped by category
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const units = await prisma.$queryRaw`
        SELECT id, name, abbreviation, category, "baseUnit", "conversionFactor", "sortOrder"
        FROM units 
        WHERE "isActive" = true 
        ORDER BY "sortOrder"
      ` as any[];

      // Group by category for UI
      const grouped: Record<string, any[]> = {};
      for (const unit of units) {
        if (!grouped[unit.category]) grouped[unit.category] = [];
        grouped[unit.category].push(unit);
      }

      return { 
        ok: true, 
        data: { 
          units, 
          grouped,
          categories: Object.keys(grouped)
        } 
      };
    } catch (error: any) {
      console.error("Units fetch error:", error);
      return reply.code(500).send({ ok: false, error: "Failed to fetch units" });
    }
  });

  // GET /api/units/category/:category - Units by category
  app.get("/category/:category", async (request: FastifyRequest, reply: FastifyReply) => {
    const { category } = request.params as { category: string };
    
    try {
      const units = await prisma.$queryRaw`
        SELECT id, name, abbreviation, category, "baseUnit", "conversionFactor"
        FROM units 
        WHERE "isActive" = true AND category = ${category}
        ORDER BY "sortOrder"
      `;

      return { ok: true, data: units };
    } catch (error: any) {
      return reply.code(500).send({ ok: false, error: "Failed to fetch units" });
    }
  });

  // POST /api/units/calculate-price - Calculate price per unit
  app.post("/calculate-price", async (request: FastifyRequest, reply: FastifyReply) => {
    const { priceCents, unitId, quantity } = request.body as { 
      priceCents: number; 
      unitId: number; 
      quantity: number;
    };

    if (!priceCents || !unitId || !quantity) {
      return reply.code(400).send({ ok: false, error: "priceCents, unitId, quantity required" });
    }

    try {
      const unit = await prisma.$queryRaw`
        SELECT * FROM units WHERE id = ${unitId}
      ` as any[];

      if (!unit.length) {
        return reply.code(404).send({ ok: false, error: "Unit not found" });
      }

      const u = unit[0];
      const pricePerUnitCents = Math.round(priceCents / quantity);
      
      // Calculate standardized price (per lb for weight, per gal for volume, each for count)
      let standardPrice = null;
      let standardUnit = null;
      
      if (u.category === "weight") {
        // Convert to price per lb
        const ozQuantity = quantity * u.conversionFactor;
        standardPrice = Math.round((priceCents / ozQuantity) * 16);
        standardUnit = "lb";
      } else if (u.category === "volume") {
        // Convert to price per gallon
        const flozQuantity = quantity * u.conversionFactor;
        standardPrice = Math.round((priceCents / flozQuantity) * 128);
        standardUnit = "gal";
      }

      return { 
        ok: true, 
        data: {
          pricePerUnitCents,
          pricePerUnit: `$${(pricePerUnitCents / 100).toFixed(2)}/${u.abbreviation}`,
          standardPriceCents: standardPrice,
          standardPriceDisplay: standardPrice ? `$${(standardPrice / 100).toFixed(2)}/${standardUnit}` : null
        }
      };
    } catch (error: any) {
      return reply.code(500).send({ ok: false, error: "Calculation failed" });
    }
  });
}

export default unitRoutes;
