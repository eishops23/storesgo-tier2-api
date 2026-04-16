import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";

interface LoginBody {
  email: string;
  password: string;
}

interface RegisterBody {
  email: string;
  password: string;
  name?: string;
  role?: string;
}

export default async function checkoutAuthRoutes(app: FastifyInstance) {
  // Simple login for checkout
  app.post("/login", async (req: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return reply.status(400).send({ ok: false, error: "Email and password required" });
    }
    
    try {
      const user = await prisma.user.findUnique({ 
        where: { email },
        include: { buyerProfile: true }
      });
      
      if (!user) {
        return reply.status(400).send({ ok: false, error: "Invalid email or password" });
      }
      
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return reply.status(400).send({ ok: false, error: "Invalid email or password" });
      }
      
      const token = jwt.sign(
        { id: user.id, role: user.role }, 
        process.env.JWT_SECRET || "storesgo-secret"
      );
      
      return reply.send({ 
        ok: true, 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.buyerProfile?.firstName || user.email.split("@")[0],
          role: user.role 
        } 
      });
    } catch (err: any) {
      app.log.error({ err }, "Login failed");
      return reply.status(500).send({ ok: false, error: "Login failed" });
    }
  });

  // Simple register for checkout
  app.post("/register", async (req: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    const { email, password, name, role } = req.body;
    
    if (!email || !password) {
      return reply.status(400).send({ ok: false, error: "Email and password required" });
    }
    
    if (password.length < 6) {
      return reply.status(400).send({ ok: false, error: "Password must be at least 6 characters" });
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
          role: role === "SELLER" ? "SELLER" : "BUYER",
          buyerProfile: role !== "SELLER" ? {
            create: {
              firstName: name || null,
            }
          } : undefined
        },
        include: { buyerProfile: true }
      });
      
      const token = jwt.sign(
        { id: user.id, role: user.role }, 
        process.env.JWT_SECRET || "storesgo-secret"
      );
      
      return reply.send({ 
        ok: true, 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          name: name || user.email.split("@")[0],
          role: user.role 
        } 
      });
    } catch (err: any) {
      app.log.error({ err }, "Registration failed");
      return reply.status(500).send({ ok: false, error: "Registration failed" });
    }
  });
}
