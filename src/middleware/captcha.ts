/**
 * CAPTCHA Verification Middleware for Fastify
 * Validates CAPTCHA tokens on protected endpoints
 * Supports reCAPTCHA v2, v3, and hCaptcha
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import {
  verifyCaptcha,
  isCaptchaEnabled,
  getCaptchaErrorMessage,
  getCaptchaProvider,
  type CaptchaVerificationResult,
} from "../services/captcha.service.js";

// Expected request body structure when CAPTCHA is required
interface CaptchaRequestBody {
  captchaToken?: string;
  captcha_token?: string; // Alternative field name
  "g-recaptcha-response"?: string; // Standard reCAPTCHA field
  "h-captcha-response"?: string; // Standard hCaptcha field
  captchaAction?: string; // Action for reCAPTCHA v3
}

/**
 * Extract CAPTCHA token from request body
 * Supports multiple field names for flexibility
 */
function extractCaptchaToken(body: CaptchaRequestBody): string | undefined {
  return (
    body.captchaToken ||
    body.captcha_token ||
    body["g-recaptcha-response"] ||
    body["h-captcha-response"]
  );
}

/**
 * Get the client's IP address from the request
 */
function getClientIp(request: FastifyRequest): string | undefined {
  // Check common proxy headers first
  const forwardedFor = request.headers["x-forwarded-for"];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor.split(",")[0];
    return ips?.trim();
  }

  const realIp = request.headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fallback to socket address
  return request.ip;
}

/**
 * CAPTCHA verification middleware
 * Validates the CAPTCHA token in the request body
 * 
 * @example
 * // In a route file:
 * app.post("/register", { preHandler: verifyCaptchaMiddleware }, handler);
 */
export async function verifyCaptchaMiddleware(
  request: FastifyRequest<{ Body: CaptchaRequestBody }>,
  reply: FastifyReply
): Promise<void> {
  // Skip if CAPTCHA is disabled
  if (!isCaptchaEnabled()) {
    return;
  }

  const token = extractCaptchaToken(request.body || {});
  const clientIp = getClientIp(request);
  const action = (request.body as CaptchaRequestBody)?.captchaAction;

  if (!token) {
    return reply.status(400).send({
      ok: false,
      error: "CAPTCHA verification required",
      code: "CAPTCHA_REQUIRED",
    });
  }

  const result: CaptchaVerificationResult = await verifyCaptcha(token, clientIp, action);

  if (!result.success) {
    const errorMessage = getCaptchaErrorMessage(result);
    
    request.log.warn({
      msg: "CAPTCHA verification failed",
      provider: result.provider,
      errorCodes: result.errorCodes,
      score: result.score, // Log score for v3 debugging
      clientIp,
    });

    return reply.status(400).send({
      ok: false,
      error: errorMessage,
      code: "CAPTCHA_FAILED",
      score: result.score, // Include score for v3 debugging (optional)
    });
  }

  // Log successful verification
  request.log.debug({
    msg: "CAPTCHA verification successful",
    provider: result.provider,
    hostname: result.hostname,
    score: result.score, // Log score for v3
    action: result.action,
  });
}

/**
 * Optional CAPTCHA middleware - only verifies if token is provided
 * Useful for endpoints that want CAPTCHA but shouldn't require it
 */
export async function optionalCaptchaMiddleware(
  request: FastifyRequest<{ Body: CaptchaRequestBody }>,
  reply: FastifyReply
): Promise<void> {
  // Skip if CAPTCHA is disabled
  if (!isCaptchaEnabled()) {
    return;
  }

  const token = extractCaptchaToken(request.body || {});
  
  // If no token provided, skip verification (it's optional)
  if (!token) {
    return;
  }

  const clientIp = getClientIp(request);
  const action = (request.body as CaptchaRequestBody)?.captchaAction;
  const result: CaptchaVerificationResult = await verifyCaptcha(token, clientIp, action);

  if (!result.success) {
    const errorMessage = getCaptchaErrorMessage(result);
    
    request.log.warn({
      msg: "Optional CAPTCHA verification failed",
      provider: result.provider,
      errorCodes: result.errorCodes,
      score: result.score,
      clientIp,
    });

    return reply.status(400).send({
      ok: false,
      error: errorMessage,
      code: "CAPTCHA_FAILED",
    });
  }
}

/**
 * Factory function to create CAPTCHA middleware with custom options
 */
export function createCaptchaMiddleware(options: {
  required?: boolean;
  expectedAction?: string; // For reCAPTCHA v3 action validation
  logLevel?: "debug" | "info" | "warn";
}) {
  const { required = true, expectedAction, logLevel = "debug" } = options;

  return async (
    request: FastifyRequest<{ Body: CaptchaRequestBody }>,
    reply: FastifyReply
  ): Promise<void> => {
    // Skip if CAPTCHA is disabled
    if (!isCaptchaEnabled()) {
      return;
    }

    const token = extractCaptchaToken(request.body || {});
    
    // Handle optional vs required
    if (!token) {
      if (required) {
        return reply.status(400).send({
          ok: false,
          error: "CAPTCHA verification required",
          code: "CAPTCHA_REQUIRED",
        });
      }
      return; // Optional and no token provided
    }

    const clientIp = getClientIp(request);
    const action = expectedAction || (request.body as CaptchaRequestBody)?.captchaAction;
    const result: CaptchaVerificationResult = await verifyCaptcha(token, clientIp, action);

    if (!result.success) {
      const errorMessage = getCaptchaErrorMessage(result);
      
      request.log.warn({
        msg: "CAPTCHA verification failed",
        provider: result.provider,
        errorCodes: result.errorCodes,
        score: result.score,
        expectedAction,
        clientIp,
      });

      return reply.status(400).send({
        ok: false,
        error: errorMessage,
        code: "CAPTCHA_FAILED",
      });
    }

    // Log successful verification
    request.log[logLevel]({
      msg: "CAPTCHA verification successful",
      provider: result.provider,
      score: result.score,
      action: result.action,
    });
  };
}

/**
 * Pre-configured middleware for common actions (reCAPTCHA v3)
 */
export const captchaMiddleware = {
  login: createCaptchaMiddleware({ expectedAction: "login" }),
  register: createCaptchaMiddleware({ expectedAction: "register" }),
  checkout: createCaptchaMiddleware({ expectedAction: "checkout", required: false }),
  contact: createCaptchaMiddleware({ expectedAction: "contact" }),
};

export default verifyCaptchaMiddleware;
