// ═══════════════════════════════════════════════════════════════════════════════
// STORESGO INGREDIENT SITEMAP ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  ingredients,
  ingredientCategories,
  cuisines,
} from "../data/ingredients-data.js";

export default async function sitemapIngredientRoutes(app: FastifyInstance) {
  
  app.get("/ingredients.xml", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const baseUrl = "https://storesgo.com";
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/ingredients</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
      
      // Individual ingredient pages
      for (const ingredient of ingredients) {
        xml += `
  <url>
    <loc>${baseUrl}/ingredients/${ingredient.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
      
      // Category pages
      for (const category of ingredientCategories) {
        xml += `
  <url>
    <loc>${baseUrl}/ingredients/category/${category.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
      
      // Cuisine pages
      for (const cuisine of cuisines) {
        xml += `
  <url>
    <loc>${baseUrl}/ingredients/cuisine/${cuisine.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
      
      xml += `
</urlset>`;
      
      reply.header("Content-Type", "application/xml");
      return reply.send(xml);
    } catch (error) {
      console.error("Ingredient sitemap error:", error);
      return reply.status(500).send("Failed to generate sitemap");
    }
  });
}
