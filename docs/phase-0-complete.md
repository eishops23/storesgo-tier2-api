# Phase 0 - Agent Suite Foundation: Complete

Status: Complete and verified end-to-end
Completed: 2026-04-08
Final commit: 4fd9d6b
Test count: 164 passing, 0 failures, 0 TypeScript errors

---

## What Phase 0 Delivers

A complete multi-agent foundation capable of running any feature-specific agent against StoresGo data, with:

- Multi-provider LLM client (Anthropic primary, OpenAI/Gemini secondary) via Vercel AI SDK v6
- Tool framework with Zod-validated args, autonomy-aware execution gate, and full audit logging
- Agent runner loop with tool calling, message history, and cost/token accounting
- 6 Prisma models for conversation persistence (AiCustomerIdentity, AiIdentityAlias, AiConversation, AiMessage, AiToolCall, AiAutonomyState)
- Feature flag system with 5-level precedence (kill switch, suite enabled, allowlist, max level cap, DB level)
- Graduated autonomy (L0 observe, L1 propose, L2 execute with retract, L3 autonomous) with promotion criteria
- Eval hooks with a baseline heuristic scorer and registry for per-feature custom scorers
- 5-check readiness system (API key, DB connection, migration applied, suite enabled, kill switch)
- 11 CLI admin scripts for operational control (readiness, dashboard, promote, kill-switch, cost-report, etc.)
- 4 starter catalog tools (search_products, get_product_by_id, list_categories, get_store_stats)

## Commits (9 total)

| # | Hash | Description |
|---|------|-------------|
| 1 | f71099e | Initial production snapshot baseline |
| 2 | a43b48c | Pre-build gap audit + agent build isolation (Prompt 1) |
| 3 | 859eda3 | Part A - LLM client foundation (multi-provider) |
| 4 | 7a92954 | Part B - Prisma models + storage layer (6 tables, 5 enums) |
| 5 | d5fe7b9 | Part C - Tool framework + 4 starter tools |
| 6 | 31aacfd | Part D - Agent runner with LLM tool-calling loop |
| 7 | 5c482bf | Part E - Feature flags + autonomy + eval + readiness |
| 8 | f69f42a | Prompt 6.5 - 11 CLI admin scripts |
| 9 | 4fd9d6b | Fix - load history before creating empty placeholder (real-API bug) |

## End-to-End Verification

Smoke test executed on 2026-04-08 against real infrastructure:

- LLM provider: Anthropic Claude Sonnet 4.6
- Database: storesgo_agent_dev (cloned from production, 95411 products, 93 sellers, 1162 categories)
- Tool registered: search_products
- User query: "What are some rice products you have? Just show me 3."
- Result: HTTP 200, real product data returned

### Actual response from the agent

Here are 3 rice products we have available:

1. Rice-A-Roni Cheddar Broccoli Flavor Rice (2 Pack, 6.5 oz each) - $15.75
2. Mille Lacs Wild Rice Canoe Wild Rice (12 Pack, 15 oz each) - $114.22
3. BEN ORIGINAL Flavored Long Grain Rice & Wild Rice (12 Pack, 6 oz boxes) - $54.73

We actually have 1,933 rice products in total.

### Metrics

- Tool calls executed: 1 (search_products)
- Input tokens: 1805
- Output tokens: 173
- Cost: $0.008010
- Duration: 8108ms
- Finish reason: stop

## Operational State

### Local dev (Windows)

- Working dir: C:\projects\storesgo-backend-clean
- SSH tunnel: localhost 5433 to OCI localhost 5432
- Local .env has ANTHROPIC_API_KEY (108 chars) and DATABASE_URL pointing to tunneled dev DB
- Prisma client regenerated and queried dev DB successfully

### OCI dev database

- Name: storesgo_agent_dev
- Contents: full clone of production as of 2026-04-08
- New ai_* tables: 6 (ai_customer_identities, ai_identity_aliases, ai_conversations, ai_messages, ai_tool_calls, ai_autonomy_states)
- Legacy ai_* tables untouched: 3 (ai_category_logs, ai_enrichment_logs, ai_logs)
- First feature initialized: cs_chat_test at L0 (used for smoke test)

### OCI production

- Postgres password rotated (old storesgo123 replaced with strong random ~31 chars)
- storesgo-api restarted cleanly, health check returning 200
- No agent code deployed to prod yet
- Production .env.bak exists with old password (delete within 24h per tech debt backlog)

## Flag Precedence (production-ready)

From highest to lowest priority:

1. AGENT_KILL_SWITCH=true disables everything
2. AGENT_SUITE_ENABLED must be true in production for anything to run
3. AGENT_FEATURE_FLAGS is an explicit allowlist of feature keys
4. AGENT_FEATURE_KEY_MAX_LEVEL is a per-feature max autonomy cap
5. DB AiAutonomyState.currentLevel is the default level from the database

In dev all flags are unset so everything is allowed at the DB level. In prod AGENT_SUITE_ENABLED=true must be explicitly set.

## Promotion Criteria

| Promotion | Min Executions | Min Eval | Max Error Rate |
|-----------|----------------|----------|----------------|
| L0 to L1 | 20 | 3.5 / 5 | 10% |
| L1 to L2 | 50 | 4.0 / 5 | 5% |
| L2 to L3 | 500 | 4.5 / 5 | 1% |

## What Phase 0 Does NOT Deliver (Deferred)

- SQL migration in production DB - deferred until after Phase 1 feature flags are in place
- Production deployment of agent code - dormant, waiting for Phase 1
- HTTP admin interface - deferred to Phase 0.7 after Phase 1 CS chat ships; CLI scripts cover operations for now
- Eval scoring with LLM-as-judge - using baseline heuristic scorer only; richer scorers come per-feature
- Non-Anthropic provider testing - OpenAI and Gemini integrations are in code but not smoke-tested against real APIs
- Retell AI voice integration - Phase 2

## Ready For Phase 1

Phase 0 is the foundation on which all feature-specific agents will be built. The next phase wraps the existing aiChat.service.ts with the AgentRunner framework, creating the first real customer-facing agent: CS Chat.

See docs/tech-debt-backlog.md for tech debt items accumulated during Phase 0.

See docs/agent-audit.md for the pre-build gap audit that informed Phase 0's scope.
