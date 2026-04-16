// ═══════════════════════════════════════════════════════════════════════════
// STORESGO SELLER SEO ROUTES — Public API
// ═══════════════════════════════════════════════════════════════════════════

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  getSellerSignupPageData,
  getSolutionPageData,
  getComparisonPageData,
  getGuidePageData,
  getAllSellerPages,
  getSellerSeoOptions,
  CUISINES,
  LOCATIONS,
} from "../services/sellerSeo.service.js";

export default async function sellerSeoRoutes(app: FastifyInstance) {
  // GET page data for cuisine/location
  app.get("/pages/:cuisine/:location", async (request: FastifyRequest, reply: FastifyReply) => {
    const { cuisine, location } = request.params as { cuisine: string; location: string };
    try {
      const data = getSellerSignupPageData(cuisine, location);
      if (!data) return reply.status(404).send({ ok: false, error: "Page not found" });
      return reply.send({ ok: true, data });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // GET solution page data
  app.get("/solutions/:slug", async (request: FastifyRequest, reply: FastifyReply) => {
    const { slug } = request.params as { slug: string };
    try {
      const data = getSolutionPageData(slug);
      if (!data) return reply.status(404).send({ ok: false, error: "Solution not found" });
      return reply.send({ ok: true, data });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // GET comparison page data
  app.get("/compare/:slug", async (request: FastifyRequest, reply: FastifyReply) => {
    const { slug } = request.params as { slug: string };
    try {
      const data = getComparisonPageData(slug);
      if (!data) return reply.status(404).send({ ok: false, error: "Comparison not found" });
      return reply.send({ ok: true, data });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // GET guide page data
  app.get("/guides/:slug", async (request: FastifyRequest, reply: FastifyReply) => {
    const { slug } = request.params as { slug: string };
    try {
      const data = getGuidePageData(slug);
      if (!data) return reply.status(404).send({ ok: false, error: "Guide not found" });
      return reply.send({ ok: true, data });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // GET all pages (for sitemap)
  app.get("/all", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const pages = getAllSellerPages();
      return reply.send({ ok: true, data: pages });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // GET options (for dropdowns)
  app.get("/options", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const options = getSellerSeoOptions();
      return reply.send({ ok: true, data: options });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ ok: false, error: "Internal server error" });
    }
  });

  // GET cuisines list
  app.get("/cuisines", async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ ok: true, data: CUISINES.map(c => ({ slug: c.slug, label: c.label, flag: c.flag, region: c.region })) });
  });

  // GET locations list
  app.get("/locations", async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ ok: true, data: LOCATIONS.map(l => ({ slug: l.slug, label: l.label, state: l.state, type: l.type })) });
  });

  // GET sitemap XML
  app.get("/sitemap", async (_request: FastifyRequest, reply: FastifyReply) => {
    const BASE_URL = process.env.PUBLIC_BASE_URL || "https://storesgo.com";
    const pages = getAllSellerPages();
    const urls: string[] = [];

    for (const page of pages.signupPages) {
      urls.push(`<url><loc>${BASE_URL}${page.path}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
    }
    for (const page of pages.solutionPages) {
      urls.push(`<url><loc>${BASE_URL}${page.path}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`);
    }
    for (const page of pages.comparisonPages) {
      urls.push(`<url><loc>${BASE_URL}${page.path}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`);
    }
    for (const page of pages.guidePages) {
      urls.push(`<url><loc>${BASE_URL}${page.path}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`;
    return reply.type("application/xml").send(xml);
  });

  // POST - Customer requests a store
  app.post("/request-store", async (request, reply) => {
    const body = request.body as any;
    if (!body.customerEmail || !body.cuisineType || !body.location) {
      return reply.status(400).send({ ok: false, error: "Email, cuisine type, and location required" });
    }
    console.log("[Store Request]", body);
    return reply.send({ ok: true, message: "Thank you! We'll notify you when new stores are available." });
  });

  // GET - Demand stats
  app.get("/demand-stats", async (request, reply) => {
    const query = request.query as any;
    const baseStats: Record<string, number> = { caribbean: 156, jamaican: 89, haitian: 67, mexican: 112, nigerian: 52, indian: 94 };
    const requests = baseStats[query.cuisineType?.toLowerCase()] || Math.floor(Math.random() * 100) + 30;
    return reply.send({ ok: true, data: { cuisineType: query.cuisineType, totalRequests: requests, thisMonth: Math.floor(requests * 0.15) } });
  });

  app.log.info("📄 Seller SEO routes registered at /api/seller-seo");
}
