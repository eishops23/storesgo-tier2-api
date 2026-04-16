# Phase 5 — Referrals Agent Audit

**Date:** 2026-04-09
**Author:** Claude (audit-only prompt)
**Baseline:** commit 36fb23b (Phase 1 CS chat shipped), 268 tests passing, 0 TS errors under tsconfig.agent.json

---

## Phase A — Files Read

| # | Path | Lines |
|---|------|-------|
| 1 | prisma/schema.prisma (referral models + User referral fields + ai_* models) | ~115 across 3 ranges |
| 2 | src/routes/referrals.ts | 281 |
| 3 | src/routes/index.ts | ~175 |
| 4 | src/agent/features/cs-chat/handler.ts | 151 |
| 5 | src/agent/features/cs-chat/system-prompt.ts | 107 |
| 6 | src/agent/features/cs-chat/response-shaper.ts | 69 |
| 7 | src/agent/features/cs-chat/identity-resolver.ts | 100 |
| 8 | src/agent/features/cs-chat/context-cache.ts | 67 |
| 9 | src/agent/runner/agent-runner.ts | 321 |
| 10 | src/agent/runner/tool-adapter.ts | 73 |
| 11 | src/agent/runner/types.ts | 44 |
| 12 | src/agent/tools/executor.ts | 138 |
| 13 | src/agent/tools/registry.ts | 57 |
| 14 | src/agent/tools/types.ts | 45 |
| 15 | src/agent/tools/cs/search-products-meili.ts | 37 |
| 16 | src/agent/tools/cs/get-order-by-id.ts | 100 |
| 17 | src/agent/storage/conversation.repo.ts | 209 |
| 18 | src/agent/flags/index.ts | 14 |
| 19 | src/routes/chat.ts | 79 |

---

## A5 — DB Queries (to run before Phase B implementation)

```sql
-- 1. Current autonomy state for cs_chat (template for referrals)
SELECT "featureKey", "currentLevel", "costBudgetCents", "totalExecutions"
FROM ai_autonomy_states WHERE "featureKey" = 'cs_chat';

-- 2. Confirm ai_tool_calls schema
\d ai_tool_calls

-- 3. Confirm ai_messages schema
\d ai_messages

-- 4. Confirm ai_conversations schema
\d ai_conversations

-- 5. Referrals table row counts + status distribution
SELECT status, COUNT(*) FROM referrals GROUP BY status ORDER BY count DESC;

-- 6. referral_credit_transactions row count
SELECT COUNT(*) FROM referral_credit_transactions;

-- 7. referral_redemptions row count + status distribution
SELECT status, COUNT(*) FROM referral_redemptions GROUP BY status ORDER BY count DESC;

-- 8. Sample referral row to confirm column names match Prisma schema
SELECT * FROM referrals LIMIT 1;
```

---

## B1 — Schema Inventory

### Model: `Referral` (table: `referrals` via `@@map("referrals")`)

| Prisma Field | Type | Annotations | Notes |
|---|---|---|---|
| id | Int | @id @default(autoincrement()) | PK |
| referrerId | String | (none) | FK -> User.id. **No @map** — Prisma field = DB column |
| referredId | String? | (none) | FK -> User.id, nullable for "code_holder" rows |
| referralCode | String | @unique | Unique code e.g. "STGO" + 8 hex chars |
| referredEmail | String? | (none) | |
| referredName | String? | (none) | |
| status | String | @default("pending") | Values observed: "pending", "completed", "expired", "code_holder" |
| channel | String? | (none) | Nullable, not used in current routes |
| referrerRewardCents | Int | @default(2500) | $25 default |
| referredRewardCents | Int | @default(1000) | $10 default |
| qualifyingOrderId | Int? | (none) | Set on completion |
| paidOut | Boolean | @default(false) | |
| paidOutAt | DateTime? | (none) | |
| expiresAt | DateTime? | (none) | Set to +30 days on apply |
| createdAt | DateTime | @default(now()) | |
| updatedAt | DateTime | @updatedAt | |
| completedAt | DateTime? | (none) | Set when status -> completed |
| referred | User? | @relation("ReferredByReferrals", fields: [referredId], references: [id]) | |
| referrer | User | @relation("ReferrerReferrals", fields: [referrerId], references: [id], onDelete: Cascade) | |

**Indexes:** `@@index([referrerId])`, `@@index([referredId])`, `@@index([referralCode])`, `@@index([status])`

**IMPORTANT — No @map annotations on any field.** Prisma field names ARE the DB column names (camelCase in DB). This is different from ai_* tables which use @map("snake_case").

### User model — referral-related fields

| Prisma Field | Type | Annotations |
|---|---|---|
| referral_code | String? | @unique @db.VarChar(10) |
| referred_by_code | String? | @db.VarChar(10) |
| referral_credit | Decimal? | @default(0.00) @db.Decimal(10, 2) |
| total_referrals | Int? | @default(0) |
| total_referral_earnings | Decimal? | @default(0.00) @db.Decimal(10, 2) |
| referredBy | Referral[] | @relation("ReferredByReferrals") |
| referralsMade | Referral[] | @relation("ReferrerReferrals") |

**NOTE:** User referral fields use snake_case (matching DB columns directly) while the Referral model uses camelCase. The User fields (referral_code, referral_credit, etc.) appear to be legacy/denormalized duplicates of data that also lives in the Referral table. The routes use the Referral model exclusively, not these User fields.

### Model: `referral_credit_transactions` (table name = model name, no @@map)

| Field | Type | Annotations |
|---|---|---|
| id | Int | @id @default(autoincrement()) |
| user_id | String? | @db.VarChar(30) |
| amount | Decimal | @db.Decimal(10, 2) |
| balance_after | Decimal | @db.Decimal(10, 2) |
| transaction_type | String | @db.VarChar(30) |
| referral_id | Int? | |
| order_id | Int? | |
| notes | String? | |
| created_at | DateTime? | @default(now()) @db.Timestamptz(6) |

**No indexes defined. No relations defined.** This is a standalone audit/ledger table.

### Model: `referral_redemptions` (table name = model name, no @@map)

| Field | Type | Annotations |
|---|---|---|
| id | Int | @id @default(autoincrement()) |
| referrer_user_id | String? | @db.VarChar(30) |
| referrer_code | String | @db.VarChar(10) |
| referred_user_id | String? | @db.VarChar(30) |
| referred_email | String? | @db.VarChar(255) |
| referred_credit | Decimal? | @default(10.00) @db.Decimal(10, 2) |
| referrer_credit | Decimal? | @default(10.00) @db.Decimal(10, 2) |
| status | String? | @default("pending") @db.VarChar(20) |
| created_at | DateTime? | @default(now()) @db.Timestamptz(6) |
| first_order_at | DateTime? | @db.Timestamptz(6) |
| credited_at | DateTime? | @db.Timestamptz(6) |
| qualifying_order_id | Int? | |

**No indexes defined. No relations defined.** Appears to be a secondary audit table, possibly from an older referral implementation.

### Enums: None referral-specific. Status is a plain String, not an enum.

---

## B2 — Service Layer Inventory

**There is no dedicated referral service file.** `grep -ri referral src/services/` returned no results. All referral business logic is inline in `src/routes/referrals.ts`.

### Functions in src/routes/referrals.ts (non-exported, route-local):

**`getUserIdFromToken(request: FastifyRequest): string | null`**
- Reads `Authorization: Bearer <jwt>` header
- Returns `decoded.id` or null
- Read-only, no DB
- **NOTE:** Duplicated from src/routes/chat.ts — both files have their own copy

**`generateReferralCode(userId: string): string`**
- `crypto.createHash("sha256").update(userId + Date.now()).digest("hex")` -> `"STGO" + hash.substring(0, 8).toUpperCase()`
- Pure function, no DB, no side effects
- Returns 12-char code like "STGOAB12CD34"

### Route handlers (see B3 for full endpoint details):

| Handler | DB Reads | DB Writes | External Side Effects | Mutation? |
|---|---|---|---|---|
| GET /stats | referral.findFirst, referral.findMany | referral.create (if no code_holder exists) | None | Conditional write |
| GET /history | referral.findMany (include referred user) | None | None | Read-only |
| POST /validate | referral.findFirst | None | None | Read-only |
| POST /apply | referral.findFirst x2, referral.create | referral.create | None | Write |
| POST /complete | referral.findFirst, referral.update x1-2 | referral.update (status->completed or expired) | None | Write |
| GET /leaderboard | referral.groupBy, user.findUnique x10 | None | None | Read-only |

**No external side effects anywhere** — no emails, no webhooks, no Stripe calls. Credit/payout is tracked but not disbursed via these routes.

**Unused functions:** None detected. All route handlers are registered.

**Constants:**
```typescript
const REFERRER_REWARD_CENTS = 2500; // $25
const REFERRED_REWARD_CENTS = 1000; // $10
const REFERRAL_EXPIRY_DAYS = 30;
```

---

## B3 — Route Inventory

**Prefix:** `/referrals` (registered in src/routes/index.ts line 173: `await app.register(referralsRoutes, { prefix: "/referrals" })`)

All routes are under the Fastify root, so full paths are `/referrals/...` (NOT `/api/referrals/...` — the `/api` prefix depends on how the app mounts the root router, which would need verification).

| Method | Path | Auth | Request Shape | Response Shape |
|---|---|---|---|---|
| GET | /stats | Bearer JWT (returns 401 if missing) | None | `{ ok: true, data: { referralCode, referralLink, totalReferrals, activeReferrals, pendingReferrals, pendingRewardsCents, totalEarningsCents, referrerRewardCents, referredRewardCents } }` |
| GET | /history | Bearer JWT (returns 401 if missing) | None | `{ ok: true, data: [{ id, referredName, referredEmail, status, rewardCents, paidOut, createdAt, completedAt }] }` |
| POST | /validate | None (public) | `{ code: string }` | `{ ok: true, valid: true, referredRewardCents }` or `{ ok: false, valid: false, error }` |
| POST | /apply | None (no auth check!) | `{ code: string, referredUserId: string, referredEmail?: string, referredName?: string }` | `{ ok: true, data: <Referral> }` |
| POST | /complete | None (no auth check!) | `{ referredUserId: string, orderId: number }` | `{ ok: true, data: <Referral> }` or `{ ok: false, error }` |
| GET | /leaderboard | None (public) | None | `{ ok: true, data: [{ rank, name, referralCount }] }` |

**CRITICAL FINDING:** POST /apply and POST /complete have NO authentication. Anyone can call them with any referredUserId. This is a security concern that the agent must not amplify (see B11).

---

## B4 — Existing Agent Infra Recap

### B4.1 — Handler pattern (cs-chat/handler.ts)

**buildScopedRegistry:**
```typescript
function buildScopedRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registerCsTools(registry);
  registry.register(getProductByIdTool);
  registry.register(listCategoriesTool);
  registry.register(getStoreStatsTool);
  return registry;
}
```

**Singleton caching + runner init:**
```typescript
let scopedRegistry: ToolRegistry | null = null;
let runner: AgentRunner | null = null;

function getScopedRegistry(): ToolRegistry {
  if (!scopedRegistry) scopedRegistry = buildScopedRegistry();
  return scopedRegistry;
}

function getRunner(): AgentRunner {
  if (!runner) runner = new AgentRunner({ registry: getScopedRegistry() });
  return runner;
}
```

**Feature initialization + run sequence (runCsChat):**
```typescript
await ensureFeatureInitialized();
const identity = await resolveCsIdentity({ userId: input.userId, guestSessionId: input.guestSessionId });
const storeContext = await getStoreContext();
const systemPrompt = renderCsSystemPrompt({ storeContext: { ... }, userContext: { ... } });
const result = await getRunner().run({
  featureKey: CS_FEATURE_KEY,
  channel: 'chat',
  userText: input.userText,
  systemPrompt,
  conversationId: input.conversationId ?? undefined,
  identityId: identity.identityId,
  userId: input.userId ?? undefined,
  correlationId,
});
const shaped = await shapeResponse(result);
```

### B4.2 — Tool templates

**search-products-meili.ts (service-wrapping pattern):**
```typescript
export const searchProductsMeiliTool: AgentTool<Args, Result> = {
  name: 'search_products_meili',
  description: '...',
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['cs', 'products', 'search', 'meilisearch'],
  timeoutMs: 10000,
  async execute(args) {
    const { aiSmartSearch } = await import('../../../services/aiSearch.service.js');
    const result = await aiSmartSearch({ query: args.query, pageSize: args.limit ?? 8 });
    return { products: result.products, total: result.total, query: args.query };
  },
};
```

**get-order-by-id.ts (ownership check pattern):**
```typescript
async execute(args, ctx) {
  if (!ctx.userId) return null;
  const prisma = ctx.prisma ?? getPrisma();
  const order = await prisma.order.findUnique({ where: { id: args.orderId }, include: { ... } });
  if (!order) return null;
  if (order.buyerId !== ctx.userId) return null;  // OWNERSHIP CHECK
  return { ... };
},
```

### B4.3 — Response shaper (Bug 3 fix — query by messageId)

```typescript
if (result.toolCallIds && result.toolCallIds.length > 0) {
  const prisma = getPrisma();
  const toolCalls = await prisma.aiToolCall.findMany({
    where: {
      messageId: result.assistantMessageId,  // <-- Bug 3 fix: messageId, NOT toolCallIds
      status: 'success',
    },
    orderBy: { createdAt: 'desc' },
    select: { toolName: true, resultJson: true },
  });
```

### B4.4 — System prompt MANDATORY section (Bug 4 fix)

Verbatim from cs-chat/system-prompt.ts lines 8-10:
```
CRITICAL -- TOOL USE IS MANDATORY FOR PRODUCT/ORDER QUESTIONS:
You have these tools available and you MUST use them:
```

Followed by tool-specific instructions and MANDATORY RULES 1-5. We will prepend an equivalent block to the referrals system prompt, customized for referral tools.

### B4.5 — Route integration pattern (chat.ts)

```typescript
if (isFeatureAllowed('cs_chat')) {
  try {
    const latestUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!latestUser?.content) {
      return reply.status(400).send({ ok: false, error: "No user message found" });
    }
    const guestSessionId = request.headers['x-guest-session-id'] as string | undefined;
    const result = await runCsChat({ userText: latestUser.content, userId: userId ?? null, guestSessionId: guestSessionId ?? null, conversationId: conversationId ?? null });
    // ... set headers, return shaped response
  } catch (error) {
    console.error('[chat-route] runCsChat failed, falling back to Gemini:', error);
    // Intentional fall-through to Gemini path
  }
}
```

---

## B5 — Autonomy Level Assignment

| Tool | Level | Justification |
|---|---|---|
| get_referral_stats | L0 | Read-only. Returns user's own referral code, stats, link. No side effects. |
| get_referral_history | L0 | Read-only. Returns user's own referral history. Ownership scoped by userId. |
| validate_referral_code | L0 | Read-only. Checks if a code is valid. Public endpoint today. |
| get_referral_leaderboard | L0 | Read-only. Public data (first names + counts only). |
| generate_referral_code | L1 | Low-blast write. Creates a "code_holder" Referral row if user doesn't have one. Idempotent — /stats already does this. |
| explain_referral_program | L0 | Pure prompt-based answer, no tool execution needed. Will be handled by system prompt knowledge, not a tool. |

**No L2 or L3 tools proposed.** The referrals agent is read-heavy. The /apply and /complete endpoints are NOT exposed as agent tools because:
- /apply requires a referredUserId (the NEW user), which the agent won't have during registration flow
- /complete is called by the order completion flow, not by users
- Exposing either would create fraud vectors (see B11)

---

## B6 — Proposed Tool List

### Tool 1: `get_referral_stats`
- **Description:** Get the authenticated user's referral code, link, and stats (total, active, pending referrals; earnings).
- **Zod schema:**
  ```typescript
  z.object({}) // No args — scoped entirely by ctx.userId
  ```
- **Autonomy:** L0
- **Ownership check:** Yes — scoped by `ctx.userId`. Returns null for guests.
- **Timeout:** 5000ms (default)
- **Wraps:** Inline Prisma queries from `src/routes/referrals.ts` GET /stats handler (lines 34-66). No service function exists — tool will contain the query directly.

### Tool 2: `get_referral_history`
- **Description:** Get the authenticated user's referral history — list of people they referred with status and reward info.
- **Zod schema:**
  ```typescript
  z.object({
    limit: z.number().int().min(1).max(50).optional().describe('Max results (default 20)'),
  })
  ```
- **Autonomy:** L0
- **Ownership check:** Yes — scoped by `ctx.userId`. Returns null for guests.
- **Timeout:** 5000ms
- **Wraps:** Inline Prisma queries from `src/routes/referrals.ts` GET /history handler (lines 94-102). No service function exists.

### Tool 3: `validate_referral_code`
- **Description:** Check if a referral code is valid and active. Returns reward amounts if valid.
- **Zod schema:**
  ```typescript
  z.object({
    code: z.string().min(1).describe('The referral code to validate'),
  })
  ```
- **Autonomy:** L0
- **Ownership check:** No — public lookup (same as existing POST /validate endpoint).
- **Timeout:** 3000ms
- **Wraps:** Inline Prisma query from `src/routes/referrals.ts` POST /validate handler (lines 128-134).

### Tool 4: `get_referral_leaderboard`
- **Description:** Get the top 10 referrers (public leaderboard showing first names and referral counts).
- **Zod schema:**
  ```typescript
  z.object({
    limit: z.number().int().min(1).max(20).optional().describe('Max entries (default 10)'),
  })
  ```
- **Autonomy:** L0
- **Ownership check:** No — public data (first names only, no emails/IDs).
- **Timeout:** 5000ms
- **Wraps:** Inline Prisma queries from `src/routes/referrals.ts` GET /leaderboard handler (lines 253-273).

### Tool 5: `get_referral_program_info`
- **Description:** Get current referral program details: reward amounts, expiry period, how it works.
- **Zod schema:**
  ```typescript
  z.object({}) // No args — returns static program info
  ```
- **Autonomy:** L0
- **Ownership check:** No — public info.
- **Timeout:** 1000ms
- **Wraps:** "new — needs to be built" — returns the constants from referrals.ts (REFERRER_REWARD_CENTS, REFERRED_REWARD_CENTS, REFERRAL_EXPIRY_DAYS) plus the referral link template.

**Total: 5 tools, all L0 read-only.** This is intentionally conservative. Mutation tools can be added in a later phase after the read-only agent proves stable.

---

## B7 — System Prompt Requirements

### Domain knowledge the agent needs:
- StoresGo referral program: refer a friend, both get rewarded
- Referrer gets $25 credit, referred user gets $10 credit
- Referral expires after 30 days if the referred user doesn't make a qualifying purchase
- Referral codes look like "STGO" + 8 uppercase hex characters
- Referral link format: `https://storesgo.com/register?ref=<CODE>`
- Statuses: pending (applied, waiting for purchase), completed (qualifying order placed), expired (30 days passed), code_holder (user's own code record)
- Leaderboard shows top 10 referrers by completed referrals
- Payouts are tracked (paidOut flag) but disbursement is handled separately

### Example user utterances:
1. "What's my referral code?"
2. "How does the referral program work?"
3. "How many people have I referred?"
4. "Has anyone used my referral code?"
5. "How much have I earned from referrals?"
6. "Is code STGOAB12CD34 valid?"
7. "Who are the top referrers?"
8. "How do I share my referral link?"
9. "When do my referral rewards expire?"
10. "Can I see my referral history?"

### Things the prompt MUST forbid:
- **Privacy:** Never reveal another user's email, full name, or userId. Leaderboard shows first names only.
- **Honesty:** Never promise rewards not in the active program. Never guarantee payout timing.
- **No self-referral coaching:** Never help users create multiple accounts to self-refer.
- **No code sharing for others:** Only show the authenticated user's own code. Never look up or share another user's referral code.
- **No mutation promises:** The agent cannot apply codes, complete referrals, or trigger payouts. If asked, explain that those actions happen automatically during registration and after qualifying purchases.

### Bug 4 compliance:
**Confirmed: I will prepend the CRITICAL -- TOOL USE IS MANDATORY block verbatim from cs-chat/system-prompt.ts, adapted with the referral tool names. Bug 4 will not recur.**

---

## B8 — Route Integration Choice

### Options:
**(a) New route POST /api/agent/referrals** — Dedicated route for the referrals agent.
**(b) Extend POST /api/chat with intent routing** — Add referral intent detection to the existing chat route.
**(c) Embed in existing referrals routes as /assist sub-resource** — Add POST /referrals/assist.

### Recommendation: **(b) Extend POST /api/chat with intent routing**

The CS chat route already has the pattern: check feature flag -> extract latest user message -> run feature handler -> shape response -> fallback to Gemini. Adding a second feature flag check for `referrals` follows the same pattern with minimal new surface area. Users interact through a single chat interface — splitting into multiple endpoints would require the frontend to route intent before the agent even sees the message, which defeats the purpose of having an AI agent.

The implementation would add a second `if (isFeatureAllowed('referrals'))` block in chat.ts, or (better) implement a lightweight intent classifier that dispatches to the correct feature handler based on the user's message content.

---

## B9 — Schema Changes

**No schema changes needed for Phase 5.**

Rationale:
- The Referral model already has all fields the agent tools need to read.
- The ai_* tables (ai_conversations, ai_messages, ai_tool_calls, ai_autonomy_states) already support multi-feature use via the `featureKey` column.
- A new `ai_autonomy_states` row for `featureKey='referrals'` will be created at runtime by `AutonomyRepo.initializeFeature('referrals')` — no migration needed.

**No SQL migration file will be created.** No modifications to prisma/schema.prisma.

---

## B10 — Integration Test Plan

The integration test ships in the SAME commit as the feature. It will be placed at:
`src/agent/features/referrals/__tests__/referrals-agent.integration.test.ts`

### Test outline:

```typescript
// referrals-agent.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../../app.js';  // or wherever fastify app factory lives
import { getPrisma } from '../../../storage/prisma-client.js';

describe('Referrals Agent (integration)', () => {
  let app: ReturnType<typeof buildApp>;
  let testUserId: string;
  let testReferralCode: string;

  beforeAll(async () => {
    // 1. Build fastify app
    // 2. Seed test user with a referral code_holder record
    // 3. Seed 2-3 completed referrals for the test user
    // 4. Enable feature flag: AGENT_FEATURE_FLAGS=referrals
  });

  afterAll(async () => {
    // Clean up seeded data
    // Close app
  });

  it('should return referral stats via agent chat', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/chat',  // or wherever the route is mounted
      headers: {
        authorization: `Bearer ${testJwt}`,
        'content-type': 'application/json',
      },
      payload: {
        messages: [{ role: 'user', content: "What's my referral code?" }],
      },
    });

    const body = JSON.parse(response.body);

    // Assert response shape
    expect(body.ok).toBe(true);
    expect(body.response).toBeDefined();
    expect(body.suggestions).toBeInstanceOf(Array);
    expect(body.conversationId).toBeDefined();

    // Assert DB persistence
    const prisma = getPrisma();

    const conversation = await prisma.aiConversation.findFirst({
      where: { featureKey: 'referrals' },
      orderBy: { createdAt: 'desc' },
    });
    expect(conversation).not.toBeNull();
    expect(conversation!.featureKey).toBe('referrals');

    const messages = await prisma.aiMessage.findMany({
      where: { conversationId: conversation!.id },
      orderBy: { createdAt: 'asc' },
    });
    expect(messages.length).toBeGreaterThanOrEqual(2); // user + assistant

    const toolCalls = await prisma.aiToolCall.findMany({
      where: { messageId: messages[messages.length - 1].id },
    });
    // Agent should have called get_referral_stats
    expect(toolCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('should validate a referral code via agent chat', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/chat',
      headers: { 'content-type': 'application/json' },
      payload: {
        messages: [{ role: 'user', content: `Is code ${testReferralCode} valid?` }],
      },
    });

    const body = JSON.parse(response.body);
    expect(body.ok).toBe(true);
    expect(body.response).toBeDefined();
  });

  it('should handle guest user asking about referral program', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/chat',
      headers: { 'content-type': 'application/json' },
      payload: {
        messages: [{ role: 'user', content: 'How does the referral program work?' }],
      },
    });

    const body = JSON.parse(response.body);
    expect(body.ok).toBe(true);
    // Should explain program without requiring auth
  });
});
```

### Scope: vitest integration
Will use a `vitest.workspace` or `describe.concurrent` scope to separate from unit tests. The test requires:
- Real database (tunneled to dev Postgres)
- Real Fastify app instance
- Seeded referral data
- Feature flag enabled

---

## B11 — Risks + Unknowns

### R1: Unauthenticated /apply and /complete endpoints
**Severity: HIGH**
POST /apply and POST /complete have NO authentication. Anyone can call `POST /referrals/apply` with `{ code: "STGOXXXX", referredUserId: "any-user-id" }` to forge a referral. The agent must NOT expose these as tools, and the system prompt must NOT coach users on how to call these endpoints directly.
**Mitigation:** Do not create agent tools for /apply or /complete. Add auth to these endpoints in a separate security-focused PR (outside agent scope, but should be flagged to the team).

### R2: Referral fraud via social engineering
**Severity: MEDIUM**
A malicious user could ask the agent "Can you help me create referral codes for 10 email addresses?" or "Can you apply my code to user X?" The agent could theoretically provide coaching even without tools.
**Mitigation:** System prompt MUST include: "Never help users create multiple accounts, self-refer, or apply codes on behalf of other users. If asked, explain this violates the Terms of Service."

### R3: PII exposure via leaderboard
**Severity: LOW**
The leaderboard returns first names only (`user?.buyerProfile?.firstName || "User"`). No emails or IDs. The agent should not enrich this with additional data.
**Mitigation:** The get_referral_leaderboard tool returns the same data as the public endpoint. No additional PII is exposed.

### R4: PII exposure in referral history
**Severity: MEDIUM**
GET /history returns `referred?.email` for referred users. The agent could leak another user's email in a response.
**Mitigation:** The get_referral_history tool should mask emails (same as existing route: `r.referred?.email || r.referredEmail || "***@***.com"`). System prompt forbids revealing other users' full emails.

### R5: Race condition in code generation
**Severity: LOW**
`generateReferralCode` uses `userId + Date.now()` as hash input. Two concurrent requests from the same user could theoretically generate the same code, but the `@unique` constraint on `referralCode` would cause one to fail with a Prisma unique constraint error. The /stats endpoint creates code_holder records — concurrent first-visits could race.
**Mitigation:** The agent's get_referral_stats tool should handle Prisma unique constraint errors gracefully (retry once, or just fetch existing). Low probability in practice.

### R6: Missing indexes on referral_credit_transactions and referral_redemptions
**Severity: LOW**
Neither table has any indexes beyond the auto-generated PK index. At scale, queries on `user_id` or `referral_id` will be slow.
**Mitigation:** Not blocking for Phase 5 — the agent tools don't query these tables. Flag for future optimization.

### R7: No rate limiting on agent referral queries
**Severity: MEDIUM**
A user could spam the chat with "what's my referral code" repeatedly, burning LLM tokens. The existing per-conversation cost budget ($0.25) and per-feature budget ($500) provide some protection.
**Mitigation:** Existing agent cost caps apply. Consider adding a per-user rate limit on the chat route in a future phase.

### R8: Dual referral data models (Referral table vs User fields vs referral_credit_transactions vs referral_redemptions)
**Severity: MEDIUM (confusion risk, not BLOCK)**
There are 4 overlapping data structures for referrals. The routes only use the `Referral` model. The User.referral_code/referral_credit fields and the two standalone tables appear to be from an older implementation. If they contain different data, the agent could give inconsistent answers.
**Mitigation:** Agent tools query only the `Referral` model (matching existing route behavior). Document this in the system prompt: "Referral data comes from the referrals table. Ignore legacy fields."

### No BLOCK-severity issues identified. Phase 5 can proceed.

---

## B12 — Methodology Compliance Checklist

- [x] Read every file listed in Phase A — no skips, no summaries-from-memory (19 files read, see Phase A table)
- [x] All Prisma field names + @map annotations copied verbatim (Referral model has NO @map on fields; @@map("referrals") on table; ai_* models use @@map; User fields are snake_case)
- [x] All service function signatures copied verbatim (no service file exists — route handlers documented inline)
- [x] All four Phase 1 bug fixes will be honored:
  - Bug 1 (tool() wrapper): All tools will use the `AgentTool` interface from `src/agent/tools/types.ts` and be registered via `ToolRegistry.register()`
  - Bug 2 (scoped registry forwarding): Registry will be passed to `new AgentRunner({ registry })` and forwarded through the same chain as cs-chat
  - Bug 3 (response shaper messageId): Response shaper will query `aiToolCall.findMany({ where: { messageId: result.assistantMessageId } })`, not by toolCallIds
  - Bug 4 (system prompt mandatory section): Referrals system prompt will prepend the CRITICAL -- TOOL USE IS MANDATORY block with referral-specific tool names
- [x] Integration test plan committed in writing (section B10)
- [x] No production code written in this prompt
- [x] No prisma/schema.prisma modifications
- [x] No prisma generate
- [x] No tests run
- [x] No commits

---

## B13 — Prompt 2 Preview

**Prompt 2 will build the referrals agent feature: scoped tool registry (5 L0 read-only tools), referral-specific system prompt with MANDATORY tool-use block, identity resolver (reuses cs-chat pattern but enriches with referral data), response shaper with referral-specific suggestions, handler module following the cs-chat handler.ts pattern exactly, and the integration test.** Files created: `src/agent/tools/referrals/` (5 tool files + index.ts), `src/agent/features/referrals/` (handler.ts, system-prompt.ts, response-shaper.ts, identity-resolver.ts, index.ts), and `src/agent/features/referrals/__tests__/referrals-agent.integration.test.ts`. Files modified: `src/routes/chat.ts` (add `referrals` feature flag dispatch), `src/agent/flags/` if needed for the new feature key. No schema changes. No migrations.

**Commit message subject:** `feat(agent): referrals agent feature with 5 L0 tools + integration test (Phase 5 Prompt 2)`

**Exact files Prompt 2 will create or modify:**

New files:
- `src/agent/tools/referrals/get-referral-stats.ts`
- `src/agent/tools/referrals/get-referral-history.ts`
- `src/agent/tools/referrals/validate-referral-code.ts`
- `src/agent/tools/referrals/get-referral-leaderboard.ts`
- `src/agent/tools/referrals/get-referral-program-info.ts`
- `src/agent/tools/referrals/index.ts`
- `src/agent/features/referrals/handler.ts`
- `src/agent/features/referrals/system-prompt.ts`
- `src/agent/features/referrals/response-shaper.ts`
- `src/agent/features/referrals/identity-resolver.ts`
- `src/agent/features/referrals/index.ts`
- `src/agent/features/referrals/__tests__/referrals-agent.integration.test.ts`

Modified files:
- `src/routes/chat.ts` (add referrals feature flag dispatch block)
