// ═══════════════════════════════════════════════════════════════════════════════
// STORESGO LOCATION SEO API ROUTES
// Handles location-based pages for "[cuisine] food near [city]" searches
// ═══════════════════════════════════════════════════════════════════════════════

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  cities,
  states,
  cuisines,
  getCityBySlug,
  getStateBySlug,
  getCuisineBySlug,
  getCitiesByState,
  getCitiesByCuisine,
  getPopularCuisinesForCity,
  getLocationStats,
  getRelevantCombinations,
} from "../data/location-seo-data.js";

export default async function locationSeoRoutes(app: FastifyInstance) {
  
  // ─────────────────────────────────────────────────────────────────────────
  // MAIN HUB - /near
  // ─────────────────────────────────────────────────────────────────────────
  
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = getLocationStats();
      
      return reply.send({
        ok: true,
        data: {
          title: "Find Ethnic Grocery Stores Near You | StoresGo",
          description: "Discover authentic ethnic grocery stores and restaurants in your area. Shop Caribbean, Latin, Asian, and African foods from local stores.",
          stats,
          cuisines: cuisines.slice(0, 20),
          states: states.slice(0, 15),
          featuredCities: cities.filter(c => c.population > 500000).slice(0, 12),
        }
      });
    } catch (error) {
      console.error("Location hub error:", error);
      return reply.status(500).send({ ok: false, error: "Failed to load locations" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CUISINE HUB - /near/:cuisine
  // ─────────────────────────────────────────────────────────────────────────
  
  app.get("/:cuisine", async (
    request: FastifyRequest<{ Params: { cuisine: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { cuisine: cuisineSlug } = request.params;
      const cuisine = getCuisineBySlug(cuisineSlug);
      
      if (!cuisine) {
        return reply.status(404).send({ ok: false, error: "Cuisine not found" });
      }
      
      const relevantCities = getCitiesByCuisine(cuisineSlug);
      const popularStates = cuisine.popularStates.map(s => getStateBySlug(s)).filter(Boolean);
      
      return reply.send({
        ok: true,
        data: {
          cuisine,
          popularStates,
          featuredCities: relevantCities.slice(0, 20),
          allStates: states,
          seo: {
            title: `${cuisine.name} Food & Grocery Stores Near You | StoresGo`,
            description: `Find ${cuisine.name} grocery stores, restaurants, and markets near you. Shop authentic ${cuisine.name} ingredients and foods from local stores.`,
            h1: `Find ${cuisine.name} Food Near You`,
          }
        }
      });
    } catch (error) {
      console.error("Cuisine hub error:", error);
      return reply.status(500).send({ ok: false, error: "Failed to load cuisine" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // STATE PAGE - /near/:cuisine/:state
  // ─────────────────────────────────────────────────────────────────────────
  
  app.get("/:cuisine/:state", async (
    request: FastifyRequest<{ Params: { cuisine: string; state: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { cuisine: cuisineSlug, state: stateSlug } = request.params;
      const cuisine = getCuisineBySlug(cuisineSlug);
      const state = getStateBySlug(stateSlug);
      
      if (!cuisine || !state) {
        return reply.status(404).send({ ok: false, error: "Cuisine or state not found" });
      }
      
      const stateCities = getCitiesByState(stateSlug);
      const citiesWithCuisine = stateCities.filter(c => 
        c.ethnicDemographics?.includes(cuisineSlug)
      );
      
      return reply.send({
        ok: true,
        data: {
          cuisine,
          state,
          cities: citiesWithCuisine.length > 0 ? citiesWithCuisine : stateCities.slice(0, 20),
          allCities: stateCities,
          seo: {
            title: `${cuisine.name} Food in ${state.name} | ${cuisine.name} Grocery Stores ${state.abbr} | StoresGo`,
            description: `Find ${cuisine.name} grocery stores and restaurants in ${state.name}. Discover authentic ${cuisine.name} markets, food shops, and supermarkets across ${state.abbr}.`,
            h1: `${cuisine.name} Food & Grocery Stores in ${state.name}`,
          }
        }
      });
    } catch (error) {
      console.error("State page error:", error);
      return reply.status(500).send({ ok: false, error: "Failed to load state" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CITY PAGE - /near/:cuisine/:state/:city (THE MONEY PAGE)
  // ─────────────────────────────────────────────────────────────────────────
  
  app.get("/:cuisine/:state/:city", async (
    request: FastifyRequest<{ Params: { cuisine: string; state: string; city: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { cuisine: cuisineSlug, state: stateSlug, city: citySlug } = request.params;
      const cuisine = getCuisineBySlug(cuisineSlug);
      const state = getStateBySlug(stateSlug);
      const city = getCityBySlug(citySlug);
      
      if (!cuisine || !state || !city) {
        return reply.status(404).send({ ok: false, error: "Location not found" });
      }
      
      // Check if city is in the correct state
      if (city.stateSlug !== stateSlug) {
        return reply.status(404).send({ ok: false, error: "City not in this state" });
      }
      
      const popularCuisines = getPopularCuisinesForCity(citySlug);
      const nearbyCities = getCitiesByState(stateSlug)
        .filter(c => c.slug !== citySlug)
        .slice(0, 6);
      
      // Generate rich content
      const isHighDemand = city.ethnicDemographics?.includes(cuisineSlug);
      
      // Schema.org structured data
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": `${cuisine.name} Food Near ${city.name}, ${state.abbr}`,
        "description": `Find ${cuisine.name} grocery stores, markets, and restaurants near ${city.name}, ${state.name}. Shop authentic ${cuisine.name} ingredients online and discover local ${cuisine.name} food stores.`,
        "url": `https://storesgo.com/near/${cuisineSlug}/${stateSlug}/${citySlug}`,
        "mainEntity": {
          "@type": "ItemList",
          "name": `${cuisine.name} Food Stores in ${city.name}`,
          "description": `List of ${cuisine.name} grocery stores and markets in ${city.name}, ${state.abbr}`,
          "itemListElement": []
        }
      };
      
      // LocalBusiness schema for better local SEO
      const localBusinessSchema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": `StoresGo - ${cuisine.name} Groceries ${city.name}`,
        "description": `Order authentic ${cuisine.name} groceries online for delivery in ${city.name}, ${state.abbr}`,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": city.name,
          "addressRegion": state.abbr,
          "addressCountry": "US"
        },
        "areaServed": {
          "@type": "City",
          "name": city.name
        }
      };
      
      return reply.send({
        ok: true,
        data: {
          cuisine,
          state,
          city,
          isHighDemand,
          popularCuisines,
          nearbyCities,
          seo: {
            title: `${cuisine.name} Food Near ${city.name}, ${state.abbr} | ${cuisine.name} Grocery Store | StoresGo`,
            description: `Find ${cuisine.name} grocery stores and restaurants near ${city.name}, ${state.name}. Order authentic ${cuisine.name} food for delivery or find local ${cuisine.name} markets and supermarkets.`,
            h1: `${cuisine.name} Food Near ${city.name}, ${state.abbr}`,
            keywords: [
              `${cuisine.name.toLowerCase()} food near ${city.name.toLowerCase()}`,
              `${cuisine.name.toLowerCase()} grocery ${city.name.toLowerCase()}`,
              `${cuisine.name.toLowerCase()} market ${city.name.toLowerCase()}`,
              `${cuisine.name.toLowerCase()} restaurant ${city.name.toLowerCase()}`,
              `${cuisine.name.toLowerCase()} supermarket ${city.name.toLowerCase()} ${state.abbr.toLowerCase()}`,
              `buy ${cuisine.name.toLowerCase()} food ${city.name.toLowerCase()}`,
              `${cuisine.name.toLowerCase()} store near me`,
            ],
            structuredData,
            localBusinessSchema,
          },
          content: {
            intro: `Looking for authentic ${cuisine.name} food in ${city.name}? StoresGo connects you with the best ${cuisine.name} grocery stores, markets, and restaurants in ${city.name}, ${state.abbr}.`,
            
            whyShopWithUs: [
              `Authentic ${cuisine.name} ingredients sourced from trusted suppliers`,
              `Convenient delivery to ${city.name} and surrounding areas`,
              `Fresh products with quality guarantee`,
              `Support local ${cuisine.name} food businesses`,
            ],
            
            popularProducts: cuisine.searchTerms.slice(0, 5),
            
            deliveryInfo: `We deliver to ${city.name} and the greater ${state.name} area. Order ${cuisine.name} groceries online and have them delivered fresh to your door.`,
            
            callToAction: `Shop ${cuisine.name} Groceries for ${city.name} Delivery`,
          }
        }
      });
    } catch (error) {
      console.error("City page error:", error);
      return reply.status(500).send({ ok: false, error: "Failed to load city" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SITEMAP DATA ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────
  
  // All location URLs for sitemap
  app.get("/sitemap/all", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const baseUrl = "https://storesgo.com";
      const urls: any[] = [];
      
      // Hub page
      urls.push({ loc: `${baseUrl}/near`, changefreq: "weekly", priority: 0.9 });
      
      // Cuisine hub pages
      for (const cuisine of cuisines) {
        urls.push({
          loc: `${baseUrl}/near/${cuisine.slug}`,
          changefreq: "weekly",
          priority: 0.8
        });
        
        // State pages for each cuisine
        for (const state of states) {
          urls.push({
            loc: `${baseUrl}/near/${cuisine.slug}/${state.slug}`,
            changefreq: "weekly",
            priority: 0.7
          });
        }
      }
      
      // City pages (the money pages) - only relevant combinations
      const relevantCombos = getRelevantCombinations();
      for (const { city, cuisine } of relevantCombos) {
        urls.push({
          loc: `${baseUrl}/near/${cuisine.slug}/${city.stateSlug}/${city.slug}`,
          changefreq: "weekly",
          priority: 0.9 // High priority - these are the conversion pages
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
  
  // Stats endpoint
  app.get("/stats", async (request: FastifyRequest, reply: FastifyReply) => {
    const stats = getLocationStats();
    const relevantCombos = getRelevantCombinations();
    
    return reply.send({
      ok: true,
      data: {
        ...stats,
        relevantCombinations: relevantCombos.length,
        // Breakdown
        cuisineHubPages: cuisines.length,
        statePages: cuisines.length * states.length,
        cityPages: relevantCombos.length,
        totalPages: 1 + cuisines.length + (cuisines.length * states.length) + relevantCombos.length
      }
    });
  });
}
