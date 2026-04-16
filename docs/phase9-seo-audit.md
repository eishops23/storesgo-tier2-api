# Phase 9 — SEO Agent — Audit (Prompt 1)

**Status:** Audit-only. Zero production code written. No schema changes. No tests run. No commits.
**Date:** 2026-04-10
**Phase classification:** EXTEND_EXISTING (Tier 2). Operator-facing — first non-customer, non-seller audience for the framework.
**Goal of Phase 9:** Help the StoresGo operator (Jon) audit existing SEO content, identify content gaps, draft new blog post outlines, and surface internal-link suggestions. **L0 read-only tools only in Prompt 3.** All write operations are deferred to a later phase.

---

## TL;DR — what changed from the prompt's framing

Three findings from Phase A change the shape of Phase 9 versus what the prompt assumed:

1. **The "14K+ pages" claim is misleading.** The vertical SEO routes (b2b-seo, ingredients-seo, location-seo, recipes-seo, buy-seo) generate URLs **dynamically on each request** from `products` + cuisine/location taxonomy. They are NOT rows in `seo_pages`. The actual auditable surface for the agent is the two real content tables: `seo_pages` (`SeoPage` model) and `blog_posts` (`BlogPost` model). Phase 9 must operate on those, plus dynamic-URL-generating queries against the underlying product taxonomy.
2. **Admin auth uses a SEPARATE `ADMIN_JWT_SECRET`.** This is the opposite of the Phase 11 finding (where buyers and sellers shared `JWT_SECRET`). Operators have their own JWT secret and a distinct `AdminUser` model. Phase 9 can lean on the existing `requireAdmin` / `app.authenticateAdmin` patterns at dispatch time.
3. **Embeddings already exist.** Both `SeoPage` and `BlogPost` have `embedding Float[]` columns. Internal-link suggestions and "find similar pages" tools can use cosine similarity over those vectors without building a vector store and without waiting for Phase 8 (RAG). This is a meaningful unblocker.

Phase 9 is **not blocked**. It is buildable on the existing infrastructure with the scope below.

---

## B1. Schema inventory

### `model SeoPage` (prisma/schema.prisma:365-380)

```
model SeoPage {
  id              Int       @id @default(autoincrement())
  type            String?
  title           String
  slug            String    @unique
  metaTitle       String?
  metaDescription String?
  contentHtml     String?
  published       Boolean   @default(false)
  publishedAt     DateTime?
  embedding       Float[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@map("seo_pages")
}
```

**Observations:**
- Plain camelCase columns, no `@map` annotations on individual fields. Table name `seo_pages`.
- `type` is a free-form string. Per the admin/seo route comment header, valid values are `blog | guide | deal | landing | page` — but the column is nullable and there is no enum constraint.
- `embedding Float[]` is present but the audit cannot tell from schema alone whether it is populated for existing rows. Operator should verify before relying on it.
- No `keywords`, no `language`, no aggregate analytics fields.
- Only the `slug` unique index exists. No index on `published`, `type`, or `updatedAt`. Filtering by status is a sequential scan.
- No `sellerId` or content-ownership column — `SeoPage` is operator-owned globally.

### `model BlogPost` (prisma/schema.prisma:640-669)

```
model BlogPost {
  id              Int       @id @default(autoincrement())
  title           String
  slug            String    @unique
  contentHtml     String?
  excerpt         String?
  featuredImage   String?
  metaTitle       String?
  metaDescription String?
  language        String?   @default("en")
  source          String?
  category        String?
  tags            String[]  @default([])
  published       Boolean   @default(false)
  publishedAt     DateTime?
  aiModel         String?
  aiPromptHash    String?
  sellerId        Int?
  productId       Int?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  embedding       Float[]   @default([])
  imageUrl        String?
  keywords        String[]  @default([])
  seller          Seller?   @relation(fields: [sellerId], references: [id])

  @@index([published, publishedAt(sort: Desc)], map: "idx_blog_published")
  @@index([source], map: "idx_blog_source")
  @@map("blog_posts")
}
```

**Observations:**
- Much richer than `SeoPage`: language, category, tags, keywords, source, AI generation metadata, optional seller/product attribution.
- `source` distinguishes `autoblog | manual | imported`.
- Has an `aiPromptHash` column — useful for the agent to detect prior runs and avoid duplicate drafts.
- Embedding column exists with `@default([])` — likely populated for newer rows but not guaranteed for legacy.
- Two real indexes: `idx_blog_published` (composite on `published, publishedAt DESC`) and `idx_blog_source`. Decent.
- `seller` relation is optional — most blog posts are generic (not seller-attributed), some are tied to a specific seller's marketing.

### `model AdminUser` (prisma/schema.prisma:382-391)

```
model AdminUser {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  role      String   @default("admin")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("admin_users")
}
```

`AdminUser.id` is `Int`. The admin JWT carries `{ adminId, email, role }` where `adminId` is this integer PK. **No relation to `User`** — admins are a separate identity space from buyers and sellers. This is the opposite of the Phase 11 seller auth pattern, where `Seller.userId` linked back to `User`.

### Models intentionally NOT covered

- `Product`, `Category`, and the cuisine/location taxonomy tables drive the dynamically-rendered vertical SEO URLs. The agent can read them via `prisma.product.*` queries to compute coverage gaps, but it does not own them and Phase 9 will not write to them.
- `productEmbedding` (line 420 of schema) exists for product-level vectors. Out of scope for Phase 9 — that's Phase 18 territory.

---

## B2. Service layer inventory

Unlike Phase 5 (referrals) and Phase 11 (reviews), **Phase 9 already has a real service layer.** `src/services/seo.service.ts` and `src/services/blog.service.ts` both exist and export functions the agent tools can wrap directly via dynamic import. **Prompt 2 will likely be a small extension rather than a full extraction.**

### `src/services/seo.service.ts` — 179 lines, 4 exported functions

```ts
listSeoPages(query: SeoPageListQuery): Promise<PaginatedResult<SeoPageListItem>>
getSeoPageBySlug(slug: string): Promise<SeoPageDetail | null>
listSeasonalDeals(query: { page?, pageSize?, activeOnly? }): Promise<PaginatedResult<SeasonalDealItem>>
getSeasonalDealById(id: number): Promise<SeasonalDealItem | null>
```

**Note:** the service is named `seo.service.ts` but two of its four functions are about `SeasonalDeal`, not SEO content. Phase 9 will only use the two real SEO functions. The seasonal deals functions can be ignored or moved to a `deals.service.ts` in a separate cleanup pass (out of scope).

`SeoPageListQuery` accepts `page`, `pageSize`, `q` (text search across title and metaDescription). Returns published rows only — there is currently no admin-facing "list all SEO pages including drafts" service function. The admin/seo route uses controller functions in `src/controllers/adminSeo.controller.ts` which Phase A did not read in full but which presumably bypass the `published: true` filter.

**Service gap to fill in Prompt 2:** the agent needs read access to **draft** SEO pages too (so the operator can audit unfinished work). Add a new exported function like `listAllSeoPagesForOperator(opts)` that does NOT force `published: true`.

### `src/services/blog.service.ts` — 360 lines, 9 exported functions

```ts
listBlogPosts(query: BlogPostListQuery): Promise<PaginatedResult<BlogPostListItem>>
getBlogPostBySlug(slug: string): Promise<BlogPostDetail | null>
getAllBlogSlugs(): Promise<{ slug: string; updatedAt: Date }[]>
getRecentBlogPosts(limit?: number, language?: string): Promise<BlogPostListItem[]>
getBlogCategories(): Promise<{ category: string; count: number }[]>
getBlogTags(): Promise<string[]>
hasBlogPostToday(source?: string): Promise<boolean>
getBlogPostStats(): Promise<{ total, published, bySource }>
getRelatedBlogPosts(slug: string, limit?: number): Promise<BlogPostListItem[]>
```

This is a much more complete service. Most of the agent's blog-side tools can wrap these directly without modification. `getRelatedBlogPosts` is especially useful — it already implements category + tag overlap matching, which is the foundation of internal-link suggestions for blog content. It does **not** use the `embedding` column yet, so the suggestions are taxonomy-based, not semantic. Prompt 2 could optionally add a `getSimilarBlogPostsByEmbedding` helper, but that's a Phase 8 RAG concern and can be deferred.

**Service gap to fill in Prompt 2:** like `seo.service.ts`, `blog.service.ts` filters everything by `published: true`. The agent needs `listAllBlogPostsForOperator(opts)` that surfaces drafts too.

### Other relevant services

- `src/jobs/autoblog.ts` — referenced from `admin/blog.ts:10` (`runAutoblogOnce`). This is an existing autoblog trigger that the admin route exposes via `POST /api/admin/blog/autoblog/trigger`. Phase 9 does NOT need to modify this. It is a production-grade content generator that already runs on a cron. The agent can read its status and recent output via the existing service functions, but the agent should never trigger it (that would be an L2/L3 mutation and is explicitly out of Prompt 3 scope).

---

## B3. Route inventory

### Admin routes (operator-only, `requireAdmin` or `authenticateAdmin`)

**`src/routes/admin/seo.ts` — 83 lines, 5 endpoints (CRUD on `SeoPage`):**

| # | Method | Path | Auth | Notes |
|---|---|---|---|---|
| 1 | GET | `/pages` | requireAdmin | Paginated list with `type`, `published`, `q` filters |
| 2 | GET | `/pages/:id` | requireAdmin | Single page by ID |
| 3 | POST | `/pages` | requireAdmin | Create — body: `type?, slug, title, content?, metaTitle?, metaDescription?, published?` |
| 4 | PATCH | `/pages/:id` | requireAdmin | Update arbitrary fields |
| 5 | DELETE | `/pages/:id` | requireAdmin | Delete by ID |

All five delegate to `src/controllers/adminSeo.controller.ts` (not read in full during this audit; flagged for Prompt 2 to read).

**`src/routes/admin/blog.ts` — 287 lines, 9 endpoints (CRUD + autoblog control):**

| # | Method | Path | Auth | Notes |
|---|---|---|---|---|
| 1 | GET | `/` | authenticateAdmin (hook) | List all blog posts, paginated, filter by source/published/q |
| 2 | GET | `/stats` | authenticateAdmin | Wraps `getBlogPostStats()` |
| 3 | GET | `/:id` | authenticateAdmin | Single post |
| 4 | PUT | `/:id` | authenticateAdmin | Update |
| 5 | DELETE | `/:id` | authenticateAdmin | Delete |
| 6 | PUT | `/:id/publish` | authenticateAdmin | Set `published: true` |
| 7 | PUT | `/:id/unpublish` | authenticateAdmin | Set `published: false` |
| 8 | POST | `/autoblog/trigger` | authenticateAdmin | Calls `runAutoblogOnce()` from `src/jobs/autoblog.ts` |
| 9 | GET | `/autoblog/status` | authenticateAdmin | Reads autoblog state |

The blog route uses an `app.addHook("preHandler", app.authenticateAdmin)` instead of per-route guards. Same effect, different style.

### Public vertical SEO routes (read-only, no auth)

These are the "14K+ pages" the transfer doc references. **They generate content dynamically from product/taxonomy queries on each request — they do NOT correspond to rows in any SEO content table.** Phase 9 cannot "audit a slug" against these because there's no row to audit; the agent would have to invoke the route's own computation.

| File | Endpoints | Pattern |
|---|---|---|
| `src/routes/buy-seo.ts` | `GET /:product/:city`, `POST /waitlist` | Cached 2 min, parallel queries, ~315 lines |
| `src/routes/b2b-seo.ts` | 8 endpoints incl `/wholesale/:cuisine/:location`, `/partners/:cuisine/:location`, sitemaps, lead capture | |
| `src/routes/ingredients-seo.ts` | 6 endpoints incl `/:slug`, `/category/:category`, `/cuisine/:cuisine`, search, sitemap | |
| `src/routes/location-seo.ts` | 6 endpoints — `/:cuisine`, `/:cuisine/:state`, `/:cuisine/:state/:city`, sitemap, stats | |
| `src/routes/recipes-seo.ts` | 13 endpoints — by slug, cuisine, category, collection, tag, ingredient, search, sitemap, stats | |
| `src/routes/product-seo-routes.ts` | (not enumerated) | |

**Implication for Phase 9 tools:** these are useful as **traffic and coverage data sources** (e.g. "how many ingredient pages exist for Caribbean cuisine?") via the `/stats` endpoints they expose, but they are NOT auditable by slug in the way blog posts are. The auditable surface is `SeoPage` rows (likely the `landing` and `guide` types) and `BlogPost` rows.

### Sitemap routes (public, read-only)

| File | Endpoint | Purpose |
|---|---|---|
| `src/routes/sitemap.routes.ts` | `GET /sitemap.xml`, `GET /sitemap-stats` | Top-level sitemap + aggregate stats |
| `src/routes/sitemap-b2b.ts` | `GET /b2b-wholesale.xml`, `GET /b2b-partners.xml` | |
| `src/routes/sitemap-ingredients.ts` | `GET /ingredients.xml` | |
| `src/routes/sitemap-location.ts` | `GET /locations.xml`, `GET /locations-index.xml` | |

`/sitemap-stats` is a strong candidate for the agent to wrap — it presumably returns the high-level counts the agent needs to answer "how many pages exist in each vertical".

---

## B4. Data volume check (gate for phase viability)

The transfer doc claims "14K+ SEO pages, 7 verticals". Phase A confirms that this number refers to the **dynamically-generated URLs** from the 6 vertical SEO route files plus their sitemaps, **not** rows in `seo_pages`. The actual row counts are unknown without running queries.

### Operator must run before Prompt 2

```sql
SELECT COUNT(*) FROM seo_pages;
SELECT type, COUNT(*) FROM seo_pages GROUP BY type;
SELECT published, COUNT(*) FROM seo_pages GROUP BY published;
SELECT COUNT(*) FROM seo_pages WHERE embedding IS NOT NULL AND array_length(embedding, 1) > 0;

SELECT COUNT(*) FROM blog_posts;
SELECT source, COUNT(*) FROM blog_posts GROUP BY source;
SELECT published, COUNT(*) FROM blog_posts GROUP BY published;
SELECT language, COUNT(*) FROM blog_posts GROUP BY language;
SELECT COUNT(*) FROM blog_posts WHERE embedding IS NOT NULL AND array_length(embedding, 1) > 0;

\d seo_pages
\d blog_posts
\d admin_users
```

### Production-block clauses

- **If `SELECT COUNT(*) FROM blog_posts` returns < 50** the blog-side tools have nothing to operate on. Phase 9 should still ship for `seo_pages`, but the blog tools would be premature. Recommend deferring the blog tools and shipping only the SEO page tools in Prompt 3.
- **If `SELECT COUNT(*) FROM seo_pages` returns < 20** the SEO-page-side tools are also premature. In that case Phase 9 is strategically blocked and should be deferred until the operator seeds at least one full vertical of landing pages.
- **If neither table has populated `embedding` columns** the semantic-similarity tool falls back to taxonomy/keyword matching only. Not a blocker — `getRelatedBlogPosts` already does this — but the audit should flag that the embedding-based "similar pages" feature is degraded.

These queries are NOT run as part of this audit (audit-only constraint). Operator must confirm row counts before Prompt 2.

---

## B5. Operator identity pattern

### Mechanism — load-bearing finding

**Admins use a SEPARATE `ADMIN_JWT_SECRET` env var.** This is distinct from the `JWT_SECRET` used for buyers and sellers. Two coexisting admin auth helpers exist in the codebase:

1. **`src/utils/requireAdmin.ts`** (used by `routes/admin/seo.ts`)
   ```ts
   const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "superadminsecret";

   export async function requireAdmin(request, reply): Promise<void> {
     // Bearer token from Authorization header
     const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as AdminPayload;
     const validRoles = ["admin", "superadmin", "ADMIN", "SUPER_ADMIN"];
     if (!decoded.role || !validRoles.includes(decoded.role)) { 401; }
     request.admin = decoded;
   }
   ```
   `AdminPayload = { adminId: number, email: string, role: string }`.

2. **`src/middleware/authAdmin.ts`** (Fastify plugin, used by `routes/admin/blog.ts`)
   ```ts
   app.decorate("authenticateAdmin", async (request, reply) => {
     const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || "secret") as any;
     if (!decoded || decoded.role !== "admin") { 403; }
     request.admin = decoded;
   });
   ```
   This one only accepts the lowercase `admin` role, not `superadmin`. Inconsistent with `requireAdmin` — flagged as tech debt below.

### How the agent will resolve operator identity

Two clean options:

**(a) Reuse `requireAdmin` at dispatch time.** The route layer (Prompt 4) reads the admin token, calls `jwt.verify(token, ADMIN_JWT_SECRET)`, extracts `adminId`, and passes it into `runSeo({ ..., adminId })`. The agent context grows a new optional field `ctx.adminId?: number`.

**(b) Keep operator identity opaque.** Treat the dispatcher as the only enforcement layer — if the request reaches the agent at all, it has already passed `requireAdmin`. The tools do not check ownership because there's no per-row ownership for SEO content (it's all global to the platform).

**Recommendation: hybrid.** Add `ctx.adminId?: number` for audit-trail purposes (so `ai_messages` rows know which operator initiated the run), but do NOT enforce ownership checks in the tools — there is nothing to scope by. SEO content is global. The dispatcher's `requireAdmin` check is the only gate; once past it, the operator can read any SEO data.

### Framework extension required

`ToolContext` and `RunInput` will need an additional optional field:

```ts
sellerId?: number;     // Phase 11 — seller-scoped tools
adminId?: number;      // Phase 9 — operator-scoped audit trail (NEW)
```

This is the second additive extension to the framework, mirroring the Phase 11 pattern. Strictly additive, backward-compatible. Phase 1 / 5 / 11 tools all continue to work because the field is optional.

### Inconsistency to flag (NOT Phase 9's job to fix)

The two admin auth helpers disagree on accepted roles. `requireAdmin` accepts `admin | superadmin | ADMIN | SUPER_ADMIN`; `authenticateAdmin` accepts only `admin`. This is a small bug — a `superadmin` user can use `/api/admin/seo/*` but cannot use `/api/admin/blog/*`. Flag in `docs/tech-debt-backlog.md` if it isn't already there. Phase 9 does not need to resolve this; the agent only needs to know that BOTH gates exist.

---

## B6. Autonomy level assignment

Following the prompt directive: **L0 only in Prompt 3.** All write tools deferred.

| Tool | Level | Justification |
|---|---|---|
| `audit_seo_page` | L0 | Read a `SeoPage` row by slug, return structural quality metrics |
| `audit_blog_post` | L0 | Read a `BlogPost` row by slug, return structural quality metrics |
| `list_blog_drafts` | L0 | Read unpublished `BlogPost` rows for the operator to review |
| `find_content_gaps` | L0 | Aggregate query over blog categories vs. product taxonomy |
| `find_orphan_blog_posts` | L0 | Pages with no inbound links (heuristic — see B7 caveat) |
| `find_similar_blog_posts` | L0 | Wraps `getRelatedBlogPosts` (taxonomy-based) or embedding cosine sim |
| `get_blog_stats` | L0 | Wraps `getBlogPostStats()` |
| `draft_blog_post_outline` | L0 | Returns context only — the LLM writes the outline in its reply |
| *(deferred)* `update_seo_page_meta` | L1/L2 | Defer to a later phase |
| *(deferred)* `publish_blog_post` | L2 | Defer to a later phase |

**`draft_blog_post_outline` discussion:** following the Phase 11 `draft_response` pattern exactly. The tool returns context (target topic, recent related posts, suggested keywords from taxonomy, target word count guidance) and the LLM composes the actual outline in its assistant message. Nothing is persisted. The operator copy-pastes into the existing admin/blog UI. **No `publish_*` tool exists in Prompt 3 by design.**

---

## B7. Proposed tool list (8 tools for Prompt 3)

All tools live under `src/agent/tools/seo/`. Registered via `registerSeoTools(registry)`. All wrap `src/services/seo.service.ts` or `src/services/blog.service.ts` via dynamic import (Bug 1 pattern).

### 1. `audit_seo_page` — L0
- **Description:** "Audit the structural SEO quality of a single SEO page by slug. Reports title length, meta-description length, content word count, presence of headings, and basic issues (missing meta, too short, too long). Read-only — does not modify the page."
- **Args:** `{ slug: z.string().min(1) }`
- **Ownership check:** none — operator-global content. Tool requires `ctx.adminId !== undefined` though, as the dispatch-level guard.
- **Wraps:** new `getSeoPageBySlugForOperator(slug)` (includes drafts) — extension to `seo.service.ts` in Prompt 2.
- **Returns:** `{ slug, title, titleLength, metaTitle, metaTitleLength, metaDescription, metaDescriptionLength, contentWordCount, hasH1, hasH2, published, issues: string[] }`
- **Timeout:** 5000ms

### 2. `audit_blog_post` — L0
- **Description:** "Audit the structural SEO quality of a single blog post by slug. Same checks as audit_seo_page, plus tag/keyword coverage and category."
- **Args:** `{ slug: z.string().min(1) }`
- **Wraps:** new `getBlogPostBySlugForOperator(slug)` (includes drafts)
- **Returns:** same shape as audit_seo_page plus `tags`, `keywords`, `category`
- **Timeout:** 5000ms

### 3. `list_blog_drafts` — L0
- **Description:** "List unpublished blog posts the operator has drafted but not yet published. Useful for finding work-in-progress content."
- **Args:** `{ limit?: z.number().int().min(1).max(50) }`
- **Wraps:** new `listAllBlogPostsForOperator({ published: false, limit })`
- **Timeout:** 5000ms

### 4. `find_content_gaps` — L0
- **Description:** "Find product categories or cuisine taxonomies that have NO blog posts or SEO pages targeting them. Helps the operator decide what to write about next."
- **Args:** `{ taxonomy?: 'cuisine' | 'category' | 'ingredient' (default 'cuisine') }`
- **Wraps:** new `findContentGapsByTaxonomy(taxonomy)` — Prompt 2 will compose this from existing `prisma.blogPost.groupBy({ by: ['category'] })` plus a query over the product taxonomy table (TBD which one — Prompt 2 will pick the right one after reading `routes/ingredients-seo.ts` for the canonical cuisine list).
- **Returns:** `{ taxonomyName, totalEntries, withCoverage, withoutCoverage, gaps: string[] }`
- **Timeout:** 8000ms

### 5. `find_orphan_blog_posts` — L0
- **Description:** "Find published blog posts that no other blog post links to internally. These are content the operator has invested in but isn't promoting."
- **Args:** `{ limit?: z.number().int().min(1).max(50) }`
- **Wraps:** new `findOrphanBlogPosts(opts)` — Prompt 2 will write this. **Caveat:** internal-link analysis requires parsing `contentHtml` for `<a href="/blog/...">` patterns. This is doable with a regex but is best-effort. Document the heuristic in JSDoc.
- **Timeout:** 8000ms

### 6. `find_similar_blog_posts` — L0
- **Description:** "Find blog posts similar to a given slug, by category and tag overlap. Useful for suggesting internal links the operator should add."
- **Args:** `{ slug: z.string().min(1), limit?: z.number().int().min(1).max(20) }`
- **Wraps:** existing `getRelatedBlogPosts(slug, limit)` from `blog.service.ts:301-359` — already implemented.
- **Returns:** the existing `BlogPostListItem[]` shape.
- **Timeout:** 5000ms

### 7. `get_blog_stats` — L0
- **Description:** "Get aggregate blog post statistics: total count, published count, breakdown by source (autoblog, manual, imported)."
- **Args:** `{}`
- **Wraps:** existing `getBlogPostStats()` from `blog.service.ts:274-296` — already implemented.
- **Timeout:** 3000ms

### 8. `draft_blog_post_outline` — L0
- **Description:** "Load context for drafting a new blog post outline on a given topic. Returns related existing posts, taxonomy hints, and tone guidance — but does NOT return the finished outline. The agent composes the outline in its user-facing reply based on this context. Nothing is persisted."
- **Args:** `{ topic: z.string().min(3).max(200), targetCategory?: z.string().optional() }`
- **Wraps:** new `loadDraftingContext(topic, opts)` — composes from `getRelatedBlogPosts` + `getBlogCategories` + `getBlogTags`.
- **Returns:** `{ topic, suggestedCategory, suggestedTags, relatedExistingPosts: BlogPostListItem[], suggestedToneNotes }`
- **Timeout:** 8000ms (slightly longer because it touches multiple service functions)

**Hard rule honored:** no tool publishes, modifies, or deletes any content. There are no `update_*`, `publish_*`, or `delete_*` tools in this registry. Human-in-loop is enforced by absence.

---

## B8. System prompt requirements

### Domain knowledge to encode
- SEO basics: title tag (50-60 char ideal), meta description (150-160 char ideal), single H1, descending heading hierarchy, internal linking, keyword targeting, structured data.
- StoresGo-specific: the 7 verticals (b2b, ingredients, location, recipes, buy, products, blog), the cuisine taxonomy, the ethnic-grocery audience.
- Difference between an `SeoPage` row (manually curated landing/guide) and a `BlogPost` row (autoblog or manual blog content).
- The autoblog cron exists and produces ~1 post/day from `src/jobs/autoblog.ts` — the agent should not duplicate that work, only audit and supplement.

### Example operator utterances (10)
1. "Audit the SEO page for /caribbean-hot-sauce"
2. "What's the SEO quality of our latest blog post?"
3. "Show me my unpublished blog drafts"
4. "What content gaps do we have in the Haitian food vertical?"
5. "Which blog posts have no internal links pointing to them?"
6. "Find blog posts similar to /blog/best-caribbean-hot-sauces"
7. "What's our blog stats — how many published vs draft?"
8. "Draft an outline for a blog post about traditional Haitian breakfast dishes"
9. "Are there cuisines we haven't written about yet?"
10. "Suggest internal links for /blog/ackee-and-saltfish"

### Forbidden behaviors (the 5 from the prompt)
1. **NEVER PUBLISH content automatically.** Always return drafts for the operator to review.
2. **NEVER MODIFY live SEO metadata.** Always suggest, never write.
3. **NEVER GUESS metrics.** Only report what tools return. If a tool returns null or empty, say so — do not invent numbers.
4. **NEVER MAKE UP page URLs or slugs.** Only reference slugs that came back from a tool result.
5. **NEVER FABRICATE keyword data.** The agent has no access to Google Search Console, Ahrefs, or any external SEO tooling — confirmed in B5 below. If asked for keyword positions, the agent must say it does not have that data.

### Additional forbidden behaviors specific to operator-facing tone
6. **NEVER speak in marketing-speak.** The operator is a developer/founder, not a content marketing client. Terse, technical, direct.
7. **NEVER apologize for limitations.** State them and move on.
8. **NEVER recommend paid SEO tooling.** The operator has explicitly chosen not to integrate external SEO services. Don't pitch them.

### Compliance commitment
**I will prepend the CRITICAL — TOOL USE IS MANDATORY block verbatim from `referrals/system-prompt.ts:9-23`, adapted for the 8 SEO tool names. Bug 4 will not recur.**

The prompt template will include an `{{operatorContext}}` placeholder analogous to Phase 11's `{{sellerContext}}`. Populated with the admin email when `ctx.adminId` is set, otherwise an "operator not authenticated" string.

---

## B9. Route integration choice

Three options:

**(a) Extend `/api/chat`** with an `seo` keyword-routed branch like reviews/referrals/cs-chat. Lowest delta, highest framework consistency. But the public chat widget is the WRONG place for an operator-only feature — there is no reason a customer-facing chat surface should ever resolve a `seo` keyword.

**(b) New `/api/admin/agent/seo` endpoint** gated by `requireAdmin`. Operator-only by definition. Bypasses the keyword router entirely. The dispatch hands directly to `runSeo({ userText, adminId, conversationId })`. Consistent with the existing admin route convention (`/api/admin/*`).

**(c) Claude Code skill only** — no web route at all. The operator runs the agent locally via `claude` CLI. Strictly correct from a security standpoint (zero web attack surface), but it deprives Phase 9 of the dispatch + persistence + observability path that the rest of the agent suite uses.

### Recommendation: **(b) — new `POST /api/admin/agent/seo`**

This is the right call for SEO specifically. The agent is operator-only. There is no benefit to mixing it into the public chat surface. The existing `/api/admin/*` namespace already has `requireAdmin` discipline, and adding a new admin route is a small additive change.

Dispatch sketch (Prompt 4 will implement):

```ts
// src/routes/admin/agent-seo.ts (NEW in Prompt 4)
import { runSeo } from '../../agent/features/seo/index.js';
import { requireAdmin } from '../../utils/requireAdmin.js';

export default async function adminAgentSeoRoutes(app) {
  app.post('/seo', { preHandler: requireAdmin }, async (request, reply) => {
    const admin = (request as any).admin as { adminId: number; email: string; role: string };
    const { userText, conversationId } = request.body as { userText: string; conversationId?: string };

    const result = await runSeo({
      userText,
      adminId: admin.adminId,
      adminEmail: admin.email,
      conversationId: conversationId ?? null,
    });

    return reply.send({
      ok: result.ok,
      response: result.response,
      data: result.data ?? null,
      suggestions: result.suggestions,
      conversationId: result.conversationId,
    });
  });
}
```

Mounted at `/api/admin/agent` in `src/routes/index.ts` so the full path is `POST /api/admin/agent/seo`. **`src/routes/chat.ts` is NOT touched in Phase 9.** This is a meaningful departure from the Phase 5 / Phase 11 chat-route pattern, but it is the right call for an operator-only feature.

### Why not extend chat.ts

The chat.ts dispatch chain is `reviews → referrals → cs_chat → Gemini`. Adding an `seo` branch would require either (a) checking `request.admin` at the top of the chat handler (and chat.ts has no admin auth wired up), or (b) sniffing for the admin JWT vs the user JWT, which is fragile and security-adjacent. Cleaner to add a new admin-namespaced route.

### Feature flag

`isFeatureAllowed('seo')` still gates everything. The new route returns 503 if the flag is off. The operator enables it via `AGENT_FEATURE_FLAGS=cs_chat,referrals,reviews,seo` in dev. Default OFF in production per CLAUDE.md.

---

## B10. Schema changes

**For Prompt 3 (L0 only): NONE.** The L0 tools read existing columns. No migration needed.

**For deferred future write phase:** when L1/L2 SEO write tools are eventually built, they will need an `seo_page_drafts` audit table or a `draft_meta_title` / `draft_meta_description` column on `seo_pages` to stage operator-approved changes before they go live. Out of scope for Phase 9.

---

## B11. Integration test plan

**Non-negotiable per CLAUDE.md. Ships in the same commit as the feature (Phase 9 Prompt 3 or 4).**

File: `src/agent/__integration__/seo-agent.integration.test.ts` (mirrors `reviews-agent.integration.test.ts` exactly — LLM, prisma, services, jwt, Gemini all mocked, real Fastify route plugin via `app.inject`).

### Test cases (mirror Phase 11's 4-test pattern)

1. **Operator asks "audit the SEO page for /caribbean-hot-sauce" — full dispatch + handler + tool + shaper.**
   - Setup: mock service to return a `SeoPage` row with known title/meta lengths.
   - Action: POST `/api/admin/agent/seo` with seed admin Bearer token and the user text.
   - Assert: 200, `body.ok === true`, `body.response` non-empty, `body.data` contains the audit result, `body.conversationId` set, `aiConversation.create` called with `featureKey: 'seo'`.

2. **Operator asks for content gaps — structured suggestion returned.**
   - Setup: mock `findContentGapsByTaxonomy` to return a small list.
   - Assert: tool result surfaces in `body.data`, response references the gap list.

3. **Non-admin (regular user JWT) cannot reach the route.**
   - Action: POST with a buyer JWT (signed with `JWT_SECRET`, not `ADMIN_JWT_SECRET`).
   - Assert: 401 from `requireAdmin`, agent NEVER invoked, no `aiConversation` row created with `featureKey: 'seo'`.

4. **Forbidden behavior — agent never claims to have published or modified anything.**
   - Setup: mock LLM to return a well-behaved response.
   - Action: ask "publish this blog post for me".
   - Assert: response does NOT contain "I have published", "I've posted", "your post is now live", "published successfully", "I have updated"; SHOULD reference "draft" or "I cannot publish".

### Assertion fields (Phase 11 contract)
`ok`, `response`, `data`, `suggestions`, `conversationId` plus DB-level assertions for persistence rows with `featureKey === 'seo'`.

---

## B12. Risks and unknowns

1. **Vertical SEO routes are not auditable per-slug.** The "14K+ pages" are dynamically generated. The agent can audit `SeoPage` and `BlogPost` rows, plus call the existing `/sitemap-stats` and `/recipes/stats` endpoints for vertical-level summaries, but it cannot say "audit /location/haitian/florida/miami" the way it can say "audit a blog post". Operator should be aware of this scope boundary. Documented in B3.

2. **`requireAdmin` vs `authenticateAdmin` role-validation drift.** Tech debt flagged in B5. Phase 9 picks `requireAdmin` (the more permissive one) for the new agent route to match `routes/admin/seo.ts` rather than `routes/admin/blog.ts`. If a `superadmin` user tries the agent and gets rejected, that's the bug; flag for a separate fix.

3. **Data volume unknown.** B4 lists the queries the operator must run before Prompt 2. Production-block clauses trigger if `blog_posts < 50` or `seo_pages < 20`.

4. **Embedding population unknown.** The columns exist; whether they are populated for live rows is unknown until operator runs the `array_length(embedding, 1) > 0` query in B4. If empty, `find_similar_blog_posts` falls back to taxonomy-only matching (which `getRelatedBlogPosts` already implements). Not a blocker.

5. **Internal-link analysis is regex-based.** `find_orphan_blog_posts` parses `contentHtml` for `<a href>` patterns. This is best-effort and will miss links inside JS-rendered components, links in CSS, or links inside JSON-LD. Document as a known limitation in the tool's JSDoc. Not a blocker for Phase 9.

6. **`adminSeo.controller.ts` not read in this audit.** Phase A skipped reading `src/controllers/adminSeo.controller.ts` because the route file delegates to it but the controller's behavior is well-described by the route's comment header. **Prompt 2 must read it in full** before extending `seo.service.ts`, in case the controller does ownership or permission logic the audit missed. Flagged as a Prompt 2 prerequisite.

7. **Phase 8 (RAG) might supersede some Phase 9 tools.** Specifically, embedding-based similarity belongs more naturally in Phase 8's vector-search infrastructure. Phase 9 ships the taxonomy-based version (using existing `getRelatedBlogPosts`) and defers any embedding-based tooling to Phase 8. No blocker.

8. **No external SEO data sources.** Confirmed in Phase A — there is no Google Search Console, Ahrefs, SEMrush, or Moz integration in the codebase. The agent works entirely off internal data. The system prompt must explicitly tell the LLM that keyword position data and search volume data are NOT available. Listed in B8 forbidden behaviors.

9. **No analytics tables.** There are no view-count, click-count, or impression columns on `SeoPage` or `BlogPost`. The agent cannot answer "which page is highest-traffic" — it can only answer "which page is most recently updated" or "which page has the most words". Document as a scope limit.

10. **`autoblog.ts` is a separate cron, not under agent control.** The agent must NOT trigger `runAutoblogOnce`. The existing `POST /api/admin/blog/autoblog/trigger` endpoint stays exclusively for the admin UI. Phase 9 can READ autoblog status (count of today's posts) but never WRITE.

### Production block clauses

- **If admin auth changes** (e.g. Jon decides to consolidate the two helpers or rotate `ADMIN_JWT_SECRET`), Phase 9 must re-verify the dispatch path before deploying.
- **If `blog_posts < 50` OR `seo_pages < 20`** (per B4 queries), Phase 9 ships in dev only and is held back from production until content is seeded.

---

## B13. Methodology compliance checklist

- [x] Read every file in Phase A: `prisma/schema.prisma` (SeoPage, BlogPost, AdminUser sections), `src/services/seo.service.ts` (full), `src/services/blog.service.ts` (full), `src/routes/admin/seo.ts` (full), `src/routes/admin/blog.ts` (first 100 lines + endpoint enumeration), `src/utils/requireAdmin.ts` (full), `src/middleware/authAdmin.ts` (full), `src/routes/buy-seo.ts` (first 80 lines), endpoint inventories of all 6 vertical SEO routes and 4 sitemap routes
- [x] All Prisma field names copied verbatim (SeoPage, BlogPost, AdminUser sections in B1)
- [x] Operator auth pattern documented exactly with the surprise that admins use a separate `ADMIN_JWT_SECRET` (B5)
- [x] Data volume verified — flagged as unknown with explicit gate queries (B4) and production-block clauses
- [x] All 4 Phase 1 bug fixes will be honored: Bug 1 (dynamic imports), Bug 2 (registry forwarding), Bug 3 (response shaper queries by `messageId`), Bug 4 (MANDATORY block prepended to system prompt). Explicitly committed to in B7 (dynamic imports), B8 (MANDATORY block), and the response-shaper section of B11 (messageId).
- [x] Integration test plan committed in writing (B11)
- [x] No write tools proposed for Prompt 3 (B6, B7)
- [x] No production code written
- [x] No schema changes
- [x] No tests run
- [x] No commits

---

## B14. Prompt 2 preview

Phase 9 Prompt 2 will be **lighter than Phase 5/11 Prompt 2** because the service layer already exists. The work is:

1. Read `src/controllers/adminSeo.controller.ts` in full (audit-only — flagged in B12 risk #6).
2. Add 4-5 new exported functions to `src/services/seo.service.ts` and `src/services/blog.service.ts`:
   - `getSeoPageBySlugForOperator(slug)` — like `getSeoPageBySlug` but does NOT filter by `published: true`.
   - `getBlogPostBySlugForOperator(slug)` — same for blog posts.
   - `listAllBlogPostsForOperator({ published?, limit? })` — drafts-included variant.
   - `findContentGapsByTaxonomy(taxonomy)` — new aggregate query.
   - `findOrphanBlogPosts({ limit })` — best-effort regex-based orphan finder.
   - `loadDraftingContext(topic, opts)` — composer for `draft_blog_post_outline` tool.
3. Add unit tests for each new function in `src/services/__tests__/seo.service.test.ts` and `src/services/__tests__/blog.service.test.ts` (one new test file each, mirroring the Phase 5 / Phase 11 test pattern).

### Files Prompt 2 will create or modify

- **Modify:** `src/services/seo.service.ts` (add operator-facing read functions)
- **Modify:** `src/services/blog.service.ts` (add operator-facing read functions and content-gap analysis)
- **Create:** `src/services/__tests__/seo.service.test.ts`
- **Create:** `src/services/__tests__/blog.service.test.ts`
- **Backup before modification:** `cp src/services/seo.service.ts src/services/seo.service.ts.bak.$(date +%s)` and same for `blog.service.ts`

### Files Prompt 2 will NOT touch

- `prisma/schema.prisma` (still no schema changes — write tools are deferred)
- Anything in `src/agent/` (Prompt 3's job)
- `src/routes/chat.ts` (NOT touched in Phase 9 at all — see B9)
- `src/routes/admin/seo.ts` or `src/routes/admin/blog.ts` (existing route handlers stay byte-identical)
- `src/jobs/autoblog.ts` (off-limits per B12 risk #10)
- `src/controllers/adminSeo.controller.ts` (audit-only read in Prompt 2 Phase A; modifications deferred to a separate cleanup phase if ever needed)
- Any protected path from CLAUDE.md

### Verification gates (same as Phase 5/11)

- `npx tsc -p tsconfig.agent.json` — must remain at the 5-error baseline
- `npx tsc` — must remain at the 158-error baseline
- `npx vitest run` — all 408 baseline tests still green plus the new service tests

---

AUDIT COMPLETE — methodology compliance checklist all green — ready for Prompt 2 review

---

## Prompt 4 shipped (2026-04-10)

Phase 9 is now complete across four prompts: service extension (commit `b3cb6e1`), agent feature module + framework `adminId` extension + `ai_admin_audit_log` table (commit `04cf508`), and route integration + integration tests (this commit). The new operator-facing endpoint is `POST /api/admin/agent/seo`, gated by `requireAdmin` (accepts `admin`/`superadmin` roles via `ADMIN_JWT_SECRET`) and `isFeatureAllowed('seo')`. Unlike Phases 1/5/11 which live on `/api/chat` with keyword dispatch, Phase 9 is NOT wired into `chat.ts` — per audit B9, the public chat widget should never resolve an `seo` keyword. The new feature flag value is `seo` — add it to `AGENT_FEATURE_FLAGS` (e.g. `AGENT_FEATURE_FLAGS=cs_chat,referrals,reviews,seo`) to enable in dev. Default OFF in production per CLAUDE.md. Every SEO tool call writes a redacted, synchronous row to `ai_admin_audit_log` via the tool-adapter hook shipped in Prompt 3.
