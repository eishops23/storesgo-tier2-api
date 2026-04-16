# StoresGo Agent Suite — Scope 2 Roadmap (23 phases)

**Last updated:** 2026-04-10
**Status:** 4 of 23 phases shipped (Phase 0, Phase 0.9, Phase 1, Phase 5)
**Methodology:** Audit-first per CLAUDE.md. Every phase ships with integration test in same commit.

---

## Strategic context

StoresGo is building the AI-native ethnic grocery marketplace. The agent suite is not a feature — it is the operating layer that lets a solo founder run a multi-vendor marketplace at the operational density of a 50-person team. Every phase below either (a) reduces manual operational load on the founder/sellers, (b) increases revenue per customer, or (c) creates a defensive moat against Instacart, Weee!, Gopuff, and DoorDash.

We are not waiting for YC to be fully operational. The agent suite is the product, and the product ships incrementally to real users behind feature flags as each phase clears its smoke test.

---

## Phase status legend

- DONE — shipped to dev or prod, tests passing
- NEXT — currently in audit or active build
- PLANNED — sequenced but not started
- BACKLOG — committed to roadmap, no scheduled start

---

## Foundation

### Phase 0 — Foundation infrastructure — DONE
Scoped tool registries, AgentRunner, autonomy gates (L0/L1/L2/L3), ai_* persistence tables, response shapers, identity resolution, feature flag dispatch. Approximately 20% of total Scope 2 by complexity.

### Phase 0.9 — Robustness hardening — DONE
8 Tier A items: cost caps (per-conversation $0.25, per-feature $500), tool execution timeouts, LLM provider fallback chain (Sonnet 4.6 → Haiku 4.5 → GPT-4o-mini → Gemini Flash), jittered retry, integration test harness, prompt hash tracking, graceful shutdown, structured pino logging with correlation IDs. Nightly pg_dump backup live on OCI.

---

## Tier 2 — High-value extensions (EXTEND_EXISTING)

These wrap existing StoresGo infrastructure with agent intelligence. Lowest risk, fastest to ship, highest framework-validation value.

### Phase 1 — CS Chat — DONE
Customer-facing conversational agent. 4 catalog tools, real Meilisearch via dynamic import, real Claude Sonnet 4.6, real Postgres persistence. 4 smoke-test bugs caught and fixed. Commit 36fb23b.

### Phase 5 — Referrals — DONE
5 read-only L0 tools wrapping new src/services/referrals.service.ts. Service extraction, agent feature module, route integration with keyword dispatch, integration test. Honors all 4 Phase 1 bug fixes. Commits 13c10ac, d404a41, ef0e7df.

### Phase 11 — Review Response — NEXT
Seller-facing agent. Drafts AI-generated responses to customer reviews (never auto-publishes). Validates framework on a different audience and ownership scope. Estimated 3 prompts, 2 hours.

### Phase 9 — SEO — PLANNED
Wraps existing SEO infrastructure (14K+ pages, 7 verticals). Auto-generates blog posts, optimizes sitemaps, enriches structured data, suggests internal links, monitors keyword positions. Estimated 4 prompts, 3 hours.

### Phase 12 — Merchandising — PLANNED
Homepage block optimization, category curation, featured-product selection, seasonal collection generation. Wraps the 15 existing homepage endpoints and CMS blocks. Estimated 3 prompts, 2 hours.

---

## Tier 3 — New builds (some existing infra)

### Phase 3 — Email Agent — PLANNED
Transactional email (order confirmations, shipping updates, refund notices) plus outbound seller communications. Wraps SendGrid. Estimated 5 prompts, 6 hours.

### Phase 8 — RAG / Discovery — PLANNED
Retrieval-augmented agent over StoresGo knowledge base (seller policies, dietary info, recipes, product origin stories). Vector store on existing Meilisearch infrastructure. Powers Phase 1 with deeper context. Estimated 6 prompts, 8 hours.

### Phase 10 — Cart Recovery — PLANNED
Detects abandoned carts, generates personalized recovery messages, A/B tests subject lines and incentives, tracks recovery rate. Estimated 4 prompts, 5 hours.

### Phase 14 — Marketing — PLANNED
Email campaign generation, promotional content, ad copy, landing page copy. Distinct from Phase 15 (paid ads execution) and Phase 16 (social posting). Estimated 5 prompts, 6 hours.

---

## Tier 4 — Net new (BUILD_AS_SPEC)

### Phase 2 — Voice — BACKLOG
Voice ordering via phone or smart speaker. Twilio Voice + speech-to-text + agent. Estimated 8 prompts, 12 hours.

### Phase 4 — CS Supervisor — PLANNED
Meta-agent that monitors Phase 1 CS Chat conversations, flags edge cases, escalates to humans, tracks quality scores. Estimated 5 prompts, 6 hours.

### Phase 6 — Seller Acquisition — PLANNED (high YC value)
Identifies prospective ethnic grocery sellers in target geographies, generates personalized outreach, tracks pipeline, schedules onboarding calls. Directly grows the metric YC will care about. Estimated 6 prompts, 8 hours.

### Phase 7 — WhatsApp — BACKLOG
WhatsApp Business API integration for customer support, order updates, and promotions. Critical for ethnic grocery audience (high WhatsApp usage in Caribbean, Latin American, African, Asian diaspora communities). Estimated 5 prompts, 7 hours.

### Phase 13 — Pricing — PLANNED
Dynamic pricing recommendations based on competitor data, inventory levels, demand signals, and seller margin targets. Drafts only, never auto-applies. Estimated 5 prompts, 6 hours.

### Phase 15 — Paid Ads Agent — PLANNED
Generate, launch, monitor, and optimize paid acquisition campaigns across Meta Ads, Google Ads, TikTok Ads. Auto-pause underperformers, scale winners. Hard spend caps. L2/L3 with explicit human-in-loop above $X daily. Estimated 6 prompts, 9 hours.

### Phase 16 — Social Posting Agent — PLANNED
Generate social media content for StoresGo brand accounts AND individual seller accounts. Drafts and queues, never auto-publishes. Meta Graph API, TikTok Business API, LinkedIn, Pinterest. Each seller becomes a marketing channel. Estimated 5 prompts, 7 hours.

### Phase 17 — Inventory & Out-of-Stock Agent — PLANNED
Detects low/out-of-stock items in real-time, hides or deprioritizes from search, notifies sellers to restock, suggests substitutions to customers. Operational pain point at current scale (80K products, 10 active sellers). Estimated 5 prompts, 6 hours.

### Phase 18 — Substitution & Recommendation Agent — PLANNED (highest revenue lever)
Personalized product recommendations based on cart history, dietary preferences, household size, seasonal patterns. Cross-sell at checkout. Real-time substitution when items are OOS. Industry-standard AOV uplift from this category is 15-30%. The single highest-impact phase in the suite for revenue. Estimated 6 prompts, 8 hours.

### Phase 19 — Fraud & Abuse Detection Agent — PLANNED
Order fraud (mismatched address/payment, velocity, refund abuse), referral fraud (Phase 5 audit flagged unauthenticated /apply and /complete endpoints — fix in this phase), fake reviews (supports Phase 11), seller fraud (fake products, price manipulation, fake inventory). Flags for human review, never auto-blocks except in extreme cases with explicit thresholds. Estimated 6 prompts, 9 hours.

### Phase 20 — Customer Support Triage & Refunds — PLANNED
Extends Phase 1. Handles the escalation path when CS Chat can't resolve. Refund eligibility check, order lookup, seller contact, manager escalation. Auto-refunds within policy (e.g., delivery issues under $20). Turns Phase 1 from a deflection bot into a real support system. Estimated 5 prompts, 6 hours.

### Phase 21 — Logistics & Delivery Agent — PLANNED
EasyPost integration (already in stack). Route optimization, delivery time estimates, driver communication, exception handling (failed delivery, delayed shipment, address corrections). Estimated 5 prompts, 7 hours.

### Phase 22 — Onboarding Agent (sellers + customers) — PLANNED
New seller activation: helps list products, set up payments, write descriptions, take photos, complete KYC. New customer activation: welcome flow, dietary preference capture, first-order assistance, referral code application. Complements Phase 6 (acquisition) by handling the activation funnel. Estimated 5 prompts, 7 hours.

### Phase 23 — Localization & Translation Agent — PLANNED (ethnic grocery wedge)
Multi-language product descriptions, customer support, marketing content, seller dashboards. Critical for ethnic grocery positioning vs. Instacart. Caribbean Fresh Market customer in English, Haitian Kreyòl customer in Kreyòl, Korean grocery seller dashboard in Korean. Directly differentiates from generic marketplaces. Estimated 6 prompts, 8 hours.

---

## Sequencing strategy

### Sprint 1 (next 3 days)
Tier 2 completion: Phases 11, 9, 12. Five agents live in production. Framework validated across customer-facing AND seller-facing audiences. Production deploy of Phases 1+5+11 behind feature flag.

### Sprint 2 (next 2 weeks)
Phase 18 (recommendations — highest revenue lever), Phase 17 (inventory/OOS — operational pain), Phase 19 (fraud — YC asks about it, also fixes referral security debt), Phase 20 (CS triage — completes the support story).

### Sprint 3 (weeks 3-4)
Phase 6 (seller acquisition — grows the metric), Phase 16 (social posting — distribution moat), Phase 23 (localization — ethnic grocery wedge), Phase 22 (onboarding — activation funnel).

### Sprint 4 (weeks 5-8)
Phase 15 (paid ads), Phase 14 (marketing content), Phase 3 (email), Phase 4 (CS supervisor), Phase 13 (pricing).

### Sprint 5 (post-YC, weeks 9+)
Phase 8 (RAG), Phase 10 (cart recovery), Phase 21 (logistics), Phase 7 (WhatsApp), Phase 2 (voice).

### YC June 5 target
Minimum viable demo: 8 agents live in production (Phases 1, 5, 11, 9, 12, 18, 17, 19) with at least 1 paying customer using them. Stretch: 12 agents live with 3 paying customers.

---

## Estimated total scope

Approximately 110-130 prompts across 23 phases, 140-180 hours of focused build time. At current velocity (Phase 5 shipped in 4 prompts, 2 hours) the suite is buildable in 6-10 weeks of dedicated work. Realistic with parallel priorities: 12-16 weeks to full operational completeness.

---

## Hard rules across all phases

- Audit-before-coding per CLAUDE.md, no exceptions
- Integration test ships in same commit as feature
- All 4 Phase 1 bug-fix patterns honored: Vercel AI SDK tool() wrapper, scoped registry forwarding, response shaper queries by messageId, system prompt MANDATORY tool-use block
- Dynamic imports for service layer wrapping
- Manual SQL migrations only, never prisma migrate
- Per-feature flag in AGENT_FEATURE_FLAGS
- Default OFF in production, gradual rollout starting at internal-only
- L2/L3 mutations require human-in-loop until framework has operational hours
- Protected paths from CLAUDE.md never modified
- Every commit verified with npx tsc -p tsconfig.agent.json clean and npx vitest run green
