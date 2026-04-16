# StoresGo Agent Suite — Development Methodology

## CORE RULE: AUDIT BEFORE CODING

NEVER write code, patches, or migrations without first reading the actual files in the repo. Transfer briefs tell you WHAT exists. The actual files tell you HOW it is implemented. A single wrong assumption = `npx tsc` fails = wasted time, or worse, a smoke-test bug like the four we hit in Phase 1.

The four Phase 1 bugs (Vercel AI SDK tool() wrapper, scoped registry not forwarded, response shaper querying wrong key, system prompt missing tool-use mandate) ALL would have been caught by reading the actual SDK source, the actual executor signature, the actual Prisma column, and the actual cs-chat/system-prompt.ts before writing the next phase. Audit first.

---

## STEP-BY-STEP WORKFLOW

### Step 1: Read the transfer brief
Understand what shipped, what is next, what files are involved. Do NOT code.

### Step 2: List files to audit
For every task, enumerate the exact files to read:
- The file you will modify
- Files that import from it (to verify signatures still match)
- prisma/schema.prisma for any tables involved
- Frontend files that call the route (to lock in API contract)
- Any service file the new tool will dynamically import

### Step 3: Read every file in scope
- Exact function signatures and parameter names
- Import paths (relative, .js extension for ESM under NodeNext)
- Prisma field names vs DB column names (@map annotations)
- Existing patterns: error handling, auth, response shape, audit logging
- What already exists — never duplicate

### Step 4: Write code using exact strings from the audit
- Copy strings verbatim from audited files for str_replace / Python .replace()
- Match existing style: indentation, naming, error patterns
- Follow existing patterns for ctx.userId scoping and ownership checks
- Use Python .replace() for multi-line edits (never sed — it breaks)

### Step 5: Package every change with safety rails
Every code-modifying script must:
1. Backup files first: cp "$FILE" "$FILE.bak.$(date +%s)"
2. Apply changes via Python or str_replace (never sed for multi-line)
3. Run `npx tsc -p tsconfig.agent.json` (must be 0 errors before commit)
4. Run `npx vitest run` for affected scope (must be 0 failures)
5. For migrations: manual SQL only, never `prisma migrate`

### Step 6: Verify before declaring done
- `npx tsc -p tsconfig.agent.json` clean
- `npx vitest run` — all 268+ baseline tests still pass
- New integration test exercises the real route end-to-end
- Manual smoke test via curl/Invoke-WebRequest produces expected JSON
- DB rows confirmed via direct psql query (do not trust the API alone)

### Step 7: Commit per-prompt with detailed message
- One commit per prompt
- Multi-paragraph commit message describing what + why + what was verified
- Never bundle prompts into one commit

---

## NEVER DO

- Write a full file replacement without reading the current file
- Assume Prisma field names match DB column names — they often do not
- Use sed for multi-line replacements
- Skip the backup step
- Run prisma migrate (manual SQL in prisma/migrations/manual/ only)
- Trust tsx watch for runner/handler/singleton edits (hard restart)
- Mock LLM calls in unit tests AND skip integration tests
- Commit before npx tsc is clean
- Use blanket git checkout -- src/ (Session 43 burned this lesson)
- Pass scoped registry to one layer and not the next (Phase 1 Bug 2)
- Write a system prompt for tool-use without explicit MANDATORY section (Phase 1 Bug 4)
- Query ai_tool_calls by SDK tool IDs instead of messageId (Phase 1 Bug 3)
- Wrap LLM tools without the tool() helper from 'ai' (Phase 1 Bug 1)
- Touch src/routes/stripe.ts or app/checkout/page.tsx (Stripe migration in flight)

## ALWAYS DO

- Read actual files before writing any code
- Use Python or str_replace for file edits, never sed
- Backup every file before modifying
- Check Prisma column types AND @map annotations before queries
- After Prisma schema changes: npx prisma generate && npx tsc -p tsconfig.agent.json
- Verify npx tsc -p tsconfig.agent.json is 0 errors before PM2 restart
- Forward scoped registry through every layer of the agent runner
- Wrap every LLM tool with tool() from 'ai'
- Query ai_tool_calls by messageId: result.assistantMessageId
- Prepend the CRITICAL — TOOL USE IS MANDATORY block to every system prompt
- Write the integration test in the SAME commit as the feature
- Hard restart dev server after editing src/agent/runner/* or features/*/handler.ts

---

## STORESGO ENVIRONMENT REFERENCE

- Local dev: C:\projects\storesgo-backend-clean (Windows + PowerShell)
- Prod server: OCI 150.136.233.54, SSH key ~/.ssh/storesgo_new
- Prod backend: ~/backend/storesgo-backend-clean/storesgo-backend-clean
- Dev port: 5000 (NOT 4000)
- SSH tunnel: ssh -i $HOME\.ssh\storesgo_new -L 5433:localhost:5432 -L 7700:localhost:7700 -N ubuntu@150.136.233.54
- Postgres dev: localhost:5433 -> tunnels to OCI 5432 (db: storesgo_agent_dev)
- Meilisearch dev: localhost:7700 -> tunnels to OCI 7700
- Build agent scope: npx tsc -p tsconfig.agent.json
- Build full: npx tsc (warns ~90 pre-existing errors in non-agent code, ignore)
- Test: npx vitest run (268 baseline)
- Prod restart: pm2 restart storesgo-api && pm2 save
- PM2 cluster mode warning: storesgo-api runs in cluster mode. Agent code MUST be stateless across requests. No in-memory caches — use Redis or Postgres for shared state.

---

## HARD RULES

- Agent feature flag: AGENT_SUITE_ENABLED gates everything; default OFF in prod
- Per-feature flag: AGENT_FEATURE_FLAGS=cs_chat,referrals,...
- Autonomy levels: L0 read-only, L1 low-blast mutations, L2 user-visible mutations, L3 money/external comms (defer)
- All ai_* tables use @map("snake_case") for camelCase fields
- Manual SQL migrations only in prisma/migrations/manual/, never prisma migrate
- Pre-existing TS errors in src/ai/, src/jobs/, src/cron/, src/plugins/ are long-standing tech debt — use tsconfig.agent.json for our work
- Stripe migration in StoresGo checkout is in flight — DO NOT touch src/routes/stripe.ts or app/checkout/page.tsx in agent work
- Leaked OCI postgres password must be rotated BEFORE any prod deploy of agent code

---

## PROTECTED PATHS — DO NOT MODIFY IN AGENT WORK

These touch live revenue or in-flight migrations. Agent suite is ADDITIVE ONLY under src/agent/. Never edit:

- app/checkout/page.tsx (Stripe migration in flight)
- src/routes/stripe.ts (Stripe migration in flight)
- src/routes/checkout.ts
- src/services/payment*.ts
- src/services/seller-auth*.ts
- Any Meilisearch index write paths
- Any Stripe webhook handlers
- Alcohol/age gating logic in product queries
