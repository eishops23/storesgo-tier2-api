import hubRoutes from "./hub-routes.js";
import productSeoRoutes from "./product-seo-routes.js";
import recipesSeoRoutes from "./recipes-seo.js";
import encyclopediaRoutes from "./encyclopedia.js";
import googleMerchantFeedRoutes from "./google-merchant-feed.js";
import metaCatalogFeedRoutes from "./meta-catalog-feed.js";
import filterRoutes from "./filters.js";
import locationSeoRoutes from "./location-seo.js";
import sitemapLocationRoutes from "./sitemap-location.js";
import ingredientSeoRoutes from "./ingredients-seo.js";
import sitemapIngredientRoutes from "./sitemap-ingredients.js";
import b2bSeoRoutes from "./b2b-seo.js";
import mobileAuthRoutes from "./mobile/auth.js";
import sitemapB2bRoutes from "./sitemap-b2b.js";
// STORESGO ROUTE REGISTRY — PHASE 6 + NOTIFICATIONS + BLOG
// ==========================================================

import { FastifyInstance } from "fastify";
import migrationRoutes from "./migration.routes.js";
import buySeoRoutes from "./buy-seo.js";

// ⭐ Homepage
import homepageRoutes from "./homepage.js";

// ⭐ Core route modules
import categoryRoutes from "./categories/index.js";
import productRoutes from "./products.js";
import sellerRoutes from "./sellers/index.js";
import reviewRoutes from "./reviews/index.js";
import sellerSeoRoutes from "./sellerSeo.routes.js";
import buyerSeoRoutes from "./buyerSeo.routes.js";
import recipeRoutes from "./recipe.routes.js";
import neighborhoodRoutes from "./neighborhood.routes.js";

// ⭐ SEO Content (blog/guides/deals)
import seoRoutes from "./seo/index.js";

// 📝 Blog (AI-generated posts - Phase 16)
import blogRoutes from "./blog/index.js";

// 📝 CMS (homepage blocks, footer content)
import cmsRoutes from "./cms/index.js";

// 🔍 Search (Phase 18)
import searchRoutes from "./search/index.js";
import aiSearchRoutes from "./aiSearch.js";

// 🗺️ Sitemap (Phase 16)
import sitemapRoutes from "./sitemap/index.js";
import aiRoutes from "./ai/index.js";
import recommendationsRoutes from "./recommendations.js";
// 🎯 Recommendations widget endpoint (Phase 18A Prompt 4)
import recommendWidgetRoutes from "./recommend-widget.js";

// ⭐ Auth
import buyerAuthRoutes from "./auth/buyer.js";
import sellerAuthRoutes from "./auth/seller.js";
import passwordResetRoutes from "./auth/passwordReset.js";

// ⭐ Admin
import adminRoutes from "./admin/index.js";

// 📤 Seller Routes
import sellerBulkUploadRoutes from "./seller/bulkUpload.js";
import sellerProductsRoutes from "./seller/products.js";
import sellerProductImagesRoutes from "./seller/productImages.js";
import sellerDashboardRoutes from "./seller/dashboard.js";
import sellerOrderRoutes from "./seller/orders.js";
import sellerSettingsRoutes from "./seller/settings.js";
import sellerShippingRoutes from "./seller/shipping.js";

// 🔔 Notifications
import notificationRoutes from "./notifications/index.js";

// 🛒 Orders
import orderRoutes from "./orders/index.js";
import unitRoutes from "./units.js";

// 📤 File Uploads
import uploadRoutes from "./uploads/index.js";
import shippingRoutes from "./shipping.js";
import inventoryRoutes from "./inventory.js";
import promoRoutes from "./promo.js";
import chatRoutes from "./chat.js";
import stripeRoutes from "./stripe.js";
import addressRoutes from "./addresses.js";
import paymentRoutes from "./payments.js";
import imageProxyRoutes from "./imageProxy.js";
import favoritesRoutes from "./favorites.js";
import referralsRoutes from "./referrals.js";
import paymentMethodsRoutes from "./paymentMethods.js";
import resolveUrlRoutes from "./resolve-url.js";
import recipesExpandedRoutes from "./recipes-expanded.js";

export default async function routes(app: FastifyInstance, opts: any) {

  // Homepage
  await app.register(homepageRoutes, { prefix: "/homepage" });
  await app.register(migrationRoutes, { prefix: "/api/migration" });
  await app.register(sellerSeoRoutes, { prefix: "/seller-seo" });
  await app.register(sitemapB2bRoutes, { prefix: "/sitemap" });
  await app.register(buyerSeoRoutes, { prefix: "/buyer-seo" });
  await app.register(recipeRoutes, { prefix: "/recipes" });
  await app.register(neighborhoodRoutes, { prefix: "/neighborhoods" });

  // Root
  app.get("/", async () => ({
    ok: true,
    message: "StoresGo API Root",
  }));

  // Core
  await app.register(categoryRoutes, { prefix: "/categories" });
  await app.register(productRoutes, { prefix: "/products" });
  await app.register(sellerRoutes, { prefix: "/sellers" });
  await app.register(reviewRoutes, { prefix: "/reviews" });

  // SEO Content
  await app.register(seoRoutes, { prefix: "/seo" });

  // Blog (AI-generated posts)
  await app.register(blogRoutes, { prefix: "/blog" });

  // CMS (homepage blocks, footer)
  await app.register(cmsRoutes, { prefix: "/cms" });

  // Search (Phase 18)
  await app.register(searchRoutes, { prefix: "/search-products" });
  await app.register(aiSearchRoutes, { prefix: "/ai-search" });

  // Auth
  await app.register(buyerAuthRoutes, { prefix: "/auth" });
  await app.register(sellerAuthRoutes, { prefix: "/auth" });
  // Mobile Auth
  await app.register(mobileAuthRoutes, { prefix: "/mobile" });
  await app.register(passwordResetRoutes, { prefix: "/auth" });

  // Admin — prefix "/admin" combines with server.ts "/api" to create "/api/admin"
  await app.register(adminRoutes, { prefix: "/admin" });

  // Seller Products CRUD — /api/seller/products
  await app.register(sellerProductsRoutes, { prefix: "/seller/products" });
  // Seller Product Images — /api/seller/products/:productId/images
  await app.register(sellerProductImagesRoutes, { prefix: "/seller/products" });
  // Seller Dashboard — /api/seller/dashboard
  await app.register(sellerDashboardRoutes, { prefix: "/seller/dashboard" });
  // Seller Orders — /api/seller/orders
  await app.register(sellerOrderRoutes, { prefix: "/seller/orders" });
  // Seller Settings — /api/seller/settings
  await app.register(sellerSettingsRoutes, { prefix: "/seller/settings" });
  // Seller Shipping — /api/seller/shipping
  await app.register(sellerShippingRoutes, { prefix: "/seller/shipping" });
  // Seller Bulk Upload — /api/seller/products/bulk
  await app.register(sellerBulkUploadRoutes, { prefix: "/seller/products/bulk" });

  // Notifications — /api/notifications
  await app.register(notificationRoutes, { prefix: "/notifications" });

  // Orders — /api/orders
  await app.register(orderRoutes, { prefix: "/orders" });
  // Units — /api/units
  await app.register(unitRoutes, { prefix: "/units" });

  // Uploads — /api/uploads
  await app.register(uploadRoutes, { prefix: "/uploads" });

  // Checkout & Payments
  await app.register(shippingRoutes, { prefix: "/shipping" });
  await app.register(inventoryRoutes, { prefix: "/inventory" });
  await app.register(chatRoutes, { prefix: "/chat" });
  await app.register(stripeRoutes, { prefix: "/stripe" });
  await app.register(addressRoutes, { prefix: "/addresses" });
  await app.register(paymentRoutes, { prefix: "/payments" });
  await app.register(favoritesRoutes, { prefix: "/favorites" });
  await app.register(referralsRoutes, { prefix: "/referrals" });
  await app.register(paymentMethodsRoutes, { prefix: "/payment-methods" });

  // Sitemap — /api/sitemap (also accessible from root via server.ts)
  // AI Routes
  await app.register(aiRoutes, { prefix: "/ai" });
  await app.register(recommendationsRoutes, { prefix: "/recommendations" });
  // Phase 18A widget endpoint: POST /api/recommend/cart — bypasses the
  // LLM and calls the service layer directly for low-latency sidebar
  // and cart-complete card responses. Does not collide with the stub
  // at /recommendations (different path, different method).
  await app.register(recommendWidgetRoutes, { prefix: "/recommend" });
  await app.register(sitemapRoutes, { prefix: "/sitemap" });

  // Image Proxy - /api/images
  await app.register(imageProxyRoutes, { prefix: "/images" });

  // Filters — /api/filters
  await app.register(filterRoutes, { prefix: "/filters" });
  await app.register(encyclopediaRoutes, { prefix: "/encyclopedia" });
  await app.register(locationSeoRoutes, { prefix: "/location-seo" });
  await app.register(sitemapLocationRoutes, { prefix: "/sitemap" });
  await app.register(ingredientSeoRoutes, { prefix: "/ingredients-seo" });
  await app.register(sitemapIngredientRoutes, { prefix: "/sitemap" });
  await app.register(b2bSeoRoutes, { prefix: "/b2b-seo" });
  await app.register(buySeoRoutes, { prefix: "/buy-seo" });
  await app.register(recipesSeoRoutes, { prefix: "/recipes-seo" });
  await app.register(recipesExpandedRoutes, { prefix: "/recipes-expanded" });
  await app.register(googleMerchantFeedRoutes, { prefix: "/feeds/google-merchant" });
  await app.register(metaCatalogFeedRoutes, { prefix: "/feeds/meta-catalog" });
  await app.register(resolveUrlRoutes, { prefix: "" });
  
  // Hyper-Local SEO Routes
  await app.register(hubRoutes, { prefix: "/hub" });
  await app.register(productSeoRoutes, { prefix: "/product-seo" });
}
