import { FastifyPluginAsync } from "fastify";
import { RECIPES, getRecipesByCuisine, getHighVolumeRecipes } from "../data/recipeSeoData.js";

const recipeRoutes: FastifyPluginAsync = async (app) => {
  // Get all recipes
  app.get("/", async () => ({
    ok: true,
    data: RECIPES,
    total: RECIPES.length
  }));

  // Get single recipe by slug (falls through to expanded recipes if not in RECIPES)
  app.get("/:slug", async (request) => {
    const { slug } = request.params as { slug: string };
    const recipe = RECIPES.find(r => r.slug === slug);
    if (recipe) return { ok: true, data: recipe };

    // Fallback: try expanded recipes
    try {
      const res = await fetch(`http://localhost:5000/api/recipes-expanded/${slug}`);
      const data = await res.json();
      if (data.ok && data.data) return { ok: true, data: data.data };
    } catch (e) { /* ignore */ }

    return { ok: false, error: "Recipe not found" };
  });

  // Get recipes by cuisine
  app.get("/cuisine/:cuisineSlug", async (request) => {
    const { cuisineSlug } = request.params as { cuisineSlug: string };
    const recipes = getRecipesByCuisine(cuisineSlug);
    return { ok: true, data: recipes, total: recipes.length };
  });

  // Get high-volume recipes for sitemap priority
  app.get("/high-volume", async () => ({
    ok: true,
    data: getHighVolumeRecipes()
  }));

  // Get all recipe slugs for sitemap
  app.get("/slugs", async () => ({
    ok: true,
    data: RECIPES.map(r => ({ slug: r.slug, cuisineSlug: r.cuisineSlug }))
  }));
};

export default recipeRoutes;
