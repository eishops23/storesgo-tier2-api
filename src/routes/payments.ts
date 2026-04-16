/**
 * StoresGo Payments Routes (simplified card listing)
 * Replaces: src/routes/payments.ts
 * 
 * This file was a duplicate card-listing endpoint using Square.
 * Now delegates to Stripe via the paymentMethods route.
 */

import { FastifyInstance } from "fastify";
import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia" as any,
});

export default async function paymentRoutes(app: FastifyInstance) {
  // GET /payments/methods - List saved cards (legacy endpoint)
  app.get("/methods", async (request) => {
    try {
      const user = (request as any).user;
      if (!user) return { ok: false, error: "Not authenticated" };

      const profile = await prisma.buyerProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile?.stripeCustomerId) {
        return { ok: true, methods: [], customerId: null };
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: profile.stripeCustomerId,
        type: "card",
      });

      const methods = paymentMethods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand || "unknown",
        last4: pm.card?.last4 || "****",
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
      }));

      return { ok: true, methods, customerId: profile.stripeCustomerId };
    } catch (error: any) {
      console.error("Fetch payment methods error:", error.message);
      return { ok: false, error: "Failed to fetch payment methods" };
    }
  });

  // DELETE /payments/methods/:id - Remove a card (legacy endpoint)
  app.delete("/methods/:id", async (request) => {
    try {
      const user = (request as any).user;
      if (!user) return { ok: false, error: "Not authenticated" };

      const { id } = request.params as any;
      await stripe.paymentMethods.detach(id);
      return { ok: true };
    } catch (error: any) {
      console.error("Delete payment method error:", error.message);
      return { ok: false, error: "Failed to delete" };
    }
  });
}
