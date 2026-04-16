import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { notifyWelcomeSeller } from "../../services/notifications.service.js";
import { verifyCaptchaMiddleware } from "../../middleware/captcha.js";
import { rateLimiters } from "../../plugins/rateLimit.js";

// Import shared prisma singleton
import { prisma } from "../../lib/prisma.js";

interface RegisterBody {
  email: string;
  password: string;
  storeName: string;
  captchaToken?: string;
}

interface LoginBody {
  email: string;
  password: string;
  captchaToken?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default async function sellerAuthRoutes(app: FastifyInstance) {
  // Register with CAPTCHA verification and rate limiting
  app.post("/seller/register", { preHandler: [rateLimiters.register, verifyCaptchaMiddleware] }, async (req: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    const { email, password, storeName } = req.body;

    if (!email || !password || !storeName) {
      return reply.status(400).send({ ok: false, error: "Email, password, and store name required" });
    }

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return reply.status(400).send({ ok: false, error: "Email already registered" });
      }

      const hashed = await bcrypt.hash(password, 10);
      const slug = slugify(storeName) + "-" + Date.now();

      const user = await prisma.user.create({
        data: { 
          email, 
          password: hashed,
          role: "SELLER",
          sellerProfile: {
            create: {
              storeName,
              slug,
              isApproved: false
            }
          }
        },
        include: { sellerProfile: true }
      });

      const token = jwt.sign({ id: user.id, role: "SELLER", sellerId: user.sellerProfile?.id }, process.env.JWT_SECRET || "secret");

      // 🔔 Send welcome notification to seller
      if (user.sellerProfile) {
        try {
          await notifyWelcomeSeller({
            sellerId: user.sellerProfile.id,
            sellerEmail: user.email,
            storeName: storeName,
          });
          app.log.info(`📧 Welcome notification sent to seller ${user.email}`);
        } catch (notifyErr: any) {
          app.log.warn(`⚠️ Failed to send seller welcome notification: ${notifyErr.message}`);
        }
      }

      return reply.send({ 
        ok: true, 
        token, 
        user: { id: user.id, email: user.email, role: user.role },
        seller: user.sellerProfile
      });
    } catch (err: any) {
      app.log.error({ err }, "Seller registration failed");
      return reply.status(500).send({ ok: false, error: "Registration failed" });
    }
  });

  // Login with CAPTCHA verification and rate limiting
  app.post("/seller/login", { preHandler: [rateLimiters.login, verifyCaptchaMiddleware] }, async (req: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return reply.status(400).send({ ok: false, error: "Email and password required" });
    }

    try {
      const user = await prisma.user.findUnique({ 
        where: { email },
        include: { sellerProfile: true }
      });

      if (!user || user.role !== "SELLER") {
        return reply.status(400).send({ ok: false, error: "Invalid credentials" });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return reply.status(400).send({ ok: false, error: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, role: "SELLER", sellerId: user.sellerProfile?.id }, process.env.JWT_SECRET || "secret");

      return reply.send({ 
        ok: true, 
        token, 
        user: { id: user.id, email: user.email, role: user.role },
        seller: user.sellerProfile
      });
    } catch (err: any) {
      app.log.error({ err }, "Seller login failed");
      return reply.status(500).send({ ok: false, error: "Login failed" });
    }
  });
}
