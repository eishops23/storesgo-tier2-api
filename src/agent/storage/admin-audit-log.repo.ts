// Agent Suite — Admin audit log repository (Phase 9 Prompt 3)
//
// Synchronous, immutable audit trail for admin-facing AI agent
// invocations. Written by the tool-adapter after every tool call
// when ToolContext.adminId is present. Never updated, never
// deleted by application code.
//
// Failures NEVER bubble up. The audit log is observability, not
// control flow — if it breaks, the agent must still serve the
// operator. Errors are logged to stderr and swallowed.

import { getPrisma } from './prisma-client.js';

export interface AdminAuditLogEntry {
  adminId: number;
  featureKey: string;
  conversationId?: string | null;
  toolName?: string | null;
  action: string;
  inputSummary?: unknown;
  resultSummary?: unknown;
  success: boolean;
  errorMessage?: string | null;
  durationMs?: number | null;
}

const SECRET_FIELD_RE = /password|secret|token|apikey|api_key|authorization|bearer/i;
const JWT_SHAPE_RE = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const EMAIL_SHAPE_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const STRING_TRUNCATE_LIMIT = 2000;

/**
 * Recursive PII redaction. Strings that look like JWTs or emails
 * are replaced wholesale; very long strings are truncated. Object
 * keys that look like secret-bearing fields are blanked. Never
 * mutates the input — always returns a fresh structure.
 */
export function redactPII(input: unknown): unknown {
  if (input == null) return input;

  if (typeof input === 'string') {
    if (JWT_SHAPE_RE.test(input)) return '[REDACTED_JWT]';
    if (EMAIL_SHAPE_RE.test(input)) return '[REDACTED_EMAIL]';
    if (input.length > STRING_TRUNCATE_LIMIT) {
      return input.slice(0, STRING_TRUNCATE_LIMIT) + '...[TRUNCATED]';
    }
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactPII(item));
  }

  if (typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (SECRET_FIELD_RE.test(k)) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = redactPII(v);
      }
    }
    return out;
  }

  // numbers, booleans, etc — pass through
  return input;
}

/**
 * Write a single audit log entry. Never throws — failures are
 * logged to stderr and swallowed so the calling tool execution
 * cannot be broken by audit-log database issues.
 */
export async function writeAdminAuditLog(entry: AdminAuditLogEntry): Promise<void> {
  const prisma = getPrisma();
  try {
    await prisma.aiAdminAuditLog.create({
      data: {
        adminId: entry.adminId,
        featureKey: entry.featureKey,
        conversationId: entry.conversationId ?? null,
        toolName: entry.toolName ?? null,
        action: entry.action,
        inputSummary: redactPII(entry.inputSummary) as never,
        resultSummary: redactPII(entry.resultSummary) as never,
        success: entry.success,
        errorMessage: entry.errorMessage ?? null,
        durationMs: entry.durationMs ?? null,
      },
    });
  } catch (err) {
    // Audit log failures must NEVER break the agent. In production
    // this should also page an operator (alerting wired up by ops).
    console.error('[admin-audit-log] Write failed:', err);
  }
}
