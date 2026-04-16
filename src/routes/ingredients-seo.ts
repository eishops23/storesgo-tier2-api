// ═══════════════════════════════════════════════════════════════════════════════
// STORESGO INGREDIENT ENCYCLOPEDIA API ROUTES
// SEO-optimized endpoints for ingredient pages
// ═══════════════════════════════════════════════════════════════════════════════

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  ingredients,
  ingredientCategories,
  cuisines,
  getIngredientBySlug,
  getIngredientsByCategory,
  getIngredientsByCuisine,
  getCuisineBySlug,
  getCategoryBySlug,
  getRelatedIngredients,
  getIngredientStats,
  searchIngredients,
} from "../data/ingredients-data.js";

export default async function ingredientSeoRoutes(app: FastifyInstance) {
  
  // ─────────────────────────────────────────────────────────────────────────
  // HUB PAGE - /ingredients
  // ─────────────────────────────────────────────────────────────────────────
  
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = getIngredientStats();
      
      return reply.send({
        ok: true,
        data: {
          title: "Ingredient Encyclopedia | StoresGo",
          description: "Discover authentic ethnic ingredients from around the world. Learn about Caribbean, Latin American, Asian, and African ingredients—what they are, how to use them, and where to buy them.",
          stats,
          categories: ingredientCategories,
          cuisines: cuisines,
          featuredIngredients: ingredients.slice(0, 12),
        }
      });
    } catch (error) {
      console.error("Ingredient hub error:", error);
      return reply.status(500).send({ ok: false, error: "Failed to load ingredients" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // INDIVIDUAL INGREDIENT PAGE - /ingredients/:slug
  // ─────────────────────────────────────────────────────────────────────────
  
  app.get("/:slug", async (
    request: FastifyRequest<{ Params: { slug: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { slug } = request.params;
      const ingredient = getIngredientBySlug(slug);
      
      if (!ingredient) {
        return reply.status(404).send({ 
          ok: false, 
          error: "Ingredient not found" 
        });
      }
      
      const relatedIngredients = getRelatedIngredients(ingredient);
      const category = getCategoryBySlug(ingredient.category);
      const ingredientCuisines = ingredient.cuisines.map(c => getCuisineBySlug(c)).filter(Boolean);
      
      // Generate SEO metadata
      const seoTitle = `${ingredient.name} - What It Is, How to Use It & Where to Buy | StoresGo`;
      const seoDescription = `Learn everything about ${ingredient.name}: ${ingredient.description.slice(0, 150)}... Find substitutes, storage tips, and buy authentic ${ingredient.name} online.`;
      
      // Generate structured data for SEO
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": `${ingredient.name} - Complete Guide`,
        "description": seoDescription,
        "author": {
          "@type": "Organization",
          "name": "StoresGo"
        },
        "publisher": {
          "@type": "Organization",
          "name": "StoresGo",
          "url": "https://storesgo.com"
        },
        "about": {
          "@type": "Thing",
          "name": ingredient.name,
          "alternateName": ingredient.alternateName || [],
          "description": ingredient.description
        }
      };
      
      // Generate FAQ schema for "People Also Ask" optimization
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": `What is ${ingredient.name}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": ingredient.description
            }
          },
          {
            "@type": "Question",
            "name": `What can I substitute for ${ingredient.name}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": ingredient.substitutes.length > 0 
                ? `Common substitutes for ${ingredient.name} include: ${ingredient.substitutes.join(", ")}.`
                : `There is no true substitute for ${ingredient.name}'s unique flavor.`
            }
          },
          {
            "@type": "Question",
            "name": `How do you use ${ingredient.name}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `${ingredient.name} is commonly used in: ${ingredient.commonUses.join(", ")}.`
            }
          },
          {
            "@type": "Question",
            "name": `How do you store ${ingredient.name}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": ingredient.storageInfo
            }
          }
        ]
      };
      
      return reply.send({
        ok: true,
        data: {
          ingredient,
          category,
          cuisines: ingredientCuisines,
          relatedIngredients,
          seo: {
            title: seoTitle,
            description: seoDescription,
            structuredData,
            faqSchema
          }
        }
      });
    } catch (error) {
      console.error("Ingredient page error:", error);
      return reply.status(500).send({ ok: false, error: "Failed to load ingredient" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CATEGORY PAGE - /ingredients/category/:category
  // ─────────────────────────────────────────────────────────────────────────
  
  app.get("/category/:category", async (
    request: FastifyRequest<{ Params: { category: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { category } = request.params;
      const categoryData = getCategoryBySlug(category);
      
      if (!categoryData) {
        return reply.status(404).send({ 
          ok: false, 
          error: "Category not found" 
        });
      }
      
      const categoryIngredients = getIngredientsByCategory(category);
      
      return reply.send({
        ok: true,
        data: {
          category: categoryData,
          ingredients: categoryIngredients,
          totalCount: categoryIngredients.length,
          seo: {
            title: `${categoryData.name} for Cooking | Ethnic Ingredient Guide | StoresGo`,
            description: `Explore ${categoryData.name.toLowerCase()} from around the world. ${categoryData.description} Shop authentic ingredients online.`
          }
        }
      });
    } catch (error) {
      console.error("Category page error:", error);
      return reply.status(500).send({ ok: false, error: "Failed to load category" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CUISINE PAGE - /ingredients/cuisine/:cuisine
  // ─────────────────────────────────────────────────────────────────────────
  
  app.get("/cuisine/:cuisine", async (
    request: FastifyRequest<{ Params: { cuisine: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { cuisine } = request.params;
      const cuisineData = getCuisineBySlug(cuisine);
      
      if (!cuisineData) {
        return reply.status(404).send({ 
          ok: false, 
          error: "Cuisine not found" 
        });
      }
      
      const cuisineIngredients = getIngredientsByCuisine(cuisine);
      
      return reply.send({
        ok: true,
        data: {
          cuisine: cuisineData,
          ingredients: cuisineIngredients,
          totalCount: cuisineIngredients.length,
          seo: {
            title: `${cuisineData.name} Ingredients - Essential ${cuisineData.name} Cooking Ingredients | StoresGo`,
            description: `Discover essential ${cuisineData.name} ingredients. Learn about authentic ${cuisineData.name} spices, sauces, and specialty items. Shop ${cuisineData.name} groceries online.`
          }
        }
      });
    } catch (error) {
      console.error("Cuisine page error:", error);
      return reply.status(500).send({ ok: false, error: "Failed to load cuisine" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SEARCH ENDPOINT
  // ─────────────────────────────────────────────────────────────────────────
  
  app.get("/search", async (
    request: FastifyRequest<{ Querystring: { q?: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { q } = request.query;
      
      if (!q || q.length < 2) {
        return reply.send({
          ok: true,
          data: {
            query: q || "",
            results: [],
            totalCount: 0
          }
        });
      }
      
      const results = searchIngredients(q);
      
      return reply.send({
        ok: true,
        data: {
          query: q,
          results,
          totalCount: results.length
        }
      });
    } catch (error) {
      console.error("Search error:", error);
      return reply.status(500).send({ ok: false, error: "Search failed" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SITEMAP DATA
  // ─────────────────────────────────────────────────────────────────────────
  
  app.get("/sitemap/ingredients", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const baseUrl = "https://storesgo.com";
      const urls: any[] = [];
      
      // Hub page
      urls.push({
        loc: `${baseUrl}/ingredients`,
        changefreq: "weekly",
        priority: 0.9
      });
      
      // Individual ingredient pages
      for (const ingredient of ingredients) {
        urls.push({
          loc: `${baseUrl}/ingredients/${ingredient.slug}`,
          changefreq: "monthly",
          priority: 0.8
        });
      }
      
      // Category pages
      for (const category of ingredientCategories) {
        urls.push({
          loc: `${baseUrl}/ingredients/category/${category.slug}`,
          changefreq: "weekly",
          priority: 0.7
        });
      }
      
      // Cuisine pages
      for (const cuisine of cuisines) {
        urls.push({
          loc: `${baseUrl}/ingredients/cuisine/${cuisine.slug}`,
          changefreq: "weekly",
          priority: 0.7
        });
      }
      
      return reply.send({
        ok: true,
        data: {
          urls,
          totalCount: urls.length
        }
      });
    } catch (error) {
      console.error("Sitemap error:", error);
      return reply.status(500).send({ ok: false, error: "Failed to generate sitemap" });
    }
  });
}
