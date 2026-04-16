/**
 * Seller Bulk Upload Routes
 * CSV/XLSX product import for sellers
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import multipart from "@fastify/multipart";
import { authenticateSeller } from "../../middleware/authSeller.js";
import { rateLimiters } from "../../plugins/rateLimit.js";
import {
  parseCSV,
  validateHeaders,
  importProducts,
  generateCSVTemplate,
  getSupportedFormats,
} from "../../services/bulkUpload.service.js";

export default async function sellerBulkUploadRoutes(app: FastifyInstance) {
  // Register multipart for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
      files: 1,
    },
  });

  // ----------------------------------------------------------
  // 📤 BULK UPLOAD PRODUCTS (Seller)
  // ----------------------------------------------------------
  app.post(
    "/",
    { preHandler: [rateLimiters.bulkUpload, authenticateSeller] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user || !user.sellerId) {
          return reply.status(403).send({
            ok: false,
            error: "Seller authentication required",
          });
        }

        const sellerId = user.sellerId;

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

        // Read and parse file
        const buffer = await data.toBuffer();
        const content = buffer.toString("utf-8");

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

        // Get import options
        const options = {
          skipDuplicates: (request.query as any).skipDuplicates !== "false",
          updateExisting: (request.query as any).updateExisting === "true",
        };

        // Import products for this seller
        const result = await importProducts(parsed.rows, sellerId, options);

        app.log.info({
          msg: "Seller bulk upload completed",
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
        app.log.error({ err }, "Seller bulk upload failed");
        return reply.status(500).send({
          ok: false,
          error: "Bulk upload failed",
          details: err.message,
        });
      }
    }
  );

  // ----------------------------------------------------------
  // 📥 DOWNLOAD CSV TEMPLATE (Seller)
  // ----------------------------------------------------------
  app.get(
    "/template",
    { preHandler: authenticateSeller },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const template = generateCSVTemplate();
      
      reply.header("Content-Type", "text/csv");
      reply.header("Content-Disposition", "attachment; filename=product_import_template.csv");
      
      return reply.send(template);
    }
  );

  // ----------------------------------------------------------
  // 📋 GET SUPPORTED FORMATS INFO (Seller)
  // ----------------------------------------------------------
  app.get(
    "/formats",
    { preHandler: authenticateSeller },
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
            "categorySlug",
            "status",
            "isActive",
            "shippingWeightGrams",
            "shippingMode",
            "freeShipping",
          ],
        },
      });
    }
  );

  // ----------------------------------------------------------
  // ✅ VALIDATE FILE WITHOUT IMPORTING (Seller)
  // ----------------------------------------------------------
  app.post(
    "/validate",
    { preHandler: [rateLimiters.bulkUpload, authenticateSeller] },
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

  app.log.info("📤 Seller bulk upload routes registered");
}

