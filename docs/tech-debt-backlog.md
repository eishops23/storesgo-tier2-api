# StoresGo Backend — Tech Debt Backlog

> **Generated:** 2026-04-08 (Prompt 1 Audit)
> **Status:** NOT TO FIX DURING AGENT SUITE BUILD — address post-launch
> **Purpose:** Inventory of existing technical debt for awareness only

---

## 1. TypeScript Compilation Errors (~90 errors)

The codebase does not compile cleanly under `tsc --noEmit`. The production build uses
`tsconfig.build.json` with `strict: false` and a narrow `include` list that excludes many
files (all of `src/ai/`, `src/workers/`, `src/jobs/`, `src/queues/`, several plugins and libs).
The ~90 errors fall into these categories:

### 1.1 Schema Drift — Field Renames (est. 20-30 errors)

Code references fields that have been renamed in the Prisma schema:
- `product.image` → now `product.imageUrl` (with `ProductImage[]` relation for multi-image)
- `seller.name` → now `seller.storeName`
- Various files still reference the old field names

### 1.2 Slugify v1 → v2 Breaking Change (est. 10-15 errors)

Package `slugify@1.6.6` is installed. Some files import it as `import slugify from 'slugify'`
(default export), others as `import { default as slugify } from 'slugify'`. The v1→v2
migration changed the export shape. Files affected include route handlers and service files
that generate URL slugs.

### 1.3 ioredis Import Compatibility (est. 5-10 errors)

`ioredis@5.8.2` is ESM-aware but some files import it with CJS patterns:
- `import Redis from 'ioredis'` vs `import { Redis } from 'ioredis'`
- Workers and queue files are the primary offenders

### 1.4 Duplicate Declaration — wsBroadcast (est. 2-3 errors)

The `wsBroadcast` function is declared in multiple files (likely websocket plugin and
one or more route files), causing duplicate identifier errors when compiling the full
`src/**/*` scope.

### 1.5 Missing SeoEntityType Enum (est. 3-5 errors)

Several SEO files reference a `SeoEntityType` enum or type that does not exist in the
Prisma schema or any shared types file. The `seoTask` model has a `type: String` field
but no corresponding TypeScript enum.

### 1.6 Missing Taxonomy Model (est. 2-3 errors)

Some categorization service files reference a `Taxonomy` or `ProductTaxonomy` model that
does not exist in the current schema.

### 1.7 Miscellaneous Type Errors (est. 15-20 errors)

- `(request as any).admin` / `(request as any).user` — untyped Fastify request extensions
- Missing `.js` extensions on relative imports (required by NodeNext module resolution)
- `QueueScheduler` usage (removed in BullMQ v3) in `src/queues/aiQueue.ts` and
  `src/queues/queues/worker.ts`
- Inconsistent Prisma client imports (`../lib/prisma.js` vs `../plugins/prisma.js` vs
  `new PrismaClient()` inline)

---

## 2. Multiple Prisma Schema Files

The canonical schema is `prisma/schema.prisma` (897 lines, 51 models, 2 enums).
The following stale copies exist and should eventually be deleted:

| File | Notes |
|------|-------|
| `prisma/schema.prisma.bak` | Unknown date, stale |
| `prisma/schema.prisma.backup` | Unknown date, stale |
| `prisma/schema.prisma.backup.20251204` | Dec 2024 snapshot |
| `prisma/schema.prisma.backup.20251208_024406` | Dec 2024 snapshot |
| `prisma/schema.prisma.backup.substitution` | Substitution feature branch |
| `prisma/schema.prisma.txt` | Text copy, stale |
| `prisma/prisma/schema.prisma` | Nested stub (wrong location) |
| `prisma/phase7.schema.additions.prisma` | Proposed additions, never merged |

**Risk:** Developer confusion about which schema is canonical.

---

## 3. Backup / Deprecated Files (41 files)

Across `src/`, there are **41 `.bak`, `.backup`, `.broken`, and `.deprecated` files**:

| Directory | Count | Examples |
|-----------|-------|---------|
| `src/routes/` | 16 | `clover.ts.backup`, `clover.ts.deprecated`, `index.ts.bak`, `square.ts.broken`, `stripe.ts.bak.3ds`, `seller/products.ts.bak.1774361706` |
| `src/services/` | 21 | `aiSearch.service.ts.bak` (4 versions), `products.service.ts.backup` (3 versions), `shipping.service.ts.bak` (3 versions) |
| `src/jobs/` | 1 | `autoblog.ts.bak` |
| **Prisma** | 7 | Listed in Section 2 above |

**Risk:** File bloat, confusion about which version is canonical, stale code showing up
in grep results.

---

## 4. Nested Duplicate Scaffold Directories

Phase 10 scaffolding accidentally created nested duplicate directories:

- `src/queues/queues/` — contains `index.ts` and `worker.ts` that duplicate `src/queues/`
- `src/utils/utils/` — contains `csv.ts` that duplicates `src/utils/csv.ts`

These are dead code and should be deleted.

---

## 5. npm Audit Vulnerabilities (34 total)

As of the production snapshot (2026-04-08):

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 27 |
| Moderate | 4 |
| Low | 1 |
| **Total** | **34** |

These are tracked upstream and should be addressed in a dedicated dependency update pass,
not during the agent suite build.

---

## 6. Multiple PrismaClient Instantiation

The codebase uses at least **4 different patterns** to access Prisma:

1. **Shared singleton** — `src/lib/prisma.ts` exports a global `prisma` instance (most services)
2. **Fastify decorator** — `src/plugins/prisma.ts` decorates `app.prisma` (some routes)
3. **Inline `new PrismaClient()`** — `src/lib/semanticSearch.ts`, `src/routes/resolve-url.ts`,
   `src/queues/seo.worker.ts`, `src/jobs/seoWorker.ts`
4. **Import from plugins path** — `src/services/orderNotification.service.ts` imports from
   `../plugins/prisma.js`

**Risk:** Connection pool exhaustion under load; the inline instances each create their
own connection pool (default 5 connections each).

---

## 7. Dual Admin JWT Secrets

Two different secrets are used for admin authentication:

- `src/core/adminJwt.ts` verifies against `process.env.JWT_SECRET`
- `src/utils/requireAdmin.ts` verifies against `process.env.ADMIN_JWT_SECRET`

A token signed with one secret won't validate against the other. This means different admin
routes may silently reject valid tokens depending on which middleware they use.

---

## 8. Overlapping Email/Notification Implementations

Three separate email sending implementations coexist:

| File | Method | SDK |
|------|--------|-----|
| `src/services/email.service.ts` | SendGrid SDK | `@sendgrid/mail` |
| `src/services/orderNotification.service.ts` | SendGrid REST + Twilio REST | raw `fetch()` |
| `src/utils/notifySender.ts` | Nodemailer (SMTP) | `nodemailer` |

`notifications.service.ts` delegates to `notifySender.ts`, while `orderNotification.service.ts`
calls SendGrid/Twilio directly. The `email.service.ts` uses the SendGrid SDK.

**Risk:** Inconsistent sender addresses, template drift, difficulty tracing which path a
notification takes.

---

## 9. Notification Type/Status Inconsistency

- `src/utils/notifySender.ts` defines `NotificationChannel` as `"email" | "sms" | "both"`
- `src/types/notification.types.ts` defines `NotificationChannel` as `{ EMAIL, SMS, PUSH, IN_APP }`
- `notifications.controller.ts` queries unread by `status in: ["PENDING", "SENT", "DELIVERED", "UNREAD"]`
  but marks read by `read: false` → `read: true` (boolean field)
- `markNotificationsRead` writes `status: "READ"` (uppercase)

These inconsistencies make notification state queries unreliable.

---

## 10. Unprotected Admin Endpoints

The following endpoints lack proper admin role enforcement:

- `GET /api/homepage/config` — no auth at all
- `POST /api/notifications/admin/create` — has `authenticateUser` but no admin role check
- `GET /api/notifications/admin/all` — same (has `// TODO: Add admin check` comment)

---

## 11. Autoblog Double-Scheduling

Both `src/cron/autoblog.cron.ts` and `src/cron/orchestrator.ts` register autoblog cron
jobs. If both are started, the autoblog generator will fire twice per window. Currently
only `autoblog.cron.ts` is called from `server.ts`, but the orchestrator risk remains.

---

## 12. Hardcoded Values That Should Be Environment Variables

| File | Value | Issue |
|------|-------|-------|
| `src/utils/indexnow.ts` | `INDEXNOW_KEY = 'storesgo_indexing_key_2026'` | Cannot rotate without code change |
| `src/utils/indexnow.ts` | `SITE_HOST = 'storesgo.com'` | Hardcoded domain |
| `src/routes/product-seo-routes.ts` | Delivery zones (miami-dade, broward, etc.) | Hardcoded geography |
| `src/services/aiChat.service.ts` | Gemini model `gemini-2.0-flash` | Inline string, not env-configurable |
| `src/core/homepage.ts` | `sellerBanners[]`, `trending[]` | Placeholder/debug data |

---

## 13. Production Build Exclusions

The `tsconfig.build.json` explicitly **excludes** these from the compiled production build:

- `src/ai/` (all AI modules — seo.ts, blog.ts, seoLinkBuilder.ts, categorizer.ts, embeddings, recommender)
- `src/workers/` (all BullMQ workers)
- `src/jobs/` (autoblog, notification worker, SEO worker)
- `src/queues/` (all queue definitions)
- `src/plugins/queues.ts`, `src/plugins/redis.ts`, `src/plugins/websocket.ts`, `src/plugins/monitoring.ts`
- `src/lib/semanticSearch.ts`, `src/lib/voice.ts`, `src/lib/translate.ts`, `src/lib/queues.ts`
- `src/services/notificationService.ts`
- `src/cron/orchestrator.ts`, `src/cron/seo.cron.ts`, `src/cron/seoReportCron.ts`, `src/cron/internalLinkCron.ts`
- `src/scripts/`, `src/archive/`, `src/smoke/`

This means the production server runs **without**: BullMQ workers, Redis queues,
WebSocket, AI enrichment pipeline, SEO cron jobs, semantic search, voice transcription.
These features exist in source but are not deployed.

---

## 14. In-Memory State Without Persistence

| Location | What | Risk |
|----------|------|------|
| `src/services/aiSearch.service.ts` | `recentViews: Map<string, number[]>` | Lost on restart, grows unbounded |
| `src/utils/cache.ts` | `Map<string, {value, timeout}>` | No LRU eviction, unbounded growth |
| All SEO data routes | In-memory JS arrays (recipes, ingredients, locations, etc.) | Not an issue — read-only static data |

---

## 15. Security Concerns (Low Priority for Agent Build)

- `src/core/adminJwt.ts` logs token prefix to console (`token.substring(0, 30)`)
- `src/core/products.ts` exposes sellerId extraction via query params with no auth
- `src/routes/resolve-url.ts` creates its own `PrismaClient` — connection leak risk
- Password strength validation is commented out in `passwordReset.controller.ts`
  (currently only checks length >= 8)
- `src/routes/hub-routes.ts` uses `$queryRawUnsafe` — potential SQL injection if
  input sanitization is insufficient

---

## Summary

| Category | Count/Severity |
|----------|---------------|
| TS compilation errors | ~90 |
| Stale schema files | 8 |
| Backup/deprecated files | 41 |
| npm vulnerabilities | 34 (2 critical) |
| Duplicate scaffold dirs | 2 |
| Multiple Prisma instantiation patterns | 4 |
| Overlapping email implementations | 3 |
| Unprotected admin endpoints | 3 |
| Hardcoded values needing env vars | 5+ |
| Excluded-from-production modules | 15+ files |

**None of these items should be addressed during the agent suite build.** The agent suite
will be isolated in `src/agent/` with its own `tsconfig.agent.json` and will not touch
any of the above code.

---

## 16. SECURITY: Unauthenticated POST /referrals/apply and /complete

**Severity: HIGH**
**Discovered:** Phase 5 audit, 2026-04-09

POST /referrals/apply and POST /referrals/complete have no auth check.
Any caller can forge a referral by passing an arbitrary referredUserId.

**Fix scope:**
- Add Bearer JWT requirement to both endpoints
- Validate that ctx.userId matches referredUserId on /apply
- Validate caller authorization on /complete (likely needs to be
  invoked from order completion flow, not user-facing)
- Audit callers before adding auth — there may be an unauth signup
  flow depending on /apply

**Out of Phase 5 scope.** Must be fixed before any agent feature exposes
referral mutations as tools.
