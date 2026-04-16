-- Phase 0.9 Robustness Hardening — Manual Migration
-- Apply to storesgo_agent_dev ONLY (port 5433 tunnel)
-- DO NOT apply to production until Phase 1 is stable
--
-- Run: psql -h localhost -p 5433 -U storesgo -d storesgo_agent_dev -f prisma/migrations/manual/009_phase09_hardening.sql

-- 1. Add promptHash to ai_messages for prompt version drift tracking
ALTER TABLE ai_messages ADD COLUMN IF NOT EXISTS "promptHash" VARCHAR(64);

-- 2. Add costBudgetCents to ai_autonomy_states for per-feature cost ceiling
ALTER TABLE ai_autonomy_states ADD COLUMN IF NOT EXISTS "costBudgetCents" INTEGER DEFAULT 50000;
