/**
 * StoresGo Stripe Payment Methods Routes
 * Replaces: src/routes/paymentMethods.ts
 * 
 * Manages saved cards via Stripe Customer + PaymentMethods API
 */

import { FastifyPluginAsync } from "fastify";
import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia" as any,
});

// Helper: Get or create Stripe customer for user
async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  firstName?: string,
  lastName?: string
): Promise<string | null> {
  const profile = await prisma.buyerProfile.findUnique({
    where: { userId },
  });

  if (profile?.stripeCustomerId) {
    return profile.stripeCustomerId;
  }

  try {
    const customer = await stripe.customers.create({
      email,
      name: [firstName, lastName].filter(Boolean).join(" ") || undefined,
      metadata: { userId },
    });

    await prisma.buyerProfile.upsert({
      where: { userId },
      update: { stripeCustomerId: customer.id },
      create: {
        userId,
        stripeCustomerId: customer.id,
      },
    });

    return customer.id;
  } catch (error: any) {
    console.error("Stripe customer creation error:", error.message);
    return null;
  }
}

const paymentMethodsRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/payment-methods - List saved cards
  app.get("/", async (request) => {
    try {
      const user = (request as any).user;
      if (!user) return { ok: false, error: "Not authenticated" };

      const profile = await prisma.buyerProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile?.stripeCustomerId) {
        return { ok: true, methods: [], customerId: null };
      }

      // Fetch payment methods from Stripe
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

  // POST /api/payment-methods - Save a new card (via SetupIntent)
  app.post("/", async (request) => {
    try {
      const user = (request as any).user;
      if (!user) return { ok: false, error: "Not authenticated" };

      const { paymentMethodId } = request.body as any;

      if (!paymentMethodId) {
        return { ok: false, error: "Payment method ID required" };
      }

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { buyerProfile: true },
      });

      if (!fullUser) return { ok: false, error: "User not found" };

      // Get or create Stripe customer
      const stripeCustomerId = await getOrCreateStripeCustomer(
        user.id,
        fullUser.email,
        fullUser.buyerProfile?.firstName || undefined,
        fullUser.buyerProfile?.lastName || undefined
      );

      if (!stripeCustomerId) {
        return { ok: false, error: "Could not create customer" };
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });

      // Get payment method details
      const pm = await stripe.paymentMethods.retrieve(paymentMethodId);

      return {
        ok: true,
        card: {
          id: pm.id,
          brand: pm.card?.brand || "unknown",
          last4: pm.card?.last4 || "****",
          expMonth: pm.card?.exp_month,
          expYear: pm.card?.exp_year,
        },
      };
    } catch (error: any) {
      console.error("Save payment method error:", error.message);
      return { ok: false, error: error.message || "Failed to save payment method" };
    }
  });

  // POST /api/payment-methods/setup-intent - Create SetupIntent for saving cards
  app.post("/setup-intent", async (request) => {
    try {
      const user = (request as any).user;
      if (!user) return { ok: false, error: "Not authenticated" };

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { buyerProfile: true },
      });

      if (!fullUser) return { ok: false, error: "User not found" };

      const stripeCustomerId = await getOrCreateStripeCustomer(
        user.id,
        fullUser.email,
        fullUser.buyerProfile?.firstName || undefined,
        fullUser.buyerProfile?.lastName || undefined
      );

      if (!stripeCustomerId) {
        return { ok: false, error: "Could not create customer" };
      }

      const setupIntent = await stripe.setupIntents.create({
        customer: stripeCustomerId,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        ok: true,
        clientSecret: setupIntent.client_secret,
        customerId: stripeCustomerId,
      };
    } catch (error: any) {
      console.error("Setup intent error:", error.message);
      return { ok: false, error: "Failed to create setup intent" };
    }
  });

  // DELETE /api/payment-methods/:id - Remove a card
  app.delete("/:id", async (request) => {
    try {
      const user = (request as any).user;
      if (!user) return { ok: false, error: "Not authenticated" };

      const { id } = request.params as any;

      // Detach payment method from customer
      await stripe.paymentMethods.detach(id);

      return { ok: true };
    } catch (error: any) {
      console.error("Delete payment method error:", error.message);
      return { ok: false, error: "Failed to delete payment method" };
    }
  });

  // POST /api/payment-methods/:id/default - Set default card
  app.post("/:id/default", async (request) => {
    try {
      const user = (request as any).user;
      if (!user) return { ok: false, error: "Not authenticated" };

      const { id } = request.params as any;
      const profile = await prisma.buyerProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile?.stripeCustomerId) {
        return { ok: false, error: "No customer found" };
      }

      // Set as default payment method on customer
      await stripe.customers.update(profile.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: id,
        },
      });

      return { ok: true };
    } catch (error: any) {
      console.error("Set default payment method error:", error.message);
      return { ok: false, error: "Failed to set default" };
    }
  });
};

export default paymentMethodsRoutes;
