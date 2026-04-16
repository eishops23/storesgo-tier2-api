-- Phase 9 — Admin audit log table
-- Manual migration. Do NOT run prisma migrate.
-- Apply with:
--   sudo -u postgres psql -d storesgo -f prisma/migrations/manual/012_phase9_admin_audit_log.sql
--   sudo -u postgres psql -d storesgo_agent_dev -f prisma/migrations/manual/012_phase9_admin_audit_log.sql
--
-- SOC 2-shaped immutable audit trail for admin-facing AI agent
-- invocations. Written synchronously after every tool call when
-- ToolContext.adminId is set. Never updated, never deleted by
-- application code.

CREATE TABLE IF NOT EXISTS ai_admin_audit_log (
  id              bigserial PRIMARY KEY,
  admin_id        integer NOT NULL,
  feature_key     text NOT NULL,
  conversation_id text,
  tool_name       text,
  action          text NOT NULL,
  input_summary   jsonb,
  result_summary  jsonb,
  success         boolean NOT NULL,
  error_message   text,
  duration_ms     integer,
  created_at      timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_admin_audit_log_admin_id
  ON ai_admin_audit_log (admin_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_admin_audit_log_feature_key
  ON ai_admin_audit_log (feature_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_admin_audit_log_conversation_id
  ON ai_admin_audit_log (conversation_id)
  WHERE conversation_id IS NOT NULL;

COMMENT ON TABLE ai_admin_audit_log IS
  'SOC 2-shaped immutable audit trail for admin-facing AI agent invocations. Written synchronously after every tool call when adminId is present. Never updated, never deleted by application code.';
