import "@fastify/jwt";

/**
 * Global UserJwtPayload interface for JWT authentication
 * This is the standard payload structure returned by all auth middlewares
 * Note: User IDs in this system are strings (from Prisma schema)
 */
export interface UserJwtPayload {
  id: string;
  email: string;
  role: "ADMIN" | "SELLER" | "BUYER";
  sellerId?: number;
}

/**
 * Extend @fastify/jwt module with our payload type
 */
declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: UserJwtPayload;
  }
}

/**
 * Extend Fastify module with user property on request
 */
declare module "fastify" {
  interface FastifyRequest {
    user?: UserJwtPayload;
    seller?: any;
    authUser?: UserJwtPayload;
  }
}
