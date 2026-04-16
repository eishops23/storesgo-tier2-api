# Phase 11 — Review Response Agent — Audit (Prompt 1)

**Status:** Audit-only. Zero production code written. No schema changes. No tests run. No commits.
**Date:** 2026-04-10
**Phase classification:** EXTEND_EXISTING (Tier 2). Seller-facing — first non-customer audience for the framework.
**Goal of Phase 11:** Draft AI-generated seller responses to customer reviews. Never auto-publishes.

---

## B1. Schema inventory

### `model Review` (prisma/schema.prisma:337-351)

```
model Review {
  id        Int      @id @default(autoincrement())
  userId    String
  sellerId  Int?
  productId Int
  rating    Int
  comment   String?
  createdAt DateTime @default(now())
  product   Product  @relation(fields: [productId], references: [id])
  seller    Seller?  @relation(fields: [sellerId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@index([productId], map: "idx_reviews_product")
  @@map("reviews")
}
```

**Critical observations:**
- No `status` column. No `updatedAt`. No `response` / `sellerResponse` / `responseAt` columns. No moderation flags.
- No `ReviewResponse`, `ReviewReport`, or `ReviewDraft` model exists.
- `sellerId` is **nullable** (`Int?`). The agent must defensively handle reviews where `sellerId IS NULL` (legacy data) and refuse to draft for them.
- `userId` is `String` (User PK is cuid). `sellerId` is `Int` (Seller PK is autoincrement).
- Only `productId` is indexed. Filtering by `sellerId` (the agent's primary access pattern) is currently a sequential scan. Flag as a perf risk for Prompt 2 — may want `@@index([sellerId])` and `@@index([sellerId, createdAt])`.
- Field naming is plain camelCase — no `@map("snake_case")` annotations on individual columns. Table name is `reviews`.

### `model Seller` (prisma/schema.prisma:37-67) — relevant fields only

```
model Seller {
  id            Int            @id @default(autoincrement())
  userId        String?        @unique
  storeName     String
  slug          String         @unique
  isApproved    Boolean        @default(false)
  isBanned      Boolean        @default(false)
  reviews       Review[]
  user          User?          @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("sellers")
}
```

**Critical observations for ownership scoping:**
- Seller PK is `Seller.id` (Int autoincrement). This is what `Review.sellerId` references.
- `Seller.userId` is the FK back to `User.id` (String/cuid) and is `@unique`.
- `isApproved` and `isBanned` exist — Phase 11 ownership check should also reject `isBanned === true` (banned sellers cannot draft responses).
- `userId` is **nullable** — there can be sellers without an attached User. Phase 11 only deals with sellers who authenticated, so the agent will never encounter `userId === null`.

### `model User` (prisma/schema.prisma:90-119) — relevant fields only

```
model User {
  id    String   @id @default(cuid())
  email String   @unique
  role  UserRole @default(BUYER)
  ...
  sellerProfile Seller?
}
```

`User.id` is the JWT subject. The path from JWT → seller is: `User.id` → `Seller.findFirst({ where: { userId } })` → `Seller.id`.

---

## B2. Service layer inventory

**Result: NO `src/services/reviews.service.ts` exists.** Confirmed by `Glob src/services/referrals*` returning only `referrals.service.ts`, and a broader file search.

All review logic is inline in `src/routes/reviews/index.ts` — exactly the same starting state as referrals before Phase 5 Prompt 2. **Phase 11 Prompt 2 must extract a service layer first**, mirroring the Phase 5 Prompt 2 pattern (commit `13c10ac`).

---

## B3. Route inventory — `src/routes/reviews/index.ts` (415 lines)

The transfer doc said "7 endpoints"; the file actually exposes **7 handlers**:

| # | Method | Path | Auth | Role check | Request shape | Response shape |
|---|--------|------|------|------------|---------------|----------------|
| 1 | POST | `/` | `authenticateUser` | `user.role !== "BUYER"` rejects | `{ productId, rating, comment? }` | `{ ok, data: review, message }` |
| 2 | GET | `/` | none (public) | — | querystring `{ productId?, sellerId?, page=1, limit=20 }` | `{ ok, data: { reviews, pagination, stats: { averageRating, totalReviews, ratingDistribution } } }` |
| 3 | GET | `/:id` | none (public) | — | path `id` | `{ ok, data: review }` |
| 4 | PATCH | `/:id` | `authenticateUser` | `review.userId !== user.id` rejects | `{ rating?, comment? }` | `{ ok, data, message }` |
| 5 | DELETE | `/:id` | `authenticateUser` | `review.userId !== user.id` rejects | path `id` | `{ ok, message }` |
| 6 | GET | `/my-reviews` | `authenticateUser` | scopes by `user.id` | — | `{ ok, data: reviews }` |
| 7 | GET | `/product/:productId/stats` | none (public) | — | path `productId` | `{ ok, data: { productId, averageRating, totalReviews, ratingDistribution } }` |

**Audience classification:**
- Buyer-auth: 1 (POST), 4 (PATCH), 5 (DELETE), 6 (GET /my-reviews) — all gated on the *review author*, not the seller.
- Public: 2 (GET list), 3 (GET single), 7 (product stats).
- **Seller-auth: ZERO.** There is currently no endpoint a seller can call to see "reviews left on my products". Phase 11 will need at least one new seller-scoped read endpoint (or the agent calls Prisma directly via the new service).

**Notable:** the response shape uses `ok: true | false` (no data envelope wrapping), matching the Phase 5 contract. The agent's response shaper output (`ok / response / data / suggestions / conversationId`) is consistent with this.

**Flag for Prompt 2:** the POST handler also calls `notifyNewReview` from `src/services/notifications.service.js`. The extracted service must preserve this side-effect or the new service must explicitly *not* re-trigger it for agent-driven reads.

---

## B4. Seller auth pattern — `src/middleware/authSeller.ts`

**THIS IS THE LOAD-BEARING SECTION. Get it exactly right.**

### Mechanism
Sellers authenticate with the **same `JWT_SECRET`** as buyers. There is **NO separate `SELLER_JWT_SECRET`**. The prompt's framing of "likely a separate JWT secret (SELLER_JWT_SECRET — confirmed leaked in earlier incident)" is **incorrect for the current code**. The transfer doc's lore about a leaked seller secret may refer to historical state or to `OCI postgres password`, not to a distinct seller JWT secret. Flagged in B12.

### Verification flow (verbatim from `src/middleware/authSeller.ts:10-48`)

```ts
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-change-me";

export async function authenticateSeller(request, reply) {
  const authHeader = request.headers["authorization"];
  // ... extracts Bearer token ...
  const payload = jwt.verify(token, JWT_SECRET) as UserJwtPayload;
  if (!payload || payload.role !== "SELLER") {
    return reply.code(403).send({ ok: false, error: "Forbidden" });
  }
  const seller = await prisma.seller.findFirst({
    where: { userId: payload.id },
    select: { id: true, userId: true, storeName: true }
  });
  if (!seller) {
    return reply.code(403).send({ ok: false, error: "Seller account not found" });
  }
  request.user = payload;
  (request as any).seller = seller;
}
```

### Seller context shape after middleware runs

```ts
request.user   // UserJwtPayload — has { id, email, role: "SELLER", sellerId? }
request.seller // { id: number, userId: string, storeName: string }
```

### How to extract the seller ID from a Fastify request
```ts
const sellerId: number = (request as any).seller.id;
const sellerUserId: string = (request as any).seller.userId; // === request.user.id
```

### `authenticateUser` (`src/middleware/authUser.ts`) also leaks `sellerId`
The generic `authenticateUser` middleware attaches `request.user = { id, email, role, sellerId: payload.sellerId }`. So if the JWT itself carries `sellerId` in its payload, it can be read without a DB lookup. **However the chat route currently calls `getUserIdFromToken` which only extracts `decoded.id`** — `sellerId` from the JWT payload is *not* currently surfaced into the chat handler. Phase 11 will need to add this extraction.

### The exact ownership scoping field
For every review tool, the check is:
```ts
if (review.sellerId !== ctx.sellerId) return null;
```
where `ctx.sellerId` is `Seller.id` (numeric autoincrement), resolved from the authenticated seller's `User.id` via `prisma.seller.findFirst({ where: { userId: ctx.userId } })`.

### **Critical framework gap (must be resolved in Prompt 2 or 3)**

The shared `ToolContext` interface in `src/agent/tools/types.ts:6-14` does **NOT** include a `sellerId` field:

```ts
export interface ToolContext {
  sessionId: string;
  featureKey: string;
  conversationId: string;
  messageId: string;
  identityId?: string;
  userId?: string;
  prisma?: PrismaClient;
}
```

Likewise `RunInput` in `src/agent/runner/types.ts:6-19` only has `userId`. Phase 11 has two clean options:

1. **Extend the framework (recommended).** Add optional `sellerId?: number` to both `ToolContext` and `RunInput`, plumb it through the runner the same way `userId` is plumbed. Small surface change, additive only, zero impact on cs-chat or referrals because the field is optional.
2. **Resolve inside each tool.** Each review tool calls `prisma.seller.findFirst({ where: { userId: ctx.userId } })` at the top of `execute`. No framework change, but adds one DB round-trip per tool call and duplicates the lookup across all 4-6 tools.

**Recommendation: option 1.** This is the kind of small additive extension Phase 11 is supposed to validate, and it costs nothing for the existing features.

---

## B5. Existing agent infrastructure recap

### `runReferrals` signature (verbatim from `src/agent/features/referrals/handler.ts:61-64`)
```ts
export async function runReferrals(input: ReferralsChatInput): Promise<ReferralsChatResult> {
  const correlationId = randomUUID();
  const handlerLog = log.child({ correlationId });
```
where `ReferralsChatInput` is `{ userText, userId?, guestSessionId?, conversationId? }`. Phase 11 will mirror this exactly with `runReviews(input: ReviewsAgentInput)` — but `guestSessionId` is meaningless for seller-only agents and should be **omitted**. The seller-equivalent input shape will be `{ userText, userId, sellerId, conversationId? }` with both `userId` and `sellerId` non-optional (no guest path).

### `buildScopedRegistry` pattern (verbatim from `handler.ts:17-21`)
```ts
function buildScopedRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registerReferralsTools(registry);
  return registry;
}
```
Phase 11 will define `registerReviewsTools(registry)` and call it identically. Module-level singletons (`scopedRegistry`, `runner`, `featureInitialized`) and the `getRunner()` getter that passes `{ registry: getScopedRegistry() }` to `new AgentRunner(...)` are reused verbatim. **This is the Phase 1 Bug 2 fix and must NOT be skipped.**

### Ownership-check template (verbatim from `src/agent/tools/cs/get-order-by-id.ts:51-68`)
```ts
async execute(args, ctx) {
  if (!ctx.userId) return null;
  const prisma = ctx.prisma ?? getPrisma();
  const order = await prisma.order.findUnique({ where: { id: args.orderId }, ... });
  if (!order) return null;
  if (order.buyerId !== ctx.userId) return null;
  return { ... };
}
```
Phase 11 review tools mirror this exactly, substituting `ctx.sellerId` and `review.sellerId`. The "return null" pattern (rather than throwing) is the agreed convention — the system prompt knows that null means "not yours" or "not logged in".

### `get_referral_stats` minimal-tool template (verbatim from `src/agent/tools/referrals/get-referral-stats.ts:10-25`)
```ts
export const getReferralStatsTool: AgentTool<Args, unknown> = {
  name: 'get_referral_stats',
  description: "...",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['referrals', 'stats', 'read'],
  timeoutMs: 5000,
  async execute(_args, ctx) {
    if (!ctx.userId) return null;
    const { getReferralStats } = await import('../../../services/referrals.service.js');
    return getReferralStats(ctx.userId);
  },
};
```
Note the **dynamic import** — Phase 11 tools must do the same to avoid pulling the entire reviews service into the agent boot path.

### MANDATORY tool-use block (verbatim from `referrals/system-prompt.ts:9-23` — Bug 4 fix)
```
CRITICAL — TOOL USE IS MANDATORY FOR REFERRAL QUESTIONS:
You have these tools available and you MUST use them:
- get_referral_stats — call this when ...
...

MANDATORY RULES:
1. If the user asks ANYTHING about their referral stats, code, or history, ALWAYS call the appropriate tool FIRST. Do not answer from memory.
2. NEVER apologize for "not finding" or "having trouble" before actually calling a tool. The tools work — call them.
3. NEVER make up referral codes, reward amounts, or referral counts. Only use real data from tool results.
4. If a tool returns null, the user is not logged in — tell them to sign in to see their referral info.
5. If a tool genuinely returns an error, explain the actual error briefly and offer to try again.
```

**Phase 11 will prepend an equivalent CRITICAL block to the reviews system prompt, adapted for the review tool names. Bug 4 will not recur.**

### Response shaper messageId pattern (verbatim from `referrals/response-shaper.ts:34-49` — Bug 3 fix)
```ts
if (result.toolCallIds && result.toolCallIds.length > 0) {
  const prisma = getPrisma();
  const toolCalls = await prisma.aiToolCall.findMany({
    where: {
      messageId: result.assistantMessageId,
      status: 'success',
    },
    orderBy: { createdAt: 'desc' },
    select: { toolName: true, resultJson: true },
  });
  if (toolCalls.length > 0) {
    const mostRecent = toolCalls[0];
    response.data = mostRecent.resultJson;
    response.suggestions = SUGGESTIONS_BY_TOOL[mostRecent.toolName] ?? DEFAULT_SUGGESTIONS;
  }
}
```
**Phase 11 will query `ai_tool_calls` by `messageId: result.assistantMessageId`, NOT by SDK tool call IDs. Bug 3 will not recur.**

### chat.ts keyword dispatch (verbatim from `src/routes/chat.ts:8 and 29-59`)
```ts
const REFERRAL_KEYWORDS = /\b(referral|refer|referred|referrer|referrals|leaderboard|invite|my code|referral code|share link|share my link|referral link|referral program|referral reward)\b/i;

// --- Referrals agent path (keyword-routed, feature-flagged) ---
if (isFeatureAllowed('referrals')) {
  const latestUserRef = [...messages].reverse().find((m) => m.role === 'user');
  if (latestUserRef?.content && REFERRAL_KEYWORDS.test(latestUserRef.content)) {
    try {
      // ... runReferrals(...) and return response ...
    } catch (error) {
      // Intentional fall-through to cs_chat or Gemini path
    }
  }
}
```
A reviews branch will be added **above** the referrals branch (or as a sibling), gated on `isFeatureAllowed('reviews')` and a `REVIEW_KEYWORDS` regex. See B9 for the recommended dispatch placement.

---

## B6. Autonomy-level assignment

| Tool | Level | Justification |
|------|-------|---------------|
| `list_my_reviews` | **L0** | Pure read. Filtered by `sellerId`. No mutation. Reversible. Trivial. |
| `get_review_by_id` | **L0** | Pure read with ownership check. Same shape as `get_order_by_id`. |
| `get_review_stats` | **L0** | Aggregates over the seller's own reviews. Read-only. |
| `find_reviews_needing_response` | **L0** | Read-only filter (e.g., low-rated and not-yet-drafted). |
| `draft_response` | **L0** (recommended) | **Judgment call.** See discussion below. |
| `save_response_draft` *(optional, only if we add a drafts column)* | **L1** | Writes to a new draft column. Reversible (overwriting a draft is harmless). Never publishes. Per CLAUDE.md L1 = "low-blast mutations". |

### Discussion: `draft_response` — L0 vs L1
**L0 framing:** the tool is pure generation. It takes a review ID, fetches the review (read-only), and returns a draft string. Nothing is written to the database. The seller copy-pastes the draft into a UI or uses a separate publish action. No mutation, no blast radius.

**L1 framing:** to make the draft useful across sessions, we want to persist it so the seller can come back tomorrow and see all pending drafts. That requires writing to a new `draft_response`/`draft_response_at`/`draft_response_version` column on `reviews` (or a sibling `review_drafts` table).

**Recommendation: ship `draft_response` as L0 in Prompt 3** (returns a string, no persistence). Defer the persistence-and-versioning UX to a Prompt 4 follow-up that introduces an L1 `save_response_draft` tool with a manual SQL migration (B10). This keeps Prompt 3 ownership-scope-only and avoids combining a schema change with a new tool surface in the same commit. The framework-validation goal of Phase 11 is met either way.

---

## B7. Proposed tool list (4-6 tools)

All tools live under `src/agent/tools/reviews/`. The scoped registry is built via `registerReviewsTools(registry)` in `src/agent/tools/reviews/index.ts`.

### 1. `list_my_reviews` — L0
- **Description:** "List recent customer reviews left on the authenticated seller's products. Supports filtering by minimum/maximum rating and time window."
- **Args:** `{ minRating?: 1..5, maxRating?: 1..5, sinceDays?: number (1..365), limit?: number (1..50, default 20) }`
- **Ownership check:** yes — `where: { sellerId: ctx.sellerId }`
- **Timeout:** 5000ms
- **Wraps:** new `listReviewsForSeller(sellerId, opts)` in `src/services/reviews.service.ts` (Prompt 2)

### 2. `get_review_by_id` — L0
- **Description:** "Get the full details of a single review by its numeric ID. Only returns the review if it belongs to one of the authenticated seller's products."
- **Args:** `{ reviewId: number (positive int) }`
- **Ownership check:** yes — load review, then `if (review.sellerId !== ctx.sellerId) return null`
- **Timeout:** 5000ms
- **Wraps:** new `getReviewById(reviewId)` in reviews service

### 3. `get_review_stats` — L0
- **Description:** "Get aggregate review statistics for the authenticated seller: total reviews, average rating, distribution across 1-5 stars, and recent trend."
- **Args:** `{ sinceDays?: number (1..365) }`
- **Ownership check:** yes — aggregate scoped by `sellerId`
- **Timeout:** 5000ms
- **Wraps:** new `getReviewStatsForSeller(sellerId, opts)` in reviews service

### 4. `find_reviews_needing_response` — L0
- **Description:** "Find reviews on the authenticated seller's products that warrant a response — defaults to ratings <= 3 stars from the last 30 days that have no recorded draft yet."
- **Args:** `{ ratingThreshold?: number (default 3), sinceDays?: number (default 30), limit?: number (1..20, default 10) }`
- **Ownership check:** yes
- **Timeout:** 5000ms
- **Wraps:** new `findReviewsNeedingResponse(sellerId, opts)` in reviews service

### 5. `draft_response` — L0 (pure generation, no persistence)
- **Description:** "Draft a constructive seller response to a specific review. Returns a draft string only — does NOT publish the response and does NOT save it to the database. The seller is responsible for reviewing and publishing the draft via a separate UI action."
- **Args:** `{ reviewId: number, tone?: 'apologetic' | 'appreciative' | 'professional' | 'warm' (default 'professional'), maxWords?: number (50..300, default 150) }`
- **Ownership check:** yes — load review by id, refuse if `review.sellerId !== ctx.sellerId`
- **Timeout:** 8000ms (slightly longer because it does an internal LLM completion via the runner's normal model — actually no, the *outer* agent generates the draft as part of its response. The tool just fetches the review and returns context the agent uses to compose the final draft in its user-facing message.)
- **Returns:** `{ reviewId, productName, customerFirstName, rating, originalComment, suggestedToneNotes }`
- **Wraps:** new `loadReviewForDrafting(reviewId)` in reviews service. The actual draft text is composed by the outer LLM in its assistant message — the tool's job is to surface the right facts and PII-masked context, not to call a second LLM.

### 6. *(deferred to follow-up)* `save_response_draft` — L1
- Not in Prompt 3 scope. Listed here for roadmap continuity. Would write to a new `draft_response` column added by `prisma/migrations/manual/011_phase11_reviews_agent.sql`.

**Hard rule honored:** no tool publishes a response to a live review. There is no `publish_response` tool in Phase 11. The human-in-loop guardrail is enforced by the absence of any publishing surface in the registry.

---

## B8. System prompt requirements

### Domain knowledge the prompt must encode
- The two main review types: positive (4-5 stars, mostly thank-yous) and critical (1-3 stars, issues to address).
- Good seller responses are: brief (under 150 words), specific to the customer's complaint, never defensive, never argumentative, never admit unverified fault, never offer compensation that hasn't been authorized, always thank the customer for the feedback.
- Bad seller responses are: generic copy-paste, defensive, blame the customer, blame the platform, contain personal information, offer refunds without authorization.
- Review etiquette differs by rating: 5★ → brief warm thanks + invitation to return; 3-4★ → acknowledge the gap + ask how to do better; 1-2★ → empathy first + concrete next step (replacement, contact support) without admitting fault.

### 5-10 example seller utterances the agent should handle
1. "What reviews do I need to respond to?"
2. "Show me my worst-rated reviews this week."
3. "Draft a response to review 47."
4. "How are my reviews trending this month?"
5. "What's my average rating?"
6. "Any new 1-star reviews I should know about?"
7. "Write a thank-you for review 102."
8. "Pull up review 88 — what did the customer say?"
9. "Are there reviews from the last 7 days I haven't responded to?"
10. "Help me reply to the angry review on Caribbean Hot Sauce."

### Forbidden behaviors (verbatim block to include in the prompt)
- **NEVER publish a response.** The agent only drafts. Any phrasing like "I've posted this for you" is forbidden.
- **NEVER argue with or contradict the customer in a draft.** Always constructive.
- **NEVER admit fault the seller has not confirmed.** Use phrasing like "I'm sorry this didn't meet your expectations" not "you're right, our packaging is broken".
- **NEVER offer refunds, store credit, free replacements, or any compensation in a draft.** Compensation is a separate flow, and is explicitly out of Phase 11 scope.
- **NEVER reveal another seller's data.** All tools are scoped by `ctx.sellerId`; if a tool returns null the agent must not speculate about why.
- **NEVER echo personal information** that may appear in review text (phone numbers, full addresses, email addresses, full last names) — mask such fragments in the draft.
- **NEVER reference the platform in a defensive way** (e.g., "StoresGo's checkout is unfortunately slow"). Always speak as the seller, not on behalf of StoresGo.

### Compliance commitment
**I will prepend the CRITICAL — TOOL USE IS MANDATORY block verbatim from `referrals/system-prompt.ts:9-23`, adapted for the review tool names (`list_my_reviews`, `get_review_by_id`, `get_review_stats`, `find_reviews_needing_response`, `draft_response`). Bug 4 will not recur.**

The prompt template will also include a `{{sellerContext}}` placeholder analogous to referrals' `{{userContext}}`, populated with the seller's `storeName` so the agent can address the seller by store name.

---

## B9. Route integration choice

Three options:

**(a) New route `POST /api/agent/reviews`** — clean separation, dedicated path. Frontend would need a new client. Best long-term if we expect a separate seller dashboard surface.

**(b) Extend `POST /api/chat` with keyword dispatch** — matches Phase 5 pattern exactly. Lowest delta, highest framework consistency. The chat endpoint becomes a multi-feature dispatcher.

**(c) New route `POST /api/seller/assist`** — establishes a seller-only chat surface. Cleanest seller/buyer separation, but introduces a new path that nothing else currently uses.

### Recommendation: **(b) extend `POST /api/chat`**, with one important adjustment.

The existing `getUserIdFromToken(request)` helper in `src/routes/chat.ts:12-19` only extracts `decoded.id`. For Phase 11 we need to **also extract `decoded.sellerId` and `decoded.role`** (or do a quick `prisma.seller.findFirst({ where: { userId } })` at dispatch time) to populate the `sellerId` we hand to `runReviews(...)`. This is a small additive change in `chat.ts`, and it does not affect the cs-chat or referrals branches because they ignore `sellerId`.

Dispatch order in `chat.ts` after Phase 11:
1. **Reviews branch** — only fires if (a) `isFeatureAllowed('reviews')`, (b) the request carries a valid seller JWT (`role === 'SELLER'` and a resolvable `sellerId`), and (c) the latest user message matches `REVIEW_KEYWORDS`. If any of those fail, fall through.
2. Referrals branch (existing).
3. CS Chat branch (existing).
4. Legacy Gemini fallback.

The reviews branch must come **first** because the seller-only check is the most restrictive — if the request is not a seller, it costs almost nothing to skip and continue.

`REVIEW_KEYWORDS` draft:
```ts
const REVIEW_KEYWORDS = /\b(review|reviews|rating|ratings|star|stars|feedback|reply to review|respond to review|draft response|customer review|reviewer)\b/i;
```

**On the "should sellers use the same chat as customers" UX question:** Phase 11's job is to validate the framework on a seller audience. It does not need to commit the frontend to a specific UX. Picking option (b) keeps the backend free to support either a unified chat surface or a dedicated seller dashboard later — the route handler is the same, only the frontend wiring differs. This is also why Phase 11 should be feature-flagged off in production until the frontend phase decides.

---

## B10. Schema changes

**For Prompt 3 (the recommended L0-only path): NONE.** The L0 tools read existing columns. No migration needed.

**For the deferred Prompt 4 follow-up** (the L1 `save_response_draft` tool), the proposed migration to be added to `prisma/migrations/manual/011_phase11_reviews_agent.sql` would be:

```sql
-- Phase 11 — Review Response Agent — draft persistence
-- Manual migration. Do NOT run prisma migrate.
-- Apply with: psql ... -f prisma/migrations/manual/011_phase11_reviews_agent.sql

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS draft_response       text,
  ADD COLUMN IF NOT EXISTS draft_response_at    timestamp,
  ADD COLUMN IF NOT EXISTS draft_response_by    text,            -- agent | seller_manual
  ADD COLUMN IF NOT EXISTS draft_response_version int DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_reviews_seller_id            ON reviews (seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_seller_id_created_at ON reviews (seller_id, created_at DESC);
```

The two indexes address the perf flag from B1 (every Phase 11 read tool filters by `sellerId`). They are independent of the draft columns and could be applied earlier if Prompt 2's service layer reveals slow queries. **Do NOT modify `schema.prisma` and do NOT run `prisma generate`.** The Prisma client will not see these columns until a separate audited schema sync.

---

## B11. Integration test plan

**Non-negotiable per CLAUDE.md. Ships in the same commit as the feature (Phase 11 Prompt 3).**

File: `src/agent/features/reviews/__tests__/handler.integration.test.ts` (mirroring referrals' integration test).

### Test cases
1. **Seller asks "what reviews need responses" with a valid seller JWT**
   - Setup: insert a seller, insert 3 reviews against that seller's products (one 1★, one 4★, one 5★).
   - Call `runReviews({ userText: 'what reviews do I need to respond to?', userId: sellerUserId, sellerId: sellerId })`.
   - Assert: `result.ok === true`, `result.response` is a non-empty string, `result.data` is an array containing the 1★ review, `result.suggestions` non-empty, `result.conversationId` set, `result.correlationId` set.
   - Assert DB rows: `ai_conversations` has one row with `featureKey === 'reviews'`, `ai_messages` has 2 rows (user + assistant), `ai_tool_calls` has at least one row with `messageId === result.assistantMessageId` and `status === 'success'`.

2. **Seller asks "draft a response to review X" — ownership check enforced**
   - Setup: two sellers, seller A and seller B. Insert one review against seller B's product.
   - Call `runReviews({ userText: 'draft a response to review <B-review-id>', userId: sellerA.userId, sellerId: sellerA.id })`.
   - Assert: the `draft_response` (or `get_review_by_id`) tool returns `null` (ownership check rejects), the agent's response acknowledges it cannot find that review for the seller, and crucially **`result.data` does not contain seller B's review content**.

3. **Unauthenticated request gracefully rejected at dispatch**
   - Test the `chat.ts` route directly (or `runReviews` with `sellerId: null`).
   - Assert: the reviews branch is skipped (or returns a polite "you must be signed in as a seller to use review tools" message), the request falls through to the next branch, and no `ai_conversations` row is created with `featureKey === 'reviews'`.

4. **Forbidden behavior — agent never claims to publish**
   - Setup: same as test 1, but ask "publish a response to review X for me".
   - Assert: the response text does NOT contain phrases like "I have published", "I posted", "your response is now live". The response should explicitly say it's a draft.

### Assertion fields (the canonical Phase 5 contract)
`ok`, `response`, `data`, `suggestions`, `conversationId` — plus DB-level assertions that the persistence rows exist with `featureKey === 'reviews'`.

---

## B12. Risks and unknowns

### Risks worth flagging

1. **Seller auth shares JWT_SECRET with buyer auth — not a separate SELLER_JWT_SECRET.**
   The prompt's framing assumed a distinct seller secret. The actual code uses a single `JWT_SECRET` with a `role` discriminator. This is **lower risk than the prompt feared** (one less secret to leak, one less rotation to coordinate) but **higher coupling** — any compromise of `JWT_SECRET` compromises both audiences. Not Phase 11's job to fix, but worth noting that the "leaked seller secret" lore the prompt referenced does not match the current code. Flag as a doc-debt item.

2. **`ToolContext` does not currently carry `sellerId`.** Documented in B4. Phase 11 must extend it (preferred) or work around it (lookup-per-tool). Either way, this is the first framework extension Phase 11 forces, and it validates that the framework can grow to support new identity scopes — which is exactly the point of doing Phase 11.

3. **`reviews.sellerId` is nullable.** Legacy reviews may have `sellerId === NULL`. Tools must filter these out (`where: { sellerId: ctx.sellerId }` already does, but `findUnique` on a specific reviewId could return one — guard with `if (!review.sellerId || review.sellerId !== ctx.sellerId) return null`).

4. **No `sellerId` index on `reviews`.** Every Phase 11 read pattern filters by `sellerId`. Current schema indexes only `productId`. With ~? rows in production this may become slow. The Prompt 4 migration in B10 includes the indexes; consider applying them earlier.

5. **PII in review text.** Reviewers occasionally include phone numbers, addresses, or full names. The `draft_response` tool's instructions to the LLM must mask these in the draft so the seller doesn't accidentally include a customer's private info in a public response. The system prompt forbids it (B8) but a defense-in-depth would be a regex-based scrub in the tool itself before passing the comment to the agent.

6. **Drafts being mistaken for published responses.** A pure UX risk for the frontend phase, not the backend. Flag as tech debt for the Phase 11 frontend wiring: any UI surface showing a draft must be unambiguous about its draft state.

7. **Review fraud (fake reviews) is out of Phase 11 scope.** It's a hard dependency on **Phase 19 (Fraud & Abuse Detection)**. Phase 11 may inadvertently make fake reviews easier to handle (sellers can draft polite responses to obvious fakes faster), but Phase 11 cannot detect them. Flag the dependency.

8. **Rate limiting — sellers could spam draft generation.** The per-feature cost cap (`$500` per `costBudgetCents` from `ai_autonomy_states`) is the existing mitigation. If a single seller burns through draft generation, that's bounded by the per-conversation cap (`$0.25`). No additional rate limiting is needed for Prompt 3, but if production usage shows abuse, add a per-seller daily cap in a follow-up.

9. **Banned sellers must be excluded.** `Seller.isBanned` exists. The dispatch in `chat.ts` (or the handler) should reject `seller.isBanned === true` before invoking the agent, otherwise a banned seller could still draft responses. Cheap to add: include `isBanned` in the `select` clause of the dispatch-time seller lookup.

10. **`isApproved` gating.** Should an unapproved seller (`isApproved === false`) be able to use the agent at all? Probably yes — they have no products to be reviewed yet, so the tools will return empty lists, and the agent is harmless. No action needed, but note for the dispatch logic.

### Unknowns to confirm in DB queries (run between Phase A and B — left for the operator)
```
SELECT featureKey, currentLevel, costBudgetCents FROM ai_autonomy_states WHERE featureKey IN ('cs_chat', 'referrals');
SELECT COUNT(*) FROM reviews;
SELECT COUNT(*) FROM reviews WHERE seller_id IS NULL;
\d reviews
\d sellers
```
These were not run as part of this audit (audit-only constraint, no mutation, and the brief explicitly said to *list* them). Operator should confirm row counts before Prompt 2.

### Production block clause
**If** the DB queries reveal that a meaningful fraction of `reviews` rows have `sellerId IS NULL` (say, > 5%), Phase 11 must add a backfill step to the Prompt 2 service extraction before the agent is exposed in production. Otherwise the agent will silently ignore those reviews and sellers may be confused.

---

## B13. Methodology compliance checklist

- [x] Read every file in Phase A (schema, route, both auth middlewares, all referrals agent files, the cs `get-order-by-id` tool template, `chat.ts`, `ToolContext`/`RunInput` type files)
- [x] All Prisma field names + `@map` annotations copied verbatim (Review, Seller, User excerpts in B1)
- [x] All service function signatures copied verbatim or noted as missing — **noted as missing**, no `reviews.service.ts` exists; service layer extraction is Prompt 2's job
- [x] Seller auth pattern documented exactly, including the surprise that there is no separate seller JWT secret (B4)
- [x] All 4 Phase 1 bug fixes will be honored (Bug 1 tool() wrapper from Vercel AI SDK — handled by existing runner adapter; Bug 2 scoped registry forwarding — `buildScopedRegistry` pattern in B5; Bug 3 response shaper queries by `messageId` — verbatim block in B5; Bug 4 MANDATORY tool-use prompt block — verbatim in B5/B8 with explicit commitment)
- [x] Integration test plan committed in writing (B11)
- [x] Human-in-loop guardrail on draft publishing confirmed (no `publish_response` tool in the registry; system prompt explicitly forbids claims of publishing)
- [x] No production code written
- [x] No `prisma/schema.prisma` modifications
- [x] No `prisma generate` run
- [x] No tests run
- [x] No commits

---

## B14. Prompt 2 preview

**Phase 11 Prompt 2 will extract a service layer from `src/routes/reviews/index.ts` into a new `src/services/reviews.service.ts`, mirroring the Phase 5 Prompt 2 pattern (commit `13c10ac`).** The route handlers will be refactored to call the service functions, preserving the existing 7-endpoint behavior verbatim including the `notifyNewReview` side-effect on POST. The service will additionally export the seller-scoped read functions the Phase 11 agent tools need (`listReviewsForSeller`, `getReviewById`, `getReviewStatsForSeller`, `findReviewsNeedingResponse`, `loadReviewForDrafting`), even though no existing route consumes them — they exist for the agent's dynamic imports in Prompt 3.

### Files Prompt 2 will create or modify
- **Create:** `src/services/reviews.service.ts` (new — service layer)
- **Create:** `src/services/__tests__/reviews.service.test.ts` (new — unit tests for the extracted functions, ships in the same commit per CLAUDE.md)
- **Modify:** `src/routes/reviews/index.ts` (refactor handlers to call the service; behavior must be byte-identical from the API consumer's perspective)
- **Backup before modification:** `cp src/routes/reviews/index.ts src/routes/reviews/index.ts.bak.$(date +%s)`

### Files Prompt 2 will NOT touch
- `prisma/schema.prisma` (still no schema changes — those wait for the optional Prompt 4)
- Anything in `src/agent/` (Prompt 3's job)
- `src/routes/chat.ts` (Prompt 3's job — adding the dispatch branch)
- Any protected path from CLAUDE.md

### Prompt 2 verification gates
- `npx tsc -p tsconfig.agent.json` clean
- `npx vitest run` — all 268+ baseline tests still green plus the new reviews service tests
- Manual smoke of all 7 existing review endpoints to confirm zero regression

---

AUDIT COMPLETE — methodology compliance checklist all green — ready for Prompt 2 review

---

## Prompt 4 shipped (2026-04-10)

Phase 11 is now complete across four prompts: service extraction (commit `fc0bc41`), agent feature module + framework extension (commit `c215b20`), and route integration + integration test (this commit). The reviews dispatch branch in `src/routes/chat.ts` fires before referrals, gated on `isFeatureAllowed('reviews')`, a `REVIEW_KEYWORDS` match, and a non-banned seller resolved via `prisma.seller.findFirst({ where: { userId } })`. The new feature flag value is `reviews` — add it to `AGENT_FEATURE_FLAGS` (e.g. `AGENT_FEATURE_FLAGS=cs_chat,referrals,reviews`) to enable in dev. Default OFF in production per CLAUDE.md.
