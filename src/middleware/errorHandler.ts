/**
 * Global Error Handler Middleware
 * Graceful error handling for API errors
 */

import type { FastifyInstance, FastifyRequest, FastifyReply, FastifyError } from "fastify";
import fp from "fastify-plugin";

// Error response interface
interface ErrorResponse {
  ok: false;
  error: string;
  code?: string;
  statusCode: number;
  details?: any;
  requestId?: string;
}

// Known error codes and their HTTP status codes
const ERROR_STATUS_MAP: Record<string, number> = {
  VALIDATION_ERROR: 400,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMIT_EXCEEDED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Prisma error codes
const PRISMA_ERROR_MAP: Record<string, { status: number; message: string }> = {
  P2002: { status: 409, message: "A record with this value already exists" },
  P2025: { status: 404, message: "Record not found" },
  P2003: { status: 400, message: "Foreign key constraint failed" },
  P2014: { status: 400, message: "Invalid ID provided" },
};

/**
 * Format error for response
 */
function formatError(
  error: FastifyError | Error | any,
  request: FastifyRequest
): ErrorResponse {
  // Generate request ID for tracking
  const requestId = request.id || crypto.randomUUID?.() || Date.now().toString();

  // Default response
  let response: ErrorResponse = {
    ok: false,
    error: "Internal server error",
    statusCode: 500,
    requestId,
  };

  // Handle Fastify errors (validation, etc.)
  if ("validation" in error && error.validation) {
    response.error = "Validation error";
    response.code = "VALIDATION_ERROR";
    response.statusCode = 400;
    response.details = error.validation;
    return response;
  }

  // Handle Prisma errors
  if (error.code && error.code.startsWith("P")) {
    const prismaError = PRISMA_ERROR_MAP[error.code];
    if (prismaError) {
      response.error = prismaError.message;
      response.code = error.code;
      response.statusCode = prismaError.status;
      return response;
    }
  }

  // Handle known error codes
  if (error.code && ERROR_STATUS_MAP[error.code]) {
    response.statusCode = ERROR_STATUS_MAP[error.code];
    response.code = error.code;
    response.error = error.message || error.code;
    return response;
  }

  // Handle standard HTTP errors
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 600) {
    response.statusCode = error.statusCode;
    response.error = error.message || "Unknown error";
    response.code = error.code;
    return response;
  }

  // Handle generic errors
  if (error.message) {
    // Don't expose internal error details in production
    if (process.env.NODE_ENV === "production") {
      response.error = "An unexpected error occurred";
    } else {
      response.error = error.message;
    }
  }

  return response;
}

/**
 * Error handler plugin
 */
async function errorHandlerPlugin(app: FastifyInstance) {
  // Set custom error handler
  app.setErrorHandler((error, request, reply) => {
    const formattedError = formatError(error, request);

    // Log error
    request.log.error({
      msg: "Request error",
      err: error,
      requestId: formattedError.requestId,
      statusCode: formattedError.statusCode,
      url: request.url,
      method: request.method,
    });

    // Report to Sentry if available
    if ((app as any).Sentry) {
      (app as any).Sentry.captureException(error, {
        extra: {
          requestId: formattedError.requestId,
          url: request.url,
          method: request.method,
        },
      });
    }

    return reply.status(formattedError.statusCode).send(formattedError);
  });

  // Handle 404 not found
  app.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({
      ok: false,
      error: "Route not found",
      code: "NOT_FOUND",
      statusCode: 404,
      path: request.url,
    });
  });

  app.log.info("✅ Error handler middleware registered");
}

export default fp(errorHandlerPlugin, {
  name: "errorHandler",
  fastify: "5.x",
});

/**
 * Create a custom API error
 */
export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(
    message: string,
    code: string = "INTERNAL_ERROR",
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(message: string, details?: any) {
    return new ApiError(message, "BAD_REQUEST", 400, details);
  }

  static unauthorized(message: string = "Unauthorized") {
    return new ApiError(message, "UNAUTHORIZED", 401);
  }

  static forbidden(message: string = "Forbidden") {
    return new ApiError(message, "FORBIDDEN", 403);
  }

  static notFound(message: string = "Not found") {
    return new ApiError(message, "NOT_FOUND", 404);
  }

  static conflict(message: string, details?: any) {
    return new ApiError(message, "CONFLICT", 409, details);
  }

  static internal(message: string = "Internal server error") {
    return new ApiError(message, "INTERNAL_ERROR", 500);
  }
}

