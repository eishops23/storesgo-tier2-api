import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";
import jwt from "jsonwebtoken";

const EASYPOST_API_KEY = process.env.EASYPOST_API_KEY || "";
const JWT_SECRET = process.env.JWT_SECRET || "storesgo-secret";

interface AddressBody {
  label?: string;
  firstName?: string;
  lastName?: string;
  street: string;
  apt?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  phone?: string;
  isDefault?: boolean;
}

// Get user ID from JWT token
function getUserIdFromToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.id || null;
  } catch {
    return null;
  }
}

export default async function addressRoutes(app: FastifyInstance) {
  // Verify address with EasyPost
  app.post("/verify", async (request: FastifyRequest<{ Body: AddressBody }>, reply: FastifyReply) => {
    const { street, apt, city, state, zip, country } = request.body;
    
    if (!street || !city || !state || !zip) {
      return reply.status(400).send({ ok: false, error: "Street, city, state, and zip required" });
    }

    if (!EASYPOST_API_KEY) {
      // Return unverified but valid format if no API key
      return reply.send({ 
        ok: true, 
        verified: false, 
        message: "Address format valid but not verified",
        address: { street, apt, city, state, zip, country: country || "US" }
      });
    }

    try {
      const EasyPost = (await import("@easypost/api")).default;
      const client = new EasyPost(EASYPOST_API_KEY);

      const address = await client.Address.create({
        street1: street,
        street2: apt || "",
        city,
        state,
        zip,
        country: country || "US",
        verify: ["delivery"]
      });

      const verification = address.verifications?.delivery;
      
      if (verification?.success) {
        return reply.send({
          ok: true,
          verified: true,
          address: {
            street: address.street1,
            apt: address.street2 || "",
            city: address.city,
            state: address.state,
            zip: address.zip,
            country: address.country
          },
          residential: address.residential
        });
      } else {
        const errors = verification?.errors || [];
        return reply.send({
          ok: true,
          verified: false,
          message: errors[0]?.message || "Address could not be verified",
          suggestions: address.street1 !== street ? {
            street: address.street1,
            city: address.city,
            state: address.state,
            zip: address.zip
          } : null
        });
      }
    } catch (error: any) {
      app.log.error({ error }, "EasyPost verification failed");
      return reply.send({ 
        ok: true, 
        verified: false, 
        message: "Verification service unavailable",
        address: { street, apt, city, state, zip, country: country || "US" }
      });
    }
  });

  // Get all addresses for authenticated user
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserIdFromToken(request);
    
    if (!userId) {
      return reply.status(401).send({ ok: false, error: "Authentication required" });
    }

    try {
      const addresses = await prisma.address.findMany({
        where: { userId },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
      });
      
      return reply.send({ ok: true, addresses });
    } catch (error: any) {
      app.log.error({ error }, "Failed to get addresses");
      return reply.status(500).send({ ok: false, error: "Failed to get addresses" });
    }
  });

  // Create new address
  app.post("/", async (request: FastifyRequest<{ Body: AddressBody }>, reply: FastifyReply) => {
    const userId = getUserIdFromToken(request);
    
    if (!userId) {
      return reply.status(401).send({ ok: false, error: "Authentication required" });
    }

    const { label, firstName, lastName, street, apt, city, state, zip, country, phone, isDefault } = request.body;

    if (!street || !city || !state || !zip) {
      return reply.status(400).send({ ok: false, error: "Street, city, state, and zip required" });
    }

    try {
      // If setting as default, unset other defaults
      if (isDefault) {
        await prisma.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false }
        });
      }

      // Check if this is the first address (make it default)
      const existingCount = await prisma.address.count({ where: { userId } });
      const shouldBeDefault = isDefault || existingCount === 0;

      const address = await prisma.address.create({
        data: {
          userId,
          label: label || "Home",
          firstName,
          lastName,
          street,
          apt,
          city,
          state,
          zip,
          country: country || "US",
          phone,
          isDefault: shouldBeDefault,
          isVerified: false
        }
      });

      return reply.send({ ok: true, address });
    } catch (error: any) {
      app.log.error({ error }, "Failed to create address");
      return reply.status(500).send({ ok: false, error: "Failed to create address" });
    }
  });

  // Update address
  app.put("/:id", async (request: FastifyRequest<{ Params: { id: string }; Body: AddressBody }>, reply: FastifyReply) => {
    const userId = getUserIdFromToken(request);
    
    if (!userId) {
      return reply.status(401).send({ ok: false, error: "Authentication required" });
    }

    const { id } = request.params;
    const { label, firstName, lastName, street, apt, city, state, zip, country, phone, isDefault } = request.body;

    try {
      // Verify ownership
      const existing = await prisma.address.findFirst({
        where: { id, userId }
      });

      if (!existing) {
        return reply.status(404).send({ ok: false, error: "Address not found" });
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        await prisma.address.updateMany({
          where: { userId, isDefault: true, id: { not: id } },
          data: { isDefault: false }
        });
      }

      const address = await prisma.address.update({
        where: { id },
        data: {
          label,
          firstName,
          lastName,
          street,
          apt,
          city,
          state,
          zip,
          country,
          phone,
          isDefault
        }
      });

      return reply.send({ ok: true, address });
    } catch (error: any) {
      app.log.error({ error }, "Failed to update address");
      return reply.status(500).send({ ok: false, error: "Failed to update address" });
    }
  });

  // Delete address
  app.delete("/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = getUserIdFromToken(request);
    
    if (!userId) {
      return reply.status(401).send({ ok: false, error: "Authentication required" });
    }

    const { id } = request.params;

    try {
      // Verify ownership
      const existing = await prisma.address.findFirst({
        where: { id, userId }
      });

      if (!existing) {
        return reply.status(404).send({ ok: false, error: "Address not found" });
      }

      await prisma.address.delete({ where: { id } });

      // If deleted address was default, set another as default
      if (existing.isDefault) {
        const nextAddress = await prisma.address.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" }
        });
        if (nextAddress) {
          await prisma.address.update({
            where: { id: nextAddress.id },
            data: { isDefault: true }
          });
        }
      }

      return reply.send({ ok: true, message: "Address deleted" });
    } catch (error: any) {
      app.log.error({ error }, "Failed to delete address");
      return reply.status(500).send({ ok: false, error: "Failed to delete address" });
    }
  });

  // Set address as default
  app.post("/:id/default", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = getUserIdFromToken(request);
    
    if (!userId) {
      return reply.status(401).send({ ok: false, error: "Authentication required" });
    }

    const { id } = request.params;

    try {
      // Verify ownership
      const existing = await prisma.address.findFirst({
        where: { id, userId }
      });

      if (!existing) {
        return reply.status(404).send({ ok: false, error: "Address not found" });
      }

      // Unset all other defaults
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      });

      // Set this one as default
      const address = await prisma.address.update({
        where: { id },
        data: { isDefault: true }
      });

      return reply.send({ ok: true, address });
    } catch (error: any) {
      app.log.error({ error }, "Failed to set default address");
      return reply.status(500).send({ ok: false, error: "Failed to set default" });
    }
  });
}
