// ═══════════════════════════════════════════════════════════════════════════════
// STORESGO RECIPE SEO API ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  recipes,
  cuisines,
  recipeCategories,
  getRecipeBySlug,
  getRecipesByCuisine,
  getRecipesByCategory,
  getQuickRecipes,
  getFeaturedRecipes,
  searchRecipes,
  getRecipesByTag,
  getRecipesByIngredient,
  getRelatedRecipes,
  getCuisineBySlug,
  getCategoryBySlug,
  getRecipeStats,
} from "../data/recipes-data.js";

export default async function recipesSeoRoutes(app: FastifyInstance) {
  
  // ─────────────────────────────────────────────────────────────────────────
  // HUB PAGE - /recipes
  // ─────────────────────────────────────────────────────────────────────────
  
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = getRecipeStats();
      const featured = getFeaturedRecipes();
      
      return reply.send({
        ok: true,
        data: {
          title: "Authentic Ethnic Recipes | StoresGo",
          description: "Discover authentic recipes from around the world. Learn how to make Caribbean, Latin, Asian, and African dishes at home with our step-by-step guides.",
          stats,
          cuisines,
          categories: recipeCategories,
          featuredRecipes: featured.slice(0, 12),
        }
      });
    } catch (error) {
      console.error("Recipe hub error:", error);
      return reply.status(500).send({ ok: false, error: "Failed to load recipes" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // INDIVIDUAL RECIPE PAGE - /recipes/:slug
  // ─────────────────────────────────────────────────────────────────────────
  
  app.get("/:slug", async (
    request: FastifyRequest<{ Params: { slug: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { slug } = request.params;
      const recipe = getRecipeBySlug(slug);
      
      if (!recipe) {
        return reply.status(404).send({ ok: false, error: "Recipe not found" });
      }
      
      const relatedRecipes = getRelatedRecipes(recipe);
      const cuisine = getCuisineBySlug(recipe.cuisine);
      const category = getCategoryBySlug(recipe.category);
      
      // Generate Schema.org Recipe structured data
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Recipe",
        "name": recipe.name,
        "description": recipe.description,
        "image": `https://storesgo.com/images/recipes/${recipe.slug}.jpg`,
        "author": {
          "@type": "Organization",
          "name": "StoresGo"
        },
        "prepTime": `PT${recipe.prepTime}M`,
        "cookTime": `PT${recipe.cookTime}M`,
        "totalTime": `PT${recipe.prepTime + recipe.cookTime}M`,
        "recipeYield": `${recipe.servings} servings`,
        "recipeCategory": recipe.category,
        "recipeCuisine": cuisine?.name || recipe.cuisine,
        "keywords": recipe.tags.join(", "),
        "recipeIngredient": recipe.ingredients,
        "recipeInstructions": recipe.instructions.map((step, i) => ({
          "@type": "HowToStep",
          "position": i + 1,
          "text": step
        }))
      };
      
      return reply.send({
        ok: true,
        data: {
          recipe,
          cuisine,
          category,
          relatedRecipes,
          seo: {
            title: `${recipe.name} Recipe | How to Make ${recipe.name} | StoresGo`,
            description: `Learn how to make authentic ${recipe.name}. ${recipe.description.slice(0, 120)}... Step-by-step instructions, tips, and ingredients list.`,
            structuredData
          }
        }
      });
    } catch (error) {
      console.error("Recipe page error:", error);
      return reply.status(500).send({ ok: false, error: "Failed to load recipe" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CUISINE RECIPES - /recipes/cuisine/:cuisine
  // ─────────────────────────────────────────────────────────────────────────
  
  app.get("/cuisine/:cuisine", async (
    request: FastifyRequest<{ Params: { cuisine: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { cuisine: cuisineSlug } = request.params;
      const cuisine = getCuisineBySlug(cuisineSlug);
      
      if (!cuisine) {
        return reply.status(404).send({ ok: false, error: "Cuisine not found" });
      }
      
      const cuisineRecipes = getRecipesByCuisine(cuisineSlug);
      
      return reply.send({
        ok: true,
        data: {
          cuisine,
          recipes: cuisineRecipes,
          totalCount: cuisineRecipes.length,
          seo: {
            title: `${cuisine.name} Recipes | Authentic ${cuisine.name} Dishes | StoresGo`,
            description: `Discover authentic ${cuisine.name} recipes. ${cuisine.description} Learn to cook ${cuisine.signatureDishes.slice(0, 3).join(", ")} and more.`
          }
        }
      });
    } catch (error) {
      console.error("Cuisine recipes error:", error);
      return reply.status(500).send({ ok: false, error: "Failed to load cuisine recipes" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CATEGORY RECIPES - /recipes/category/:category
  // ─────────────────────────────────────────────────────────────────────────
  
  app.get("/category/:category", async (
    request: FastifyRequest<{ Params: { category: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { category: categorySlug } = request.params;
      const category = getCategoryBySlug(categorySlug);
      
      if (!category) {
        return reply.status(404).send({ ok: false, error: "Category not found" });
      }
      
      const categoryRecipes = getRecipesByCategory(categorySlug);
      
      return reply.send({
        ok: true,
        data: {
          category,
          recipes: categoryRecipes,
          totalCount: categoryRecipes.length,
          seo: {
            title: `${category.name} Recipes | Ethnic ${category.name} Dishes | StoresGo`,
            description: `${category.description}. Find authentic ethnic ${category.name.toLowerCase()} recipes from Caribbean, Latin, Asian, and African cuisines.`
          }
        }
      });
    } catch (error) {
      console.error("Category recipes error:", error);
      return reply.status(500).send({ ok: false, error: "Failed to load category recipes" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // QUICK RECIPES - /recipes/quick
  // ─────────────────────────────────────────────────────────────────────────
  
  app.get("/collection/quick", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const quickRecipes = getQuickRecipes(30);
      
      return reply.send({
        ok: true,
        data: {
          title: "Quick Recipes (Under 30 Minutes)",
          recipes: quickRecipes,
          totalCount: quickRecipes.length,
          seo: {
            title: "Quick Ethnic Recipes Under 30 Minutes | StoresGo",
            description: "Easy ethnic recipes you can make in under 30 minutes. Quick Caribbean, Latin, Asian, and African dishes for busy weeknights."
          }
        }
      });
    } catch (error) {
      console.error("Quick recipes error:", error);
      return reply.status(500).send({ ok: false, error: "Failed to load quick recipes" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // EASY RECIPES - /recipes/easy
  // ─────────────────────────────────────────────────────────────────────────
  
  app.get("/collection/easy", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const easyRecipes = recipes.filter(r => r.difficulty === "easy");
      
      return reply.send({
        ok: true,
        data: {
          title: "Easy Recipes for Beginners",
          recipes: easyRecipes,
          totalCount: easyRecipes.length,
          seo: {
            title: "Easy Ethnic Recipes for Beginners | StoresGo",
            description: "Simple ethnic recipes perfect for beginners. Easy-to-follow Caribbean, Latin, Asian, and African dishes anyone can make."
          }
        }
      });
    } catch (error) {
      console.error("Easy recipes error:", error);
      return reply.status(500).send({ ok: false, error: "Failed to load easy recipes" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TAG RECIPES - /recipes/tag/:tag
  // ─────────────────────────────────────────────────────────────────────────
  
  app.get("/tag/:tag", async (
    request: FastifyRequest<{ Params: { tag: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { tag } = request.params;
      const tagRecipes = getRecipesByTag(tag);
      
      if (tagRecipes.length === 0) {
        return reply.status(404).send({ ok: false, error: "No recipes found for this tag" });
      }
      
      const formattedTag = tag.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      
      return reply.send({
        ok: true,
        data: {
          tag,
          formattedTag,
          recipes: tagRecipes,
          totalCount: tagRecipes.length,
          seo: {
            title: `${formattedTag} Recipes | StoresGo`,
            description: `Discover delicious ${formattedTag.toLowerCase()} recipes from around the world. Authentic ethnic dishes that are ${tag}.`
          }
        }
      });
    } catch (error) {
      console.error("Tag recipes error:", error);
      return reply.status(500).send({ ok: false, error: "Failed to load tag recipes" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // INGREDIENT RECIPES - /recipes/ingredient/:ingredient
  // ─────────────────────────────────────────────────────────────────────────
  
  app.get("/ingredient/:ingredient", async (
    request: FastifyRequest<{ Params: { ingredient: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { ingredient } = request.params;
      const ingredientRecipes = getRecipesByIngredient(ingredient.replace(/-/g, " "));
      
      const formattedIngredient = ingredient.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      
      return reply.send({
        ok: true,
        data: {
          ingredient,
          formattedIngredient,
          recipes: ingredientRecipes,
          totalCount: ingredientRecipes.length,
          seo: {
            title: `Recipes with ${formattedIngredient} | StoresGo`,
            description: `Find delicious recipes using ${formattedIngredient.toLowerCase()}. Authentic ethnic dishes featuring this ingredient from Caribbean, Latin, Asian, and African cuisines.`
          }
        }
      });
    } catch (error) {
      console.error("Ingredient recipes error:", error);
      return reply.status(500).send({ ok: false, error: "Failed to load ingredient recipes" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SEARCH - /recipes/search
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
          data: { query: q || "", results: [], totalCount: 0 }
        });
      }
      
      const results = searchRecipes(q);
      
      return reply.send({
        ok: true,
        data: {
          query: q,
          results,
          totalCount: results.length
        }
      });
    } catch (error) {
      console.error("Recipe search error:", error);
      return reply.status(500).send({ ok: false, error: "Search failed" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SITEMAP DATA
  // ─────────────────────────────────────────────────────────────────────────
  
  app.get("/sitemap/recipes", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const baseUrl = "https://storesgo.com";
      const urls: any[] = [];
      
      // Hub page
      urls.push({ loc: `${baseUrl}/recipes`, changefreq: "weekly", priority: 0.9 });
      
      // Individual recipes
      for (const recipe of recipes) {
        urls.push({
          loc: `${baseUrl}/recipes/${recipe.slug}`,
          changefreq: "monthly",
          priority: 0.8
        });
      }
      
      // Cuisine pages
      for (const cuisine of cuisines) {
        urls.push({
          loc: `${baseUrl}/recipes/cuisine/${cuisine.slug}`,
          changefreq: "weekly",
          priority: 0.7
        });
      }
      
      // Category pages
      for (const category of recipeCategories) {
        urls.push({
          loc: `${baseUrl}/recipes/category/${category.slug}`,
          changefreq: "weekly",
          priority: 0.7
        });
      }
      
      // Collection pages
      urls.push({ loc: `${baseUrl}/recipes/collection/quick`, changefreq: "weekly", priority: 0.7 });
      urls.push({ loc: `${baseUrl}/recipes/collection/easy`, changefreq: "weekly", priority: 0.7 });
      
      // Tag pages (common tags)
      const commonTags = ["vegan", "gluten-free", "quick", "spicy", "grilled", "fried", "soup", "chicken", "beef", "pork", "seafood", "vegetarian"];
      for (const tag of commonTags) {
        urls.push({
          loc: `${baseUrl}/recipes/tag/${tag}`,
          changefreq: "weekly",
          priority: 0.6
        });
      }
      
      return reply.send({
        ok: true,
        data: { urls, totalCount: urls.length }
      });
    } catch (error) {
      console.error("Recipe sitemap error:", error);
      return reply.status(500).send({ ok: false, error: "Failed to generate sitemap" });
    }
  });
  
  // Stats endpoint
  app.get("/stats", async (request: FastifyRequest, reply: FastifyReply) => {
    const stats = getRecipeStats();
    return reply.send({ ok: true, data: stats });
  });
}
