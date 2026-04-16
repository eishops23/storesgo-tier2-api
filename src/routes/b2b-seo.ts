import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  B2B_REGIONS,
  B2B_CUISINES,
  B2B_BUYER_TYPES,
  getB2BRegionBySlug,
  getB2BCuisineBySlug,
  getB2BBuyerTypeBySlug,
  getCuisinesForRegion,
  getMetrosForRegion,
  generateB2BWholesalePages,
  generateB2BPartnerPages,
  B2BRegion,
  B2BCuisine,
  B2BMetro,
  B2BBuyerType
} from "../data/b2b-seo-data.js";

export default async function b2bSeoRoutes(app: FastifyInstance) {
  
  // ============================================
  // WHOLESALE PAGES (For B2B Buyers)
  // ============================================
  
  // GET /api/b2b-seo/wholesale/:cuisine/:location
  app.get("/wholesale/:cuisine/:location", async (request: FastifyRequest, reply: FastifyReply) => {
    const { cuisine, location } = request.params as { cuisine: string; location: string };
    
    const cuisineData = getB2BCuisineBySlug(cuisine);
    if (!cuisineData) {
      return reply.status(404).send({ ok: false, error: "Cuisine not found" });
    }
    
    // Find location (could be region or metro)
    let locationData: B2BRegion | B2BMetro | undefined;
    let parentRegion: B2BRegion | undefined;
    
    // Check if it's a region
    const region = getB2BRegionBySlug(location);
    if (region) {
      locationData = region;
      parentRegion = region;
    } else {
      // Check if it's a metro within any region
      for (const r of B2B_REGIONS) {
        const metro = r.metros.find(m => m.slug === location);
        if (metro) {
          locationData = metro;
          parentRegion = r;
          break;
        }
      }
    }
    
    if (!locationData || !parentRegion) {
      return reply.status(404).send({ ok: false, error: "Location not found" });
    }
    
    const isMetro = 'population' in locationData;
    const locationLabel = locationData.label;
    const stateAbbrev = isMetro ? (locationData as B2BMetro).state : (locationData as B2BRegion).state;
    
    // Generate page data
    const pageData = {
      cuisine: cuisineData,
      location: {
        slug: location,
        label: locationLabel,
        state: stateAbbrev,
        type: isMetro ? "metro" : "region",
        ...(isMetro && { 
          population: (locationData as B2BMetro).population,
          restaurantCount: (locationData as B2BMetro).restaurantCount
        })
      },
      region: {
        slug: parentRegion.slug,
        label: parentRegion.label
      },
      
      // SEO Meta
      metaTitle: `${cuisineData.label} Food Supplier for Restaurants in ${locationLabel} | StoresGo Wholesale`,
      metaDescription: `Find ${cuisineData.label} food suppliers and distributors for your restaurant in ${locationLabel}. Bulk pricing, reliable delivery, authentic ingredients. Join StoresGo Wholesale.`,
      
      // Page Content
      heroTitle: `${cuisineData.label} Food Wholesale in ${locationLabel}`,
      heroSubtitle: `Connect with trusted ${cuisineData.label} food suppliers. Bulk pricing for restaurants, hotels, and food service businesses.`,
      
      // Stats (dynamic based on location)
      stats: {
        suppliers: Math.floor(Math.random() * 20) + 10,
        products: Math.floor(Math.random() * 500) + 200,
        restaurants: isMetro ? (locationData as B2BMetro).restaurantCount : "15,000+",
        avgSavings: "15-30%"
      },
      
      // Popular products for this cuisine
      popularProducts: cuisineData.popularProducts,
      
      // Restaurant types that buy this cuisine
      restaurantTypes: cuisineData.restaurantTypes,
      
      // Buyer types
      buyerTypes: B2B_BUYER_TYPES.slice(0, 4),
      
      // Benefits
      benefits: [
        `Authentic ${cuisineData.label} ingredients from verified suppliers`,
        "Bulk pricing with volume discounts",
        "Reliable delivery to ${locationLabel}",
        "Net-30 payment terms available",
        "Quality guarantee on all products",
        "Dedicated account manager"
      ],
      
      // FAQs
      faqs: [
        {
          question: `How do I order ${cuisineData.label} food wholesale?`,
          answer: `Sign up for a free StoresGo Wholesale account, browse our ${cuisineData.label} supplier catalog, and place orders directly. Minimum orders typically start at $200.`
        },
        {
          question: "What are the payment terms?",
          answer: "We offer Net-30 terms for qualified businesses. New accounts start with credit card or ACH payment."
        },
        {
          question: `Do you deliver to ${locationLabel}?`,
          answer: `Yes! We have multiple ${cuisineData.label} food suppliers serving ${locationLabel}. Delivery schedules vary by supplier.`
        },
        {
          question: "Is there a minimum order?",
          answer: "Minimum orders vary by supplier, typically $150-$500. Many suppliers offer free delivery above certain thresholds."
        }
      ],
      
      // Related cuisines in this region
      relatedCuisines: getCuisinesForRegion(parentRegion.slug)
        .filter(c => c.slug !== cuisine)
        .slice(0, 4),
      
      // Related locations
      relatedLocations: [
        ...parentRegion.metros.filter(m => m.slug !== location).slice(0, 3),
        { slug: parentRegion.slug, label: parentRegion.label, state: parentRegion.state }
      ].slice(0, 4)
    };
    
    return reply.send({ ok: true, data: pageData });
  });
  
  // ============================================
  // PARTNER PAGES (For B2B Sellers/Distributors)
  // ============================================
  
  // GET /api/b2b-seo/partners/:cuisine/:location
  app.get("/partners/:cuisine/:location", async (request: FastifyRequest, reply: FastifyReply) => {
    const { cuisine, location } = request.params as { cuisine: string; location: string };
    
    const cuisineData = getB2BCuisineBySlug(cuisine);
    if (!cuisineData) {
      return reply.status(404).send({ ok: false, error: "Cuisine not found" });
    }
    
    // Find location
    let locationData: B2BRegion | B2BMetro | undefined;
    let parentRegion: B2BRegion | undefined;
    
    const region = getB2BRegionBySlug(location);
    if (region) {
      locationData = region;
      parentRegion = region;
    } else {
      for (const r of B2B_REGIONS) {
        const metro = r.metros.find(m => m.slug === location);
        if (metro) {
          locationData = metro;
          parentRegion = r;
          break;
        }
      }
    }
    
    if (!locationData || !parentRegion) {
      return reply.status(404).send({ ok: false, error: "Location not found" });
    }
    
    const isMetro = 'population' in locationData;
    const locationLabel = locationData.label;
    const stateAbbrev = isMetro ? (locationData as B2BMetro).state : (locationData as B2BRegion).state;
    
    // Generate partner page data
    const pageData = {
      cuisine: cuisineData,
      location: {
        slug: location,
        label: locationLabel,
        state: stateAbbrev,
        type: isMetro ? "metro" : "region",
        ...(isMetro && { 
          population: (locationData as B2BMetro).population,
          restaurantCount: (locationData as B2BMetro).restaurantCount
        })
      },
      region: {
        slug: parentRegion.slug,
        label: parentRegion.label
      },
      
      // SEO Meta
      metaTitle: `Become a ${cuisineData.label} Food Distributor in ${locationLabel} | StoresGo Partners`,
      metaDescription: `Join StoresGo as a ${cuisineData.label} food distributor. Reach thousands of restaurants and food service businesses in ${locationLabel}. Apply today.`,
      
      // Page Content
      heroTitle: `Distribute ${cuisineData.label} Food in ${locationLabel}`,
      heroSubtitle: `Partner with StoresGo to reach ${isMetro ? (locationData as B2BMetro).restaurantCount : '15,000+'} restaurants and food service businesses in ${locationLabel}.`,
      
      // Market opportunity stats
      marketStats: {
        restaurants: isMetro ? (locationData as B2BMetro).restaurantCount : "15,000+",
        population: isMetro ? (locationData as B2BMetro).population : "10M+",
        avgOrderValue: `$${cuisineData.avgOrderValue}`,
        growthRate: "12% YoY"
      },
      
      // Products in demand
      productsInDemand: cuisineData.popularProducts,
      
      // Buyer types you'll reach
      buyerTypes: B2B_BUYER_TYPES,
      
      // Benefits for distributors
      benefits: [
        `Access ${isMetro ? (locationData as B2BMetro).restaurantCount : '15,000+'} ${cuisineData.label} restaurants in ${locationLabel}`,
        "Zero upfront costs — only pay when you sell",
        "Integrated ordering and invoicing system",
        "Marketing support and featured placement",
        "Real-time inventory management",
        "Dedicated partner success manager"
      ],
      
      // Commission structure
      commission: {
        rate: "8-12%",
        paymentTerms: "Weekly payouts",
        minimumOrder: "You set your minimums"
      },
      
      // FAQs
      faqs: [
        {
          question: "How do I become a StoresGo partner?",
          answer: "Fill out the partner application form. We'll review your product catalog and business credentials within 48 hours. Once approved, you can start listing products immediately."
        },
        {
          question: "What are the fees?",
          answer: "We charge 8-12% commission on sales, depending on volume. No monthly fees, no listing fees, no hidden costs."
        },
        {
          question: "How does delivery work?",
          answer: "You handle fulfillment and delivery to buyers. We provide the platform, orders, and payment processing."
        },
        {
          question: "What support do you provide?",
          answer: "Every partner gets a dedicated success manager, marketing support, and access to our analytics dashboard."
        }
      ],
      
      // Related cuisines
      relatedCuisines: getCuisinesForRegion(parentRegion.slug)
        .filter(c => c.slug !== cuisine)
        .slice(0, 4),
      
      // Related locations
      relatedLocations: [
        ...parentRegion.metros.filter(m => m.slug !== location).slice(0, 3),
        { slug: parentRegion.slug, label: parentRegion.label, state: parentRegion.state }
      ].slice(0, 4)
    };
    
    return reply.send({ ok: true, data: pageData });
  });
  
  // ============================================
  // INDEX PAGES
  // ============================================
  
  // GET /api/b2b-seo/wholesale - Main wholesale hub
  app.get("/wholesale", async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      ok: true,
      data: {
        regions: B2B_REGIONS.map(r => ({
          slug: r.slug,
          label: r.label,
          state: r.state,
          cuisineCount: r.primaryCuisines.length,
          metroCount: r.metros.length
        })),
        cuisines: B2B_CUISINES.map(c => ({
          slug: c.slug,
          label: c.label,
          region: c.region,
          flag: c.flag
        })),
        buyerTypes: B2B_BUYER_TYPES
      }
    });
  });
  
  // GET /api/b2b-seo/partners - Main partners hub
  app.get("/partners", async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      ok: true,
      data: {
        regions: B2B_REGIONS.map(r => ({
          slug: r.slug,
          label: r.label,
          state: r.state,
          cuisineCount: r.primaryCuisines.length,
          restaurantCount: r.metros.reduce((sum, m) => {
            const count = parseInt(m.restaurantCount.replace(/[^0-9]/g, '')) || 0;
            return sum + count;
          }, 0).toLocaleString() + "+"
        })),
        cuisines: B2B_CUISINES.map(c => ({
          slug: c.slug,
          label: c.label,
          region: c.region,
          flag: c.flag,
          avgOrderValue: c.avgOrderValue
        }))
      }
    });
  });
  
  // ============================================
  // SITEMAP DATA
  // ============================================
  
  // GET /api/b2b-seo/sitemap/wholesale
  app.get("/sitemap/wholesale", async (request: FastifyRequest, reply: FastifyReply) => {
    const pages = generateB2BWholesalePages();
    const urls = pages.map(p => ({
      loc: `https://storesgo.com/wholesale/${p.cuisine}/${p.location}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: "weekly",
      priority: 0.8
    }));
    
    // Add index pages
    urls.unshift({
      loc: "https://storesgo.com/wholesale",
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: "daily",
      priority: 0.9
    });
    
    // Add region pages
    for (const region of B2B_REGIONS) {
      urls.push({
        loc: `https://storesgo.com/wholesale/${region.slug}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: "weekly",
        priority: 0.85
      });
    }
    
    return reply.send({ ok: true, urls, count: urls.length });
  });
  
  // GET /api/b2b-seo/sitemap/partners
  app.get("/sitemap/partners", async (request: FastifyRequest, reply: FastifyReply) => {
    const pages = generateB2BPartnerPages();
    const urls = pages.map(p => ({
      loc: `https://storesgo.com/partners/${p.cuisine}/${p.location}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: "weekly",
      priority: 0.8
    }));
    
    // Add index page
    urls.unshift({
      loc: "https://storesgo.com/partners",
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: "daily",
      priority: 0.9
    });
    
    // Add region pages
    for (const region of B2B_REGIONS) {
      urls.push({
        loc: `https://storesgo.com/partners/${region.slug}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: "weekly",
        priority: 0.85
      });
    }
    
    return reply.send({ ok: true, urls, count: urls.length });
  });
  
  // ============================================
  // LEAD CAPTURE
  // ============================================
  
  // POST /api/b2b-seo/leads/wholesale - Capture buyer leads
  app.post("/leads/wholesale", async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      businessName: string;
      contactName: string;
      email: string;
      phone?: string;
      businessType: string;
      cuisineInterest: string;
      location: string;
      monthlyVolume?: string;
      message?: string;
    };
    
    // TODO: Save to database
    console.log("B2B Wholesale Lead:", body);
    
    return reply.send({ 
      ok: true, 
      message: "Thank you! A StoresGo representative will contact you within 24 hours." 
    });
  });
  
  // POST /api/b2b-seo/leads/partners - Capture seller/distributor leads
  app.post("/leads/partners", async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      companyName: string;
      contactName: string;
      email: string;
      phone?: string;
      companyType: string; // manufacturer, distributor, importer
      cuisineSpecialty: string;
      coverageArea: string;
      productCount?: string;
      annualRevenue?: string;
      message?: string;
    };
    
    // TODO: Save to database
    console.log("B2B Partner Lead:", body);
    
    return reply.send({ 
      ok: true, 
      message: "Thank you for your interest! Our partnerships team will review your application within 48 hours." 
    });
  });
}
