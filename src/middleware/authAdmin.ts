import jwt from "jsonwebtoken";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    authenticateAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    admin?: any;
  }
}

async function authAdminPlugin(app: FastifyInstance) {
  app.decorate("authenticateAdmin", async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.code(401).send({ error: "Missing Authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");

    try {
      const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || "secret") as any;

      if (!decoded || decoded.role !== "admin") {
        return reply.code(403).send({ error: "Forbidden" });
      }

      request.admin = decoded;
    } catch (error) {
      return reply.code(401).send({ error: "Invalid token" });
    }
  });
}

export default fp(authAdminPlugin, { name: "auth-admin" });
