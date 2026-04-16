/**
 * Bulk Upload Routes for Admin and Sellers
 * CSV/XLSX product import endpoints
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import multipart from "@fastify/multipart";
import { requireAdmin } from "../../utils/requireAdmin.js";
import { rateLimiters } from "../../plugins/rateLimit.js";
import {
  parseCSV,
  validateHeaders,
  importProducts,
  generateCSVTemplate,
  getSupportedFormats,
  type BulkImportResult,
} from "../../services/bulkUpload.service.js";

// Interface for multipart file
interface MultipartFile {
  filename: string;
  mimetype: string;
  file: NodeJS.ReadableStream;
  toBuffer(): Promise<Buffer>;
}

export default async function adminBulkUploadRoutes(app: FastifyInstance) {
  // Register multipart for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
      files: 1, // Single file only
    },
  });

  // ----------------------------------------------------------
  // 📤 BULK UPLOAD PRODUCTS (Admin)
  // ----------------------------------------------------------
  app.post(
    "/products/bulk",
    { preHandler: [rateLimiters.bulkUpload, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Get admin info for sellerId (admin can upload for any seller)
        const queryParams = request.query as { sellerId?: string };
        let sellerId = queryParams.sellerId ? parseInt(queryParams.sellerId, 10) : null;

        // If no sellerId provided, use a default admin seller (ID 1)
        if (!sellerId) {
          sellerId = 1; // Default to first seller for admin uploads
        }

        // Parse multipart data
        const data = await request.file();
        if (!data) {
          return reply.status(400).send({
            ok: false,
            error: "No file uploaded",
            code: "NO_FILE",
          });
        }

        // Validate file type
        const allowedTypes = [
          "text/csv",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];
        
        if (!allowedTypes.includes(data.mimetype)) {
          return reply.status(400).send({
            ok: false,
            error: "Invalid file type. Supported formats: CSV, XLSX",
            code: "INVALID_FILE_TYPE",
            supportedFormats: getSupportedFormats(),
          });
        }

        // Read file content
        const buffer = await data.toBuffer();
        const content = buffer.toString("utf-8");

        // Parse CSV
        let parsed;
        try {
          parsed = parseCSV(content);
        } catch (err: any) {
          return reply.status(400).send({
            ok: false,
            error: `Failed to parse file: ${err.message}`,
            code: "PARSE_ERROR",
          });
        }

        // Validate headers
        const headerValidation = validateHeaders(parsed.headers);
        if (!headerValidation.valid) {
          return reply.status(400).send({
            ok: false,
            error: "Invalid CSV headers",
            code: "INVALID_HEADERS",
            errors: headerValidation.errors,
            warnings: headerValidation.warnings,
          });
        }

        // Get import options from query
        const options = {
          skipDuplicates: (request.query as any).skipDuplicates !== "false",
          updateExisting: (request.query as any).updateExisting === "true",
        };

        // Import products
        const result = await importProducts(parsed.rows, sellerId, options);

        app.log.info({
          msg: "Bulk upload completed",
          sellerId,
          filename: data.filename,
          result: {
            totalRows: result.totalRows,
            imported: result.imported,
            failed: result.failed,
            skipped: result.skipped,
          },
        });

        return reply.send({
          ok: result.success,
          data: result,
          message: result.success
            ? `Successfully imported ${result.imported} products`
            : `Import completed with ${result.failed} errors`,
        });
      } catch (err: any) {
        app.log.error({ err }, "Bulk upload failed");
        return reply.status(500).send({
          ok: false,
          error: "Bulk upload failed",
          details: err.message,
        });
      }
    }
  );

  // ----------------------------------------------------------
  // 📥 DOWNLOAD CSV TEMPLATE
  // ----------------------------------------------------------
  app.get(
    "/products/bulk/template",
    { preHandler: requireAdmin },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const template = generateCSVTemplate();
      
      reply.header("Content-Type", "text/csv");
      reply.header("Content-Disposition", "attachment; filename=product_import_template.csv");
      
      return reply.send(template);
    }
  );

  // ----------------------------------------------------------
  // 📋 GET SUPPORTED FORMATS INFO
  // ----------------------------------------------------------
  app.get(
    "/products/bulk/formats",
    { preHandler: requireAdmin },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        ok: true,
        data: {
          formats: getSupportedFormats(),
          maxFileSize: "10MB",
          requiredColumns: ["name", "priceCents (or price)"],
          optionalColumns: [
            "description",
            "sku",
            "externalId",
            "imageUrl",
            "categoryId",
            "categorySlug",
            "categoryName",
            "status",
            "isActive",
            "shippingWeightGrams",
            "shippingMode",
            "flatRateAmount",
            "freeShipping",
          ],
        },
      });
    }
  );

  // ----------------------------------------------------------
  // ✅ VALIDATE FILE WITHOUT IMPORTING
  // ----------------------------------------------------------
  app.post(
    "/products/bulk/validate",
    { preHandler: [rateLimiters.bulkUpload, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = await request.file();
        if (!data) {
          return reply.status(400).send({
            ok: false,
            error: "No file uploaded",
          });
        }

        const buffer = await data.toBuffer();
        const content = buffer.toString("utf-8");

        let parsed;
        try {
          parsed = parseCSV(content);
        } catch (err: any) {
          return reply.status(400).send({
            ok: false,
            error: `Failed to parse file: ${err.message}`,
          });
        }

        const headerValidation = validateHeaders(parsed.headers);

        return reply.send({
          ok: headerValidation.valid,
          data: {
            valid: headerValidation.valid,
            headers: parsed.headers,
            rowCount: parsed.rows.length,
            errors: headerValidation.errors,
            warnings: headerValidation.warnings,
          },
        });
      } catch (err: any) {
        return reply.status(500).send({
          ok: false,
          error: "Validation failed",
          details: err.message,
        });
      }
    }
  );

  app.log.info("📤 Admin bulk upload routes registered");
}

