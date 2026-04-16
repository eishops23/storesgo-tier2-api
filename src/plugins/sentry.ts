// =============================================================================
// 🔴 SENTRY ERROR TRACKING PLUGIN — STORESGO BACKEND
// Integrates Sentry for error tracking and performance monitoring
// =============================================================================

import type { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";

// Sentry SDK - will be imported dynamically to handle missing dependency gracefully
let Sentry: any = null;

interface SentryPluginOptions {
  dsn?: string;
  environment?: string;
  tracesSampleRate?: number;
  release?: string;
}

const sentryPlugin: FastifyPluginAsync<SentryPluginOptions> = async (
  app: FastifyInstance,
  options: SentryPluginOptions
) => {
  const dsn = options.dsn || process.env.SENTRY_DSN;
  
  // Skip if no DSN configured
  if (!dsn) {
    app.log.warn("⚠️ Sentry DSN not configured, error tracking disabled");
    
    // Add no-op methods for compatibility
    app.decorate("sentry", {
      captureException: (error: Error) => { app.log.error(error); return undefined; },
      captureMessage: (message: string) => { app.log.info(message); return undefined; },
      setUser: () => {},
      setContext: () => {},
      setTag: () => {},
    });
    return;
  }

  try {
    // Dynamic import to handle missing dependency
    Sentry = await import("@sentry/node");

    // Initialize Sentry
    Sentry.init({
      dsn,
      environment: options.environment || process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
      release: options.release || process.env.npm_package_version || "unknown",
      
      // Performance monitoring
      tracesSampleRate: options.tracesSampleRate || parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
      
      // Configure integrations
      integrations: [
        // HTTP integration for tracing outgoing requests
        Sentry.httpIntegration({ tracing: true }),
        // Node-specific integrations
        Sentry.onUncaughtExceptionIntegration(),
        Sentry.onUnhandledRejectionIntegration(),
      ],

      // Filter sensitive data
      beforeSend(event: any) {
        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
          delete event.request.headers["x-api-key"];
        }
        
        // Remove sensitive data from breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map((crumb: any) => {
            if (crumb.data?.password) {
              crumb.data.password = "[FILTERED]";
            }
            return crumb;
          });
        }
        
        return event;
      },

      // Additional options
      attachStacktrace: true,
      maxBreadcrumbs: 100,
      debug: process.env.NODE_ENV === "development",
    });

    app.log.info("✅ Sentry initialized successfully");

    // Decorate fastify instance with Sentry methods
    app.decorate("sentry", {
      captureException: Sentry.captureException.bind(Sentry),
      captureMessage: Sentry.captureMessage.bind(Sentry),
      setUser: Sentry.setUser.bind(Sentry),
      setContext: Sentry.setContext.bind(Sentry),
      setTag: Sentry.setTag.bind(Sentry),
      startSpan: Sentry.startSpan?.bind(Sentry),
      flush: Sentry.flush.bind(Sentry),
    });

    // Request hook to set user context and start transaction
    app.addHook("onRequest", async (request: FastifyRequest) => {
      // Set request context
      Sentry.setContext("request", {
        method: request.method,
        url: request.url,
        query: request.query,
        ip: request.ip,
        userAgent: request.headers["user-agent"],
      });

      // Extract user from JWT if available
      const user = (request as any).user;
      if (user) {
        Sentry.setUser({
          id: user.id || user.userId,
          email: user.email,
          role: user.role,
        });
      }

      // Add transaction name
      Sentry.setTag("route", `${request.method} ${request.routeOptions?.url || request.url}`);
    });

    // Response hook to add response info
    app.addHook("onResponse", async (request: FastifyRequest, reply: FastifyReply) => {
      Sentry.setContext("response", {
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      });
    });

    // Error handler to capture exceptions
    app.addHook("onError", async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
      // Don't report 4xx errors to Sentry (they're client errors)
      const statusCode = (error as any).statusCode || 500;
      if (statusCode >= 500) {
        Sentry.captureException(error, {
          extra: {
            method: request.method,
            url: request.url,
            query: request.query,
            body: request.body,
            params: request.params,
            headers: {
              host: request.headers.host,
              "user-agent": request.headers["user-agent"],
              "content-type": request.headers["content-type"],
            },
          },
          tags: {
            route: `${request.method} ${request.routeOptions?.url || request.url}`,
            statusCode: statusCode.toString(),
          },
        });
      }
    });

    // Graceful shutdown - flush events
    app.addHook("onClose", async () => {
      app.log.info("🔴 Flushing Sentry events...");
      await Sentry.flush(2000);
    });

  } catch (error: any) {
    app.log.error({ err: error }, "❌ Failed to initialize Sentry");
    
    // Add no-op methods for compatibility
    app.decorate("sentry", {
      captureException: (err: Error) => { app.log.error(err); return undefined; },
      captureMessage: (msg: string) => { app.log.info(msg); return undefined; },
      setUser: () => {},
      setContext: () => {},
      setTag: () => {},
    });
  }
};

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    sentry: {
      captureException: (error: Error, extra?: any) => string | undefined;
      captureMessage: (message: string, level?: any) => string | undefined;
      setUser: (user: { id?: string; email?: string; role?: string } | null) => void;
      setContext: (name: string, context: Record<string, any>) => void;
      setTag: (key: string, value: string) => void;
      startSpan?: (options: any, callback: any) => any;
      flush?: (timeout?: number) => Promise<boolean>;
    };
  }
}

export default fp(sentryPlugin, {
  name: "sentry",
  fastify: "5.x",
});

// =============================================================================
// Test Route for Sentry
// =============================================================================
export function registerSentryTestRoute(app: FastifyInstance) {
  // Only in non-production for testing
  if (process.env.NODE_ENV === "production") return;

  app.get("/api/debug/sentry-test", async (request, reply) => {
    // Test error capture
    const testError = new Error("Test error from Sentry integration");
    app.sentry.captureException(testError);
    
    return {
      ok: true,
      message: "Test error sent to Sentry",
      timestamp: new Date().toISOString(),
    };
  });

  app.get("/api/debug/sentry-throw", async (request, reply) => {
    // Throw an actual error to test error handling
    throw new Error("Intentional test error for Sentry");
  });
}

