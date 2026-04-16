# StoresGo Backend — v3 Agent Suite Gap Audit

> **Generated:** 2026-04-08 (Prompt 1 — REVISED)
> **Baseline commit:** `f71099e` (initial: production snapshot 2026-04-08)
> **Audit method:** Exhaustive local filesystem read of all 263 source files
> **Auditor:** Claude Code (automated, every claim backed by file reads)

---

## 1. Executive Summary

The StoresGo backend is significantly more built than the original v3 spec assumed. Across
86 active route files and 41 active service files, the platform already has: a working
AI chat system (Gemini 2.0 Flash, stateless), Meilisearch-powered product search, a complete
referral system with Prisma model, SendGrid + Twilio + Klaviyo notification infrastructure,
Stripe + Square dual payment processing, Google Merchant + Meta Commerce product feeds, an
extensive SEO content engine spanning 7 route verticals (buy-seo, ingredients-seo,
location-seo, recipes-seo, seller-seo, buyer-seo, b2b-seo) backed by large static data
files, AI-powered SEO metadata generation (OpenAI gpt-4o-mini), AI autoblog (Gemini), a
review system, buy-again endpoint, homepage merchandising with configurable CMS, and a
BullMQ-based worker infrastructure (though most workers are excluded from the production
build).

The critical gaps for the v3 agent suite are: **no conversation persistence** (chat is
fully stateless), **no tool/agent framework** (intent routing is regex heuristics), **no
customer identity unification**, **no autonomy/escalation management**, **no voice pipeline
beyond a Whisper transcription utility**, **no inbound email processing**, **no WhatsApp
integration**, and **no cart recovery automation**. The existing chat, search, referral,
SEO, and notification systems provide a strong foundation that the agent suite can call
into rather than rebuild.

The recommended strategy remains Option B: build the agent suite in isolation under
`src/agent/` with its own `tsconfig.agent.json`, importing from the existing codebase
only through well-defined service interfaces.

---

## 2. Production State

| Attribute | Value |
|-----------|-------|
| Server | OCI instance `150.136.233.54` |
| Runtime | Node.js + PM2 cluster mode (`ecosystem.config.cjs`) |
| Framework | Fastify 5.6.2 (ESM, `"type": "module"`) |
| Database | PostgreSQL (Prisma 5.22.0, 51 models) |
| Search | Meilisearch 0.54.0 (local `127.0.0.1:7700`) |
| Cache/Queues | Redis + BullMQ 5.65.0 (workers excluded from prod build) |
| AI Chat | Google Gemini 2.0 Flash (REST fetch, stateless) |
| AI SEO | OpenAI gpt-4o-mini (SDK, batch enrichment) |
| AI Blog | Google Gemini 2.0 Flash (`@google/generative-ai` SDK) |
| Payments | Stripe SDK 20.4.0 (primary) + Square REST (legacy) |
| Email | SendGrid SDK + Nodemailer SMTP + raw fetch |
| SMS | Twilio 4.23.0 |
| Marketing | Klaviyo REST API |
| Monitoring | Sentry 8.55.0, Pino logging |
| Build | `tsc -p tsconfig.build.json` → `dist/` (strict: false, narrow include) |
| Deploy | PM2 from compiled `dist/server.js` + `dist/workers/index.js` |

**Key insight:** The `tsconfig.build.json` excludes `src/ai/`, `src/workers/`, `src/jobs/`,
`src/queues/`, and several plugins/libs from the production build. Many features exist in
source but are not compiled or deployed. The production server runs the API routes, cron
(maintenance + autoblog), and Meilisearch search — but NOT the BullMQ workers, SEO cron
pipeline, semantic search, or voice transcription.

---

## 3. Prisma Schema Inventory (51 Models, 2 Enums)

### Core Commerce (16 models)

| Model | @@map | Key Fields | Key Relations |
|-------|-------|------------|---------------|
| User | `users` | id (cuid), email, password, role (UserRole), referral_code | addresses, orders, reviews, sellerProfile, wallet |
| BuyerProfile | `buyer_profiles` | userId, firstName, lastName, stripeCustomerId, squareCustomerId | user |
| Seller | `sellers` | id (int), userId, storeName, slug, isApproved, isBanned | user, products, orders, stores, wallet |
| Store | `stores` | id, sellerId, name, slug, isActive | seller, products |
| Product | `products` | id, sellerId, name, slug, priceCents, categoryId, status, storeId, ai* fields | seller, store, category, images, inventory, reviews, embedding |
| ProductImage | `product_images` | productId, url, isPrimary, sortOrder | product |
| ProductInventory | `product_inventory` | productId, stockQuantity, reservedQuantity, lowStockThreshold | product, movements |
| InventoryMovement | `inventory_movements` | inventoryId, movementType, quantity | inventory |
| Order | `orders` | buyerId, sellerId, totalAmountCents, status, paymentStatus, stripePaymentId, squarePaymentId | buyer, seller, orderItems, transactions |
| OrderItem | `order_items` | orderId, productId, quantity, priceCents, substitutionPreference | order, product |
| Transaction | `transactions` | orderId, amountCents, status, sellerId, userId | order, seller, user |
| Address | `addresses` | userId, street, city, state, zip, isDefault | user |
| PaymentMethod | `payment_methods` | userId, type, brand, last4, providerTokenId | user |
| Wallet | `wallets` | sellerId/userId, balanceCents | seller, user |
| PayoutRecord | `payout_records` | sellerId, amountCents, status | seller |
| Membership | `memberships` | userId, level, active | user |

### Category & Catalog (7 models)

| Model | @@map | Key Fields |
|-------|-------|------------|
| Category | `categories` | name, slug, parentId, seo_title, seo_description, seo_content |
| ProductCategoryAssignment | `product_category_assignments` | productId, categoryId, confidence, isPrimary, reviewStatus |
| ProductAttribute | `product_attributes` | productId, key, value |
| CategoryMapping | `category_mappings` | sourceName, targetCategoryId, confidence |
| FilterConfig | `filter_configs` | categorySlug, filterKey, filterType, options |
| Unit | `units` | name, abbreviation, category, conversionFactor |
| ImportItem | `import_items` | productId, sourceFile, status |

### SEO & Content (7 models)

| Model | @@map | Key Fields |
|-------|-------|------------|
| SeoPage | `seo_pages` | type, title, slug, metaTitle, metaDescription, contentHtml, embedding (Float[]) |
| seoTask | `seo_tasks` | type, status, targetSlug, payload, attempts |
| internalLink | `internal_links` | fromSlug/sourceSlug, toSlug/targetSlug, anchorText, relevance |
| BlogPost | `blog_posts` | title, slug, contentHtml, language, source, tags, embedding, sellerId |
| CmsBlock | `cms_blocks` | key, type, content, contentHtml, contentJson, isActive |
| FooterLink | `footer_links` | title/label, url, section, sortOrder |
| FooterContent | `footer_content` | key, content/value |

### AI/ML (4 models)

| Model | @@map | Key Fields |
|-------|-------|------------|
| AICategoryLog | `ai_category_logs` | productId, oldCategory, newCategory, confidence, promptHash, resultJson |
| AIEnrichmentLog | `ai_enrichment_logs` | productId, enrichmentType, status, modelUsed, tokensUsed, latencyMs, moderationScore |
| AiLog | `ai_logs` | type, input (Json), output (Json) |
| productEmbedding | `product_embeddings` | productId, vector (Float[]) |

### Referral (3 models)

| Model | @@map | Key Fields |
|-------|-------|------------|
| Referral | `referrals` | referrerId, referredId, referralCode, status, referrerRewardCents (2500), referredRewardCents (1000) |
| referral_credit_transactions | (same) | user_id, amount, balance_after, transaction_type |
| referral_redemptions | (same) | referrer_user_id, referred_user_id, referrer_credit, referred_credit, status |

### Notifications (2 models)

| Model | @@map | Key Fields |
|-------|-------|------------|
| Notification | `notifications` | userId/sellerId/adminId, title, message, type, channel, status, read (bool) |
| NotificationPreference | `notification_preferences` | userId/sellerId, emailEnabled, smsEnabled, pushEnabled |

### Other (5 models)

| Model | @@map | Key Fields |
|-------|-------|------------|
| AdminUser | `admin_users` | email, password, role |
| PasswordResetToken | `password_reset_tokens` | tokenHash, userId, expiresAt |
| PromoCode | `promo_codes` | code, discountType, discountValue, usageLimit, sellerId |
| PromoCodeUsage | `promo_code_usages` | promoCodeId, userId, orderId, discountCents |
| Review | `reviews` | userId, productId, sellerId, rating, comment |

### Homepage/Deals (3 models)

| Model | @@map | Key Fields |
|-------|-------|------------|
| HomepageConfig | `homepage_config` | heroTitle, featuredCategoryIds, featuredProductIds, ctaTitle |
| HeroSlide | (none) | title, imageUrl, link |
| HomepageSection | (none) | title, type, order, visible |

### Product Discovery (2 models)

| Model | @@map | Key Fields |
|-------|-------|------------|
| product_universe | (same) | name, slug, brand, upc, walmart_available, storesgo_price_cents, search_count |
| product_waitlist | (same) | product_universe_id, user_id, email, city |

### Seasonal (1 model)

| Model | @@map | Key Fields |
|-------|-------|------------|
| seasonalDeal | `seasonal_deals` | title, discountPct, startDate, endDate, active |

### Enums

| Enum | Values |
|------|--------|
| ShippingMode | LIVE, FREE, FLAT, LOCAL |
| UserRole | BUYER, SELLER, ADMIN |

---

## 4. Active Route Inventory (100 files)

### Auth & User (8 files)
- `src/routes/auth/buyer.ts` — Buyer registration + login
- `src/routes/auth/seller.ts` — Seller registration + login
- `src/routes/auth/checkout.ts` — Guest checkout auth
- `src/routes/auth/login.js` — Legacy login
- `src/routes/auth/logout.js` — Logout
- `src/routes/auth/register.js` — Legacy registration
- `src/routes/auth/passwordReset.ts` — Forgot/reset password flow
- `src/routes/auth/profile.ts` — User profile CRUD

### Admin (12 files)
- `src/routes/admin/index.ts` — Admin route aggregator
- `src/routes/admin/index.d.ts` — Type declarations
- `src/routes/admin/auth.ts` — Admin login
- `src/routes/admin/dashboard.ts` — Dashboard stats
- `src/routes/admin/products.ts` — Product management
- `src/routes/admin/sellers.ts` — Seller approval/ban
- `src/routes/admin/categories.ts` — Category CRUD
- `src/routes/admin/categoryAssignment.ts` — AI category assignment
- `src/routes/admin/ai.ts` — AI enrichment admin UI
- `src/routes/admin/blog.ts` — Blog management
- `src/routes/admin/bulkUpload.ts` — CSV/bulk product upload
- `src/routes/admin/cms.ts` — CMS block management
- `src/routes/admin/filters.ts` — Filter configuration
- `src/routes/admin/homepage.ts` — Homepage config admin
- `src/routes/admin/seo.ts` — SEO page CRUD

### Commerce (12 files)
- `src/routes/products.ts` — Public product list/detail
- `src/routes/categories/index.ts` — Category browsing
- `src/routes/orders/index.ts` — Order placement + management
- `src/routes/payments.ts` — Generic payment routes
- `src/routes/payment-page.ts` — Payment page rendering
- `src/routes/stripe.ts` — Stripe PaymentIntent flow
- `src/routes/square.ts` — Square payment flow (legacy)
- `src/routes/shipping.ts` — Shipping rates + tracking
- `src/routes/inventory.ts` — Inventory management
- `src/routes/promo.ts` — Promo code application
- `src/routes/favorites.ts` — Wishlist/favorites
- `src/routes/units.ts` — Unit of measure reference

### Seller Dashboard (8 files)
- `src/routes/seller/dashboard.ts` — Seller stats
- `src/routes/seller/products.ts` — Seller product management
- `src/routes/seller/productImages.ts` — Image upload
- `src/routes/seller/orders.ts` — Order fulfillment
- `src/routes/seller/payments.js` — Payment history
- `src/routes/seller/settings.ts` — Store settings
- `src/routes/seller/shipping.ts` — Shipping config
- `src/routes/seller/bulkUpload.ts` — Seller bulk import

### AI & Search (4 files)
- `src/routes/chat.ts` — AI chat (Gemini 2.0 Flash)
- `src/routes/ai/index.ts` — "AI" recommendations (actually static Prisma queries)
- `src/routes/aiSearch.ts` — Meilisearch smart search (8 endpoints)
- `src/routes/search/index.ts` — Basic search

### SEO Content (10 files)
- `src/routes/buy-seo.ts` — Buy-in-city pages (DB-backed)
- `src/routes/ingredients-seo.ts` — Ingredient encyclopedia (static data)
- `src/routes/location-seo.ts` — City x cuisine pages (static data, 14K+ combos)
- `src/routes/recipes-seo.ts` — Recipe pages (static data)
- `src/routes/sellerSeo.routes.ts` — Seller signup SEO (static data, 217 pages)
- `src/routes/b2b-seo.ts` — B2B wholesale/partner pages (static data)
- `src/routes/buyerSeo.routes.ts` — Buyer discovery pages (static data)
- `src/routes/product-seo-routes.ts` — Product SEO pages (DB-backed)
- `src/routes/seo/index.ts` — Public SEO page/blog/deal list
- `src/routes/hub-routes.ts` — Location x category hub pages

### Content & Discovery (6 files)
- `src/routes/encyclopedia.ts` — Food encyclopedia (static data)
- `src/routes/recipe.routes.ts` — Recipe API
- `src/routes/recipes-expanded.ts` — Expanded recipes (~200 recipes, 16 cuisines)
- `src/routes/neighborhood.routes.ts` — Neighborhood SEO pages
- `src/routes/blog/index.ts` — Blog public routes
- `src/routes/collections.js` — Product collections

### Feeds & Sitemaps (6 files)
- `src/routes/google-merchant-feed.ts` — Google Merchant XML feed
- `src/routes/meta-catalog-feed.ts` — Meta Commerce TSV feed
- `src/routes/sitemap.routes.ts` — Main sitemap
- `src/routes/sitemap/index.ts` — Sitemap aggregator
- `src/routes/sitemap-b2b.ts` — B2B sitemap
- `src/routes/sitemap-ingredients.ts` — Ingredients sitemap
- `src/routes/sitemap-location.ts` — Location sitemap

### Notifications, Reviews, Referrals (4 files)
- `src/routes/notifications/index.ts` — Notification inbox (14 endpoints)
- `src/routes/reviews/index.ts` — Review CRUD + stats
- `src/routes/referrals.ts` — Referral system (6 endpoints)
- `src/routes/buyAgain.ts` — Buy-again (past order products)

### Other (9 files)
- `src/routes/index.ts` — Master route registration
- `src/routes/root.js` — Root redirect
- `src/routes/addresses.ts` — Address CRUD
- `src/routes/paymentMethods.ts` — Saved cards
- `src/routes/homepage.ts` — Homepage data (15 endpoints)
- `src/routes/recommendations.ts` — Pseudo-recommendations (random rotation)
- `src/routes/resolve-url.ts` — Legacy URL resolver
- `src/routes/imageProxy.ts` — Image proxy/resize
- `src/routes/uploads/index.ts` — File upload
- `src/routes/filters.ts` — Filter configuration
- `src/routes/sellers/index.ts` — Public seller list
- `src/routes/mobile/auth.ts` — Mobile auth
- `src/routes/migration.routes.ts` — Data migration utilities

### Health (3 files)
- `src/routes/health/index.ts` — Basic health
- `src/routes/health/healthz.ts` — K8s-style health
- `src/routes/health/enterprise.ts` — Deep health (DB, Redis, Meilisearch, disk)

### Customer (3 files — JS legacy)
- `src/routes/customer/cart.js` — Cart
- `src/routes/customer/orders.js` — Customer orders view
- `src/routes/customer/profile.js` — Customer profile

### Frontend SSR (3 files — JS legacy)
- `src/routes/frontend/categories.js`
- `src/routes/frontend/home.js`
- `src/routes/frontend/products.js`

### Analytics (1 file)
- `src/routes/analytics/seller.js` — Seller analytics

### Example (1 file)
- `src/routes/example/index.js` — Example/test route

---

## 5. Active Service Inventory (41 files)

| Service | File | Purpose |
|---------|------|---------|
| Admin | `admin.service.ts` | Admin utilities |
| Admin Auth | `adminAuth.service.ts` | Admin login/token |
| Admin Categories | `adminCategories.service.ts` | Category CRUD |
| Admin Dashboard | `adminDashboard.service.ts` | Stats aggregation |
| Admin Products | `adminProducts.service.ts` | Product management |
| Admin Sellers | `adminSellers.service.ts` | Seller approval |
| Admin SEO | `adminSeo.service.ts` | SEO page CRUD |
| AI Categorization | `aiCategorization.service.ts` | AI category assignment |
| AI Chat | `aiChat.service.ts` | Gemini chat + product search |
| AI Enrichment | `aiEnrichment.service.ts` | Product AI enrichment |
| AI Search | `aiSearch.service.ts` | Meilisearch smart search |
| Blog | `blog.service.ts` | Blog CRUD |
| Bulk Upload | `bulkUpload.service.ts` | CSV import |
| Captcha | `captcha.service.ts` | reCAPTCHA/hCaptcha |
| Categories | `categories.service.ts` | Category queries |
| Categorization | `categorization.service.ts` | Category classification |
| Category Assignment | `categoryAssignment.service.ts` | Product-category linking |
| CMS | `cms.service.ts` | CMS blocks + footer |
| Email | `email.service.ts` | SendGrid email sending |
| Filter | `filter.service.ts` | Dynamic filters |
| Homepage | `homepage.service.ts` | Homepage data aggregation |
| Icon | `icon.service.ts` | Category icon management |
| Inventory | `inventory.service.ts` | Stock management |
| Klaviyo | `klaviyo.service.ts` | Klaviyo event tracking + SMS |
| Notification (queue) | `notificationService.ts` | BullMQ notification queue |
| Notifications | `notifications.service.ts` | Full notification system (16 trigger types) |
| Order Notification | `orderNotification.service.ts` | Order-specific email/SMS |
| Password Reset | `passwordReset.service.ts` | Token generation + validation |
| Product Slug | `product-slug.service.ts` | Slug generation |
| Products | `products.service.ts` | Product queries |
| Promo | `promo.service.ts` | Promo code validation |
| Search | `search.service.ts` | Meilisearch integration |
| Seller Dashboard | `sellerDashboard.service.ts` | Seller analytics |
| Seller SEO | `sellerSeo.service.ts` | Seller signup pages |
| Sellers | `sellers.service.ts` | Seller queries |
| SEO | `seo.service.ts` | Public SEO pages |
| Shipping | `shipping.service.ts` | EasyPost + rate calc |
| Sitemap | `sitemap.service.ts` | Sitemap generation |
| Subcategory Assignment | `subcategoryAssignment.service.ts` | Subcategory linking |
| Tax | `tax.service.ts` | Tax calculation |
| Upload | `upload.service.ts` | S3/local file upload |

---

## 6. v3 Phase Coverage Map

| Phase | Name | Coverage | What Exists | What's Missing | Action |
|-------|------|----------|-------------|----------------|--------|
| **0** | Shared Infrastructure | **NONE** | No LLM client wrapper, no tool framework, no conversation persistence, no agent models, no Langfuse, no guardrails, no autonomy mgmt, no identity unification | Everything — this is the foundation | **BUILD_AS_SPEC** |
| **1** | CS Tool Layer + Chat | **PARTIAL** | Gemini chat (`aiChat.service.ts`), Meilisearch search (`aiSearch.service.ts`), order lookup, product search, store stats, category browsing | Conversation persistence, tool framework (function-calling), escalation to human, multi-turn context, structured tool responses, agent loop | **EXTEND_EXISTING** — wrap existing chat service with agent framework, add persistence |
| **2** | Voice | **MINIMAL** | OpenAI Whisper transcription utility (`lib/voice.ts`) — not wired to any route; excluded from prod build | Retell/Vapi integration, voice-to-agent pipeline, TTS, real-time streaming, phone number provisioning | **BUILD_AS_SPEC** — voice.ts is just a utility, not a voice agent |
| **3** | Email Agent | **PARTIAL** | SendGrid SDK (`email.service.ts`), Nodemailer (`notifySender.ts`), 16 notification trigger types (`notifications.service.ts`), Klaviyo integration, Twilio SMS | Inbound email parsing (no Postmark/SendGrid inbound), email-to-ticket, AI email response drafting, email thread tracking | **EXTEND_EXISTING** — outbound infra is strong, need inbound parse + AI drafting |
| **4** | CS Supervisor | **NONE** | No unified inbox, no prompt learning loop, no agent performance tracking, no escalation queue | Everything | **BUILD_AS_SPEC** |
| **5** | Referrals Agent | **MOSTLY** | Full referral system: 6 endpoints, Prisma model, code generation (SHA-256), $25/$10 rewards, expiry, leaderboard, self-referral blocking | Automated reward payout (currently manual), referral-triggered notifications (no email/Klaviyo on referral events), viral loop optimization, A/B testing | **EXTEND_EXISTING** — add agent automation layer on top of solid foundation |
| **6** | Seller Acquisition | **NONE** | No Prospect/Outreach/Enrichment models or routes; seller SEO pages exist but are marketing content, not acquisition automation | Prospect identification, outreach sequences, enrichment pipeline, CRM-like tracking | **BUILD_AS_SPEC** |
| **7** | WhatsApp | **NONE** | No WhatsApp integration anywhere in codebase | Everything — Twilio or Meta Business API integration | **BUILD_AS_SPEC** |
| **8** | Shopper Discovery / RAG | **PARTIAL** | Meilisearch search (8 endpoints), OpenAI embeddings (`lib/semanticSearch.ts` — inactive), `productEmbedding` model, `product_universe` model with Walmart price comparison, in-memory recipe/ingredient/encyclopedia data | pgvector not active in prod, no RAG pipeline, no retrieval-augmented chat, no knowledge base indexing, semantic search excluded from build | **EXTEND_EXISTING** — Meilisearch + embedding infrastructure exists, need RAG orchestration |
| **9** | SEO Content Engine | **MOSTLY** | 7 SEO route verticals (buy, ingredients, location, recipes, seller, buyer, b2b), AI SEO metadata (gpt-4o-mini), AI blog generation (Gemini), internal link builder (AI), SEO cron pipeline, BullMQ SEO worker, 14K+ location pages, Schema.org structured data | Content freshness automation, SEO performance feedback loop, competitive analysis, auto-optimization based on ranking data | **EXTEND_EXISTING** — massive foundation, agent adds automation intelligence |
| **10** | Cart Recovery | **MINIMAL** | `buyAgain.ts` (past order products), no cart model, no abandoned cart tracking, no recovery automation | Cart persistence model, abandonment detection, recovery email/SMS sequences, incentive logic | **BUILD_AS_SPEC** — buyAgain is not cart recovery |
| **11** | Review Response | **PARTIAL** | Review CRUD (7 endpoints), rating stats/distribution, seller notification on new review | AI review response drafting, sentiment analysis, automated response for positive reviews, escalation for negative | **EXTEND_EXISTING** — review system exists, need AI response layer |
| **12** | Merchandising | **PARTIAL** | Homepage service (15 endpoints), configurable hero/CTA/featured products/categories, seasonal deals, CMS blocks, blog section | AI-driven merchandising decisions, personalization, A/B testing, dynamic deal creation, conversion optimization | **EXTEND_EXISTING** — admin CMS exists, need AI decision layer |
| **13** | Pricing Agent | **NONE** | `product_universe` has `walmart_price_cents` and `storesgo_price_cents` for price comparison; no competitive pricing logic or automation | Price monitoring, competitive analysis, dynamic pricing rules, margin optimization | **BUILD_AS_SPEC** — product_universe provides data substrate only |
| **14** | Marketing (v3.2) | **MINIMAL** | Klaviyo integration (placed order events, SMS subscribe), Google Merchant + Meta Commerce feeds, IndexNow submission utility | Social media posting, Google Business Profile management, ad campaign creation/optimization, cross-channel attribution | **EXTEND_EXISTING** — feed infrastructure exists, need active campaign management |

---

## 7. Revised v3 Sequencing Recommendation

Given the audit findings, the original v3 phase sequence should be adjusted:

### Tier 1 — Foundation (must be first)
- **Phase 0: Shared Infrastructure** (est. 2-3 prompts)
  - LLM client abstraction (support both Gemini and OpenAI, since both are already used)
  - Tool framework with function-calling
  - Conversation persistence (new Prisma models)
  - Agent autonomy/escalation management
  - Customer identity unification
  - Langfuse observability (optional, can defer)

### Tier 2 — High-Value Extensions (leverage existing code)
- **Phase 1: CS Agent** (est. 2 prompts) — Wrap `aiChat.service.ts` + `aiSearch.service.ts`
- **Phase 5: Referrals Agent** (est. 1 prompt) — Thin automation layer on existing system
- **Phase 9: SEO Agent** (est. 1-2 prompts) — Orchestration on top of massive SEO infra
- **Phase 11: Review Response** (est. 1 prompt) — AI response on existing review system
- **Phase 12: Merchandising** (est. 1 prompt) — AI decisions on existing homepage CMS

### Tier 3 — New Builds (less existing infrastructure)
- **Phase 3: Email Agent** (est. 2 prompts) — Inbound parsing + AI drafting
- **Phase 8: RAG / Discovery** (est. 2 prompts) — Activate embeddings, build RAG pipeline
- **Phase 10: Cart Recovery** (est. 1-2 prompts) — New cart model + recovery sequences
- **Phase 14: Marketing** (est. 1-2 prompts) — Campaign management

### Tier 4 — Net New (no existing infrastructure)
- **Phase 2: Voice** (est. 2-3 prompts) — Full voice pipeline
- **Phase 4: CS Supervisor** (est. 2 prompts) — Unified inbox + learning loop
- **Phase 6: Seller Acquisition** (est. 2 prompts) — Prospecting + outreach
- **Phase 7: WhatsApp** (est. 1-2 prompts) — Channel integration
- **Phase 13: Pricing** (est. 1-2 prompts) — Competitive pricing automation

### Estimated Total: 22-30 prompts (down from original estimate by leveraging existing code)

---

## 8. Naming Collision Report

The following v3 planned model/type names would collide with or be confused with existing code:

| v3 Planned Name | Existing Collision | Resolution |
|-----------------|-------------------|------------|
| `Conversation` | None, but `ChatMessage` interface exists in `aiChat.service.ts` | Use `AiConversation` prefix to be safe |
| `Message` | None directly, but could confuse with notification `message` field | Use `AiMessage` |
| `CustomerIdentity` | `User` + `BuyerProfile` already serve this role partially | Use `AiCustomerIdentity` |
| `IdentityAlias` | None | Use `AiIdentityAlias` |
| `AutonomyLevel` | None | Use `AiAutonomyLevel` |
| `AgentTool` | None | Use `AiAgentTool` |
| `ToolExecution` | None | Use `AiToolExecution` |
| `EscalationRequest` | None | Use `AiEscalation` |
| `Notification` | **COLLISION** — `Notification` model already exists | Use `AiNotification` or reuse existing model with agent-specific fields |
| `Review` | **COLLISION** — `Review` model already exists | Reuse existing model; add `AiReviewResponse` for AI-drafted responses |
| `CartSession` | None | Safe to use as-is |
| `AbandonedCart` | None | Safe to use as-is |
| `ProspectCompany` | None | Safe to use as-is |
| `OutreachSequence` | None | Safe to use as-is |

**Recommendation:** Prefix all new agent-specific Prisma models with `Ai` to avoid any
ambiguity with the 51 existing models. Use `@@map("ai_...")` for table names.

---

## 9. Isolation Strategy

The agent suite lives entirely within `src/agent/` and is compiled by `tsconfig.agent.json`.

```
src/agent/
  ├── core/           # LLM client, tool framework, conversation persistence
  ├── tools/          # Tool definitions (wrapping existing services)
  ├── agents/         # Individual agent implementations (CS, referral, SEO, etc.)
  ├── supervisors/    # Supervisor/orchestration layer
  ├── models/         # Prisma model extensions (if needed beyond schema.prisma)
  ├── routes/         # Agent-specific API routes (mounted under /api/agent/)
  └── types/          # Agent-specific TypeScript types
```

### How Isolation Works

1. **`tsconfig.agent.json`** extends `tsconfig.json` but sets `strict: true` and only
   includes `src/agent/**/*.ts`. This means agent code is type-checked independently
   and won't be affected by the ~90 errors in existing code.

2. **No modification of existing files.** Agent tools import from existing services
   (e.g., `import { processChat } from '../services/aiChat.service.js'`) but never
   modify them.

3. **New Prisma models** are added to the canonical `prisma/schema.prisma` (this is
   the ONE exception to "don't touch existing files" — schema additions are additive
   and non-breaking).

4. **New routes** are mounted under `/api/agent/` to avoid any path collisions with
   the 100+ existing route files.

5. **The production build** (`tsconfig.build.json`) will eventually need `src/agent/**/*`
   added to its `include` list — but only when we're ready to deploy agents.

---

## 10. Environment Variables Inventory

### Currently Used (from env.example)

| Category | Variables | Used By |
|----------|-----------|---------|
| Core | `NODE_ENV`, `PORT`, `HOST`, `LOG_LEVEL` | server.ts |
| Database | `DATABASE_URL` | Prisma |
| Redis | `REDIS_URL` | BullMQ workers, cache |
| JWT | `JWT_SECRET`, `ADMIN_JWT_SECRET`, `SELLER_JWT_SECRET`, `*_EXPIRES_IN` | Auth middleware |
| OpenAI | `OPENAI_API_KEY`, `OPENAI_MODEL` (gpt-4o-mini), `OPENAI_EMBEDDING_MODEL` | AI SEO, embeddings |
| Email | `SMTP_HOST/PORT/USER/PASS/FROM`, `SENDGRID_API_KEY` | Email services |
| SMS | `TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER` | Order notifications |
| Sentry | `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE` | Error tracking |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Payments |
| Square | `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_APP_ID`, `SQUARE_ENV` | Legacy payments |
| Storage | `OCI_NAMESPACE/BUCKET_NAME/REGION/ACCESS_KEY_ID/SECRET_ACCESS_KEY` | S3 uploads |
| URLs | `FRONTEND_URL`, `SELLER_DASHBOARD_URL`, `ADMIN_DASHBOARD_URL`, `PUBLIC_BASE_URL` | Email links |
| CORS | `CORS_ORIGIN`, `RATE_LIMIT_MAX/WINDOW_MS` | Security |
| Cron | `CRON_ENABLED`, `SEO_CRON_SCHEDULE`, `CLEANUP_CRON_SCHEDULE` | Cron jobs |
| Blog | `AUTOBLOG_ENABLED`, `AUTOBLOG_CRON_SCHEDULE`, `BLOG_LANGS` | Autoblog |
| Captcha | `CAPTCHA_PROVIDER`, `RECAPTCHA_SECRET_KEY`, `HCAPTCHA_SECRET_KEY`, `CAPTCHA_ENABLED` | Auth |
| Features | `FEATURE_AI_ENRICHMENT/NOTIFICATIONS/ANALYTICS/SEO_GENERATION/CAPTCHA/AUTOBLOG` | Feature flags |
| PM2 | `PM2_INSTANCES` | Process manager |

### NOT in env.example but Used in Code

| Variable | Used By | Notes |
|----------|---------|-------|
| `GEMINI_API_KEY` | `aiChat.service.ts`, `ai/blog.ts` | Chat + blog generation |
| `KLAVIYO_API_KEY` | `klaviyo.service.ts` | Marketing automation |
| `OPENAI_MODEL_LIGHT` | `ai/seo.ts` | Defaults to `gpt-4o-mini` |
| `MEILISEARCH_HOST` | `aiSearch.service.ts` | Defaults to `http://127.0.0.1:7700` |
| `ADMIN_EMAIL` | `seoReportCron.ts` | SEO report recipient |
| `AI_SEO_BATCH` | `ai/seo.ts` | Batch size, defaults to 25 |
| `STRIPE_PUBLISHABLE_KEY` | `routes/stripe.ts` | Client-side key |

### v3 Agent Suite Will Need (new variables)

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude API for agent reasoning (if using Claude) |
| `LANGFUSE_SECRET_KEY` / `LANGFUSE_PUBLIC_KEY` | Observability |
| `LANGFUSE_HOST` | Self-hosted or cloud Langfuse |
| `RETELL_API_KEY` or `VAPI_API_KEY` | Voice agent (Phase 2) |
| `WHATSAPP_API_TOKEN` | WhatsApp Business API (Phase 7) |
| `POSTMARK_SERVER_TOKEN` or `SENDGRID_INBOUND_WEBHOOK_SECRET` | Inbound email (Phase 3) |

**No collisions expected** between existing and new env vars.

---

## 11. Production Integration Points

### Payment Processing
- **Stripe** (primary): SDK v20.4.0, auth-and-capture flow with manual capture, 3DS forced,
  saved card support. API version `2024-12-18.acacia`.
- **Square** (legacy): REST API via fetch, sandbox/production toggle. `BuyerProfile` has
  both `stripeCustomerId` and `squareCustomerId` fields.
- **Agent suite impact:** Payment tools should use Stripe exclusively. Square can be ignored.

### Search — Meilisearch
- Local instance at `127.0.0.1:7700` (configurable via `MEILISEARCH_HOST`)
- Used by `aiSearch.service.ts` for all product search (paginated, faceted, autocomplete)
- The agent chat already calls `aiSmartSearch()` for product lookups
- **Agent suite impact:** Agent tools should call `aiSmartSearch()` rather than raw Meilisearch

### Cache/Queue — Redis + BullMQ
- `REDIS_URL` for BullMQ queues, caching
- Queues: `seo-tasks`, `notifications`, `ai_categorization`, `autoblog`
- **Note:** BullMQ workers are excluded from the production build. If agent suite needs
  queues, it should define its own workers in `src/agent/` and ensure they're included
  in the build.

### AI/LLM — Dual Provider
- **Google Gemini 2.0 Flash**: Chat (`aiChat.service.ts`), blog generation (`ai/blog.ts`)
  — via REST fetch and `@google/generative-ai` SDK respectively
- **OpenAI gpt-4o-mini**: SEO metadata (`ai/seo.ts`, `plugins/ai/openai.ts`,
  `workers/seoWorker.ts`) — via `openai` SDK
- **OpenAI text-embedding-3-small**: Embeddings (`lib/semanticSearch.ts`) — inactive
- **Agent suite impact:** The LLM client abstraction in Phase 0 MUST support both Gemini
  and OpenAI, plus whatever model the agent suite uses (Claude, etc.). Do not rip out
  existing Gemini usage.

### External Services
- **SendGrid**: Email (SDK + REST)
- **Twilio**: SMS (REST)
- **Klaviyo**: Marketing events + SMS subscribe
- **EasyPost**: Shipping rates (`@easypost/api`)
- **Sentry**: Error tracking
- **OCI Object Storage**: File uploads (S3-compatible)

---

## 12. Critical Questions For Jon Before Proceeding To Prompt 2

### Architecture

- **Which LLM for agent reasoning?** The codebase already uses Gemini (chat) and OpenAI
  (SEO). Should the agent suite use Claude (Anthropic), stick with one of the existing
  providers, or support all three? This affects the Phase 0 LLM client abstraction.

- **Conversation persistence backend?** Options: (a) Prisma/PostgreSQL (simplest,
  consistent with existing stack), (b) Redis (faster but volatile), (c) dedicated
  service. Recommendation: PostgreSQL via Prisma.

- **Should agents share the existing `GEMINI_API_KEY` / `OPENAI_API_KEY`, or get
  their own keys?** Separate keys enable per-agent usage tracking and cost allocation.

### Scope

- **Are Phases 2 (Voice), 6 (Seller Acquisition), 7 (WhatsApp), and 13 (Pricing)
  still in scope for the initial build?** These have zero existing infrastructure and
  are the most expensive to build. Deferring them to v3.1 would reduce the build from
  ~28 prompts to ~18.

- **Phase 5 (Referrals): The existing system doesn't auto-pay rewards.** The `complete`
  endpoint marks status but doesn't credit wallets. Should the agent automate payouts,
  or is manual payout intentional?

- **Phase 10 (Cart Recovery): There's no cart model in the schema.** Does the frontend
  store carts client-side? If so, cart recovery needs a server-side cart persistence
  model added to the schema first.

### Integration

- **Stripe vs Square:** Stripe is clearly the primary provider (labeled as Square
  replacement). Can the agent suite ignore Square entirely, or do some sellers still
  use it?

- **Notification routing:** Three overlapping email implementations exist. Should the
  agent suite use `notifications.service.ts` (most complete, 16 trigger types) as
  the canonical notification path, or build its own?

- **Klaviyo:** Should agent-triggered events (e.g., referral completed, cart abandoned)
  be sent to Klaviyo for marketing automation, or handled entirely in-house?

### Production

- **When should `src/agent/` be added to `tsconfig.build.json`?** After a specific
  phase, or all-at-once when the suite is complete?

- **Will agents need their own PM2 process?** The existing `ecosystem.config.cjs` has
  `storesgo-api` and `storesgo-worker`. An agent process (for background agent tasks,
  queue processing) may be needed.

- **`GEMINI_API_KEY` is not in env.example** but is used in production code. Should it
  be added, or is this intentional to keep it undocumented?

---

## 13. Next Steps

1. **Jon answers the questions in Section 12.** These answers determine Phase 0 design
   decisions that affect every subsequent phase.

2. **Prompt 2: Phase 0 — Shared Infrastructure.** Build the agent foundation:
   - LLM client abstraction (multi-provider)
   - Tool framework with function-calling
   - Conversation persistence (Prisma models)
   - Agent base class / orchestration loop
   - New Prisma models (`AiConversation`, `AiMessage`, `AiToolExecution`, etc.)
   - `prisma migrate dev` to create the new tables

3. **Prompt 3: Phase 1 — CS Agent.** First agent wrapping existing chat + search services.

4. **Sequential execution of Tiers 2-4** per the revised sequencing in Section 7.

---

*End of audit. All claims in this document are backed by direct file reads from the
`f71099e` commit of the StoresGo backend repository.*
