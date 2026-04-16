import { FastifyPluginAsync } from "fastify";
import { CUISINES, LOCATIONS, BUYER_CATEGORIES, generateBuyerPageData } from "../data/buyerSeoData.js";

const buyerSeoRoutes: FastifyPluginAsync = async (app) => {
  app.get("/options", async () => ({
    ok: true,
    data: { cuisines: CUISINES, locations: LOCATIONS, categories: BUYER_CATEGORIES, totalPages: CUISINES.length * LOCATIONS.length }
  }));

  app.get("/pages/:cuisine/:location", async (request) => {
    const { cuisine, location } = request.params as { cuisine: string; location: string };
    const pageData = generateBuyerPageData(cuisine, location);
    return pageData ? { ok: true, data: pageData } : { ok: false, error: "Invalid cuisine or location" };
  });

  app.get("/cuisines", async () => ({ ok: true, data: CUISINES }));
  
  app.get("/cuisines/:region", async (request) => {
    const { region } = request.params as { region: string };
    return { ok: true, data: CUISINES.filter(c => c.region === region) };
  });

  app.get("/locations", async () => ({ ok: true, data: LOCATIONS }));
  
  app.get("/categories", async () => ({ ok: true, data: BUYER_CATEGORIES }));
  
  app.get("/categories/:slug", async (request) => {
    const { slug } = request.params as { slug: string };
    const category = BUYER_CATEGORIES.find(c => c.slug === slug);
    if (!category) return { ok: false, error: "Category not found" };
    return { ok: true, data: { ...category, cuisines: CUISINES.filter(c => category.cuisines.includes(c.slug)), locations: LOCATIONS } };
  });
};

export default buyerSeoRoutes;
