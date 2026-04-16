import { FastifyPluginAsync } from "fastify";
import { NEIGHBORHOODS, getNeighborhoodsByCounty } from "../data/neighborhoodData.js";
import { CUISINES } from "../data/buyerSeoData.js";

const neighborhoodRoutes: FastifyPluginAsync = async (app) => {
  // Get all neighborhoods
  app.get("/", async () => ({
    ok: true,
    data: NEIGHBORHOODS,
    total: NEIGHBORHOODS.length
  }));

  // Get neighborhood by slug
  app.get("/:slug", async (request) => {
    const { slug } = request.params as { slug: string };
    const neighborhood = NEIGHBORHOODS.find(n => n.slug === slug);
    return neighborhood ? { ok: true, data: neighborhood } : { ok: false, error: "Not found" };
  });

  // Get neighborhoods by county
  app.get("/county/:countySlug", async (request) => {
    const { countySlug } = request.params as { countySlug: string };
    return { ok: true, data: getNeighborhoodsByCounty(countySlug) };
  });

  // Get page data for /shop/[cuisine]/[neighborhood]
  app.get("/page/:cuisine/:neighborhoodSlug", async (request) => {
    const { cuisine, neighborhoodSlug } = request.params as { cuisine: string; neighborhoodSlug: string };
    const neighborhood = NEIGHBORHOODS.find(n => n.slug === neighborhoodSlug);
    const cuisineData = CUISINES.find(c => c.slug === cuisine);
    
    if (!neighborhood || !cuisineData) {
      return { ok: false, error: "Not found" };
    }

    return {
      ok: true,
      data: {
        title: `${cuisineData.label} Grocery Delivery in ${neighborhood.name} | StoresGo`,
        h1: `${cuisineData.label} Grocery Delivery to ${neighborhood.name}`,
        metaDescription: `Order authentic ${cuisineData.label} groceries for delivery in ${neighborhood.name}, ${neighborhood.county}. ${cuisineData.popularItems.slice(0, 3).join(", ")} and more. Fast delivery to ZIP codes ${neighborhood.zipCodes.slice(0, 2).join(", ")}.`,
        cuisine: cuisineData,
        neighborhood: neighborhood,
        nearbyZips: neighborhood.zipCodes,
        landmarks: neighborhood.landmarks,
        demographics: neighborhood.demographics
      }
    };
  });

  // Get slugs for sitemap
  app.get("/slugs", async () => ({
    ok: true,
    data: NEIGHBORHOODS.map(n => ({ slug: n.slug, county: n.countySlug }))
  }));
};

export default neighborhoodRoutes;
