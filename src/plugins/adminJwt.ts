import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import jwt from "jsonwebtoken";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { UserJwtPayload } from "../types/fastify-jwt.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticateAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async function (app: FastifyInstance) {
  app.register(fastifyJwt, {
    secret: process.env.ADMIN_JWT_SECRET || "superadminsecret",
  });

  app.decorate("authenticateAdmin", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return reply.code(401).send({ error: "Missing admin token" });
      }

      const decoded = jwt.verify(
        token,
        process.env.ADMIN_JWT_SECRET || "superadminsecret"
      ) as UserJwtPayload;

      // Accept both 'admin' and 'superadmin' roles for ADMIN type
      const validRoles = ["admin", "superadmin", "ADMIN"];
      if (!decoded.role || !validRoles.includes(decoded.role)) {
        return reply.code(403).send({ error: "Forbidden: Admins only" });
      }

      // Attach decoded user to request
      req.user = decoded;
    } catch (err) {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });
});
