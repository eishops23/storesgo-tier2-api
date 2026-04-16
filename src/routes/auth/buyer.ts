import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { notifyWelcomeBuyer } from "../../services/notifications.service.js";
import { verifyCaptchaMiddleware } from "../../middleware/captcha.js";
import { rateLimiters } from "../../plugins/rateLimit.js";

// Import shared prisma singleton
import { prisma } from "../../lib/prisma.js";

interface RegisterBody {
  email: string;
  password: string;
  name?: string;
  captchaToken?: string;
}

interface LoginBody {
  email: string;
  password: string;
  captchaToken?: string;
}

export default async function buyerAuthRoutes(app: FastifyInstance) {
  // Register with CAPTCHA verification and rate limiting
  app.post("/buyer/register", { preHandler: [rateLimiters.register, verifyCaptchaMiddleware] }, async (req: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return reply.status(400).send({ ok: false, error: "Email and password required" });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return reply.status(400).send({ ok: false, error: "Invalid email format" });
    }

    // Password strength validation
    if (password.length < 8) {
      return reply.status(400).send({ ok: false, error: "Password must be at least 8 characters" });
    }
    if (!/[A-Z]/.test(password)) {
      return reply.status(400).send({ ok: false, error: "Password must contain at least one uppercase letter" });
    }
    if (!/[0-9]/.test(password)) {
      return reply.status(400).send({ ok: false, error: "Password must contain at least one number" });
    }

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return reply.status(400).send({ ok: false, error: "Email already registered" });
      }

      const hashed = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: { 
          email, 
          password: hashed,
          role: "BUYER",
          buyerProfile: {
            create: {
              firstName: name || null,
            }
          }
        },
        include: { buyerProfile: true }
      });

      const token = jwt.sign({ id: user.id, role: "BUYER" }, process.env.JWT_SECRET || "secret");

      // 🔔 Send welcome notification
      try {
        await notifyWelcomeBuyer({
          userId: user.id,
          userEmail: user.email,
          name: name || user.email.split("@")[0],
        });
        app.log.info(`📧 Welcome notification sent to ${user.email}`);
      } catch (notifyErr: any) {
        app.log.warn(`⚠️ Failed to send welcome notification: ${notifyErr.message}`);
      }

      return reply.send({ ok: true, token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err: any) {
      app.log.error({ err }, "Buyer registration failed");
      return reply.status(500).send({ ok: false, error: "Registration failed" });
    }
  });

  // Login with CAPTCHA verification and rate limiting
  app.post("/buyer/login", { preHandler: [rateLimiters.login, verifyCaptchaMiddleware] }, async (req: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return reply.status(400).send({ ok: false, error: "Email and password required" });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return reply.status(400).send({ ok: false, error: "Invalid email format" });
    }

    // Password strength validation
    if (password.length < 8) {
      return reply.status(400).send({ ok: false, error: "Password must be at least 8 characters" });
    }
    if (!/[A-Z]/.test(password)) {
      return reply.status(400).send({ ok: false, error: "Password must contain at least one uppercase letter" });
    }
    if (!/[0-9]/.test(password)) {
      return reply.status(400).send({ ok: false, error: "Password must contain at least one number" });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || user.role !== "BUYER") {
        return reply.status(400).send({ ok: false, error: "Invalid credentials" });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return reply.status(400).send({ ok: false, error: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, role: "BUYER" }, process.env.JWT_SECRET || "secret");

      return reply.send({ ok: true, token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err: any) {
      app.log.error({ err }, "Buyer login failed");
      return reply.status(500).send({ ok: false, error: "Login failed" });
    }
  });
}
