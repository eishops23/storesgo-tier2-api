// ==========================================================
// STORESGO ADMIN HOMEPAGE ROUTES — TASK GROUP 3
// Admin endpoints for managing homepage configuration
// ==========================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAdmin } from "../../utils/requireAdmin.js";
import {
  updateHomepageConfig,
  getHomepageConfig,
  HomepageConfigUpdate,
} from "../../services/homepage.service.js";

// Validation helper
function validateHomepageConfig(body: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate string fields (optional, but if provided must be string or null)
  const stringFields = [
    "heroTitle",
    "heroSubtitle",
    "heroImageUrl",
    "blogSectionTitle",
    "ctaTitle",
    "ctaSubtitle",
    "ctaButtonLabel",
    "ctaButtonUrl",
    "footerAboutHtml",
  ];

  for (const field of stringFields) {
    if (body[field] !== undefined && body[field] !== null && typeof body[field] !== "string") {
      errors.push(`${field} must be a string or null`);
    }
  }

  // Validate array fields
  if (body.featuredCategoryIds !== undefined) {
    if (!Array.isArray(body.featuredCategoryIds)) {
      errors.push("featuredCategoryIds must be an array of numbers");
    } else if (!body.featuredCategoryIds.every((id: any) => typeof id === "number" && Number.isInteger(id))) {
      errors.push("featuredCategoryIds must contain only integers");
    }
  }

  if (body.featuredProductIds !== undefined) {
    if (!Array.isArray(body.featuredProductIds)) {
      errors.push("featuredProductIds must be an array of numbers");
    } else if (!body.featuredProductIds.every((id: any) => typeof id === "number" && Number.isInteger(id))) {
      errors.push("featuredProductIds must contain only integers");
    }
  }

  // footerLinksJson and footerSocialJson can be any JSON-serializable value
  // No specific validation needed

  return { valid: errors.length === 0, errors };
}

export default async function adminHomepageRoutes(app: FastifyInstance) {
  /**
   * GET /api/admin/homepage
   * Get current homepage configuration
   */
  app.get(
    "/",
    { preHandler: requireAdmin },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const config = await getHomepageConfig();
      return reply.send({ ok: true, data: config });
    }
  );

  /**
   * PUT /api/admin/homepage
   * Update homepage configuration (hero, featured content, CTA, footer)
   *
   * Body can include:
   * - heroTitle: string | null
   * - heroSubtitle: string | null
   * - heroImageUrl: string | null
   * - featuredCategoryIds: number[]
   * - featuredProductIds: number[]
   * - blogSectionTitle: string | null
   * - ctaTitle: string | null
   * - ctaSubtitle: string | null
   * - ctaButtonLabel: string | null
   * - ctaButtonUrl: string | null
   * - footerAboutHtml: string | null
   * - footerLinksJson: any (JSON object/array)
   * - footerSocialJson: any (JSON object/array)
   */
  app.put(
    "/",
    { preHandler: requireAdmin },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as any;

      // Validate input
      const validation = validateHomepageConfig(body);
      if (!validation.valid) {
        return reply.status(400).send({
          ok: false,
          error: "Validation failed",
          details: validation.errors,
        });
      }

      // Map body to HomepageConfigUpdate
      const configUpdate: HomepageConfigUpdate = {};

      if (body.heroTitle !== undefined) configUpdate.heroTitle = body.heroTitle;
      if (body.heroSubtitle !== undefined) configUpdate.heroSubtitle = body.heroSubtitle;
      if (body.heroImageUrl !== undefined) configUpdate.heroImageUrl = body.heroImageUrl;
      if (body.featuredCategoryIds !== undefined) configUpdate.featuredCategoryIds = body.featuredCategoryIds;
      if (body.featuredProductIds !== undefined) configUpdate.featuredProductIds = body.featuredProductIds;
      if (body.blogSectionTitle !== undefined) configUpdate.blogSectionTitle = body.blogSectionTitle;
      if (body.ctaTitle !== undefined) configUpdate.ctaTitle = body.ctaTitle;
      if (body.ctaSubtitle !== undefined) configUpdate.ctaSubtitle = body.ctaSubtitle;
      if (body.ctaButtonLabel !== undefined) configUpdate.ctaButtonLabel = body.ctaButtonLabel;
      if (body.ctaButtonUrl !== undefined) configUpdate.ctaButtonUrl = body.ctaButtonUrl;
      if (body.footerAboutHtml !== undefined) configUpdate.footerAboutHtml = body.footerAboutHtml;
      if (body.footerLinksJson !== undefined) configUpdate.footerLinksJson = body.footerLinksJson;
      if (body.footerSocialJson !== undefined) configUpdate.footerSocialJson = body.footerSocialJson;

      try {
        await updateHomepageConfig(configUpdate);

        // Get updated config
        const config = await getHomepageConfig();

        return reply.send({
          ok: true,
          data: config,
          message: "Homepage configuration updated successfully",
        });
      } catch (error: any) {
        console.error("Failed to update homepage config:", error);
        return reply.status(500).send({
          ok: false,
          error: "Failed to update homepage configuration",
        });
      }
    }
  );

  app.log.info("📄 Admin homepage routes registered");
}

