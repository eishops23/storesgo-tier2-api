// Agent Suite — Admin audit log repo tests (Phase 9 Prompt 3)

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn();

vi.mock('../prisma-client.js', () => ({
  getPrisma: vi.fn(() => ({
    aiAdminAuditLog: {
      create: mockCreate,
    },
  })),
}));

import { writeAdminAuditLog, redactPII } from '../admin-audit-log.repo.js';

beforeEach(() => {
  vi.clearAllMocks();
  mockCreate.mockResolvedValue({});
});

// =============================================================================
// redactPII
// =============================================================================

describe('redactPII', () => {
  it('returns null/undefined unchanged', () => {
    expect(redactPII(null)).toBeNull();
    expect(redactPII(undefined)).toBeUndefined();
  });

  it('passes through plain numbers and booleans', () => {
    expect(redactPII(42)).toBe(42);
    expect(redactPII(true)).toBe(true);
    expect(redactPII(0)).toBe(0);
  });

  it('passes through normal strings', () => {
    expect(redactPII('hello world')).toBe('hello world');
  });

  it('redacts JWT-shaped strings', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvbiJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    expect(redactPII(jwt)).toBe('[REDACTED_JWT]');
  });

  it('redacts email addresses', () => {
    expect(redactPII('jon@storesgo.com')).toBe('[REDACTED_EMAIL]');
    expect(redactPII('admin+test@example.co.uk')).toBe('[REDACTED_EMAIL]');
  });

  it('truncates strings longer than 2000 chars', () => {
    const long = 'a'.repeat(3000);
    const result = redactPII(long) as string;
    expect(result).toHaveLength(2000 + '...[TRUNCATED]'.length);
    expect(result.endsWith('...[TRUNCATED]')).toBe(true);
  });

  it('redacts password fields', () => {
    expect(redactPII({ password: 'hunter2' })).toEqual({ password: '[REDACTED]' });
    // Non-sensitive sibling field uses a name that does not contain any
    // substring from the secret-field regex (password, secret, token, apikey,
    // authorization, bearer). Aggressive substring matching is intentional —
    // over-redaction is the correct security behavior for audit logs.
    expect(redactPII({ user_password: 'x', notes: 'y' })).toEqual({
      user_password: '[REDACTED]',
      notes: 'y',
    });
  });

  it('redacts secret/token/apikey/authorization fields', () => {
    expect(redactPII({ secret: 'x', token: 'y', apiKey: 'z', authorization: 'Bearer x' })).toEqual({
      secret: '[REDACTED]',
      token: '[REDACTED]',
      apiKey: '[REDACTED]',
      authorization: '[REDACTED]',
    });
  });

  it('handles nested objects with mixed sensitive fields', () => {
    const input = {
      user: {
        email: 'jon@storesgo.com',
        password: 'hunter2',
        name: 'Jon',
      },
      action: 'login',
      meta: {
        token: 'eyJabc.def.ghi',
        attempts: 3,
      },
    };
    const result = redactPII(input) as any;
    expect(result.user.email).toBe('[REDACTED_EMAIL]');
    expect(result.user.password).toBe('[REDACTED]');
    expect(result.user.name).toBe('Jon');
    expect(result.action).toBe('login');
    expect(result.meta.token).toBe('[REDACTED]');
    expect(result.meta.attempts).toBe(3);
  });

  it('recurses into arrays', () => {
    const input = [{ password: 'x' }, 'jon@storesgo.com', 42];
    const result = redactPII(input) as any[];
    expect(result[0]).toEqual({ password: '[REDACTED]' });
    expect(result[1]).toBe('[REDACTED_EMAIL]');
    expect(result[2]).toBe(42);
  });

  it('does not mutate the input', () => {
    const input = { password: 'hunter2', name: 'Jon' };
    redactPII(input);
    expect(input.password).toBe('hunter2');
  });
});

// =============================================================================
// writeAdminAuditLog
// =============================================================================

describe('writeAdminAuditLog', () => {
  it('writes a basic entry successfully', async () => {
    await writeAdminAuditLog({
      adminId: 7,
      featureKey: 'seo',
      conversationId: 'conv-1',
      toolName: 'audit_blog_post',
      action: 'audit_blog_post',
      inputSummary: { postId: 42 },
      resultSummary: { score: 90 },
      success: true,
      durationMs: 123,
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminId: 7,
        featureKey: 'seo',
        conversationId: 'conv-1',
        toolName: 'audit_blog_post',
        action: 'audit_blog_post',
        success: true,
        durationMs: 123,
      }),
    });
  });

  it('redacts password fields in inputSummary before writing', async () => {
    await writeAdminAuditLog({
      adminId: 7,
      featureKey: 'seo',
      action: 'login_test',
      inputSummary: { username: 'jon', password: 'hunter2' },
      success: true,
    });

    const call = mockCreate.mock.calls[0][0] as any;
    expect(call.data.inputSummary).toEqual({
      username: 'jon',
      password: '[REDACTED]',
    });
  });

  it('redacts JWT in resultSummary', async () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.x_cAbHRJ9wG3xMKCMlEU_yZ0xTFG6X8VP3M-fK7DqKE';
    await writeAdminAuditLog({
      adminId: 7,
      featureKey: 'seo',
      action: 'x',
      resultSummary: jwt,
      success: true,
    });
    const call = mockCreate.mock.calls[0][0] as any;
    expect(call.data.resultSummary).toBe('[REDACTED_JWT]');
  });

  it('swallows DB errors and does not throw', async () => {
    mockCreate.mockRejectedValueOnce(new Error('DB connection lost'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      writeAdminAuditLog({
        adminId: 7,
        featureKey: 'seo',
        action: 'x',
        success: true,
      }),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('defaults nullable fields to null', async () => {
    await writeAdminAuditLog({
      adminId: 7,
      featureKey: 'seo',
      action: 'x',
      success: true,
    });

    const call = mockCreate.mock.calls[0][0] as any;
    expect(call.data.conversationId).toBeNull();
    expect(call.data.toolName).toBeNull();
    expect(call.data.errorMessage).toBeNull();
    expect(call.data.durationMs).toBeNull();
  });

  it('records failure with error message', async () => {
    await writeAdminAuditLog({
      adminId: 7,
      featureKey: 'seo',
      toolName: 'audit_blog_post',
      action: 'audit_blog_post',
      success: false,
      errorMessage: 'Tool timeout after 5000ms',
      durationMs: 5001,
    });

    const call = mockCreate.mock.calls[0][0] as any;
    expect(call.data.success).toBe(false);
    expect(call.data.errorMessage).toBe('Tool timeout after 5000ms');
    expect(call.data.durationMs).toBe(5001);
  });
});
