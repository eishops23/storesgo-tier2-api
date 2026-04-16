// ═══════════════════════════════════════════════════════════════════════════════
// STORESGO LOCATION SITEMAP ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  cities,
  states,
  cuisines,
  getRelevantCombinations,
} from "../data/location-seo-data.js";

export default async function sitemapLocationRoutes(app: FastifyInstance) {
  
  // Main location sitemap
  app.get("/locations.xml", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const baseUrl = "https://storesgo.com";
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/near</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
      
      // Cuisine hub pages (28)
      for (const cuisine of cuisines) {
        xml += `
  <url>
    <loc>${baseUrl}/near/${cuisine.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
      
      // State pages (28 cuisines × 30 states = 840)
      for (const cuisine of cuisines) {
        for (const state of states) {
          xml += `
  <url>
    <loc>${baseUrl}/near/${cuisine.slug}/${state.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        }
      }
      
      // City pages - only relevant combinations
      const relevantCombos = getRelevantCombinations();
      for (const { city, cuisine } of relevantCombos) {
        xml += `
  <url>
    <loc>${baseUrl}/near/${cuisine.slug}/${city.stateSlug}/${city.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
      }
      
      xml += `
</urlset>`;
      
      reply.header("Content-Type", "application/xml");
      return reply.send(xml);
    } catch (error) {
      console.error("Location sitemap error:", error);
      return reply.status(500).send("Failed to generate sitemap");
    }
  });
  
  // Sitemap index that splits into multiple sitemaps
  app.get("/locations-index.xml", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const baseUrl = "https://storesgo.com";
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap/locations.xml</loc>
  </sitemap>
</sitemapindex>`;
      
      reply.header("Content-Type", "application/xml");
      return reply.send(xml);
    } catch (error) {
      console.error("Sitemap index error:", error);
      return reply.status(500).send("Failed to generate sitemap index");
    }
  });
}
