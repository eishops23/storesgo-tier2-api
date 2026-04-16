// Agent Suite — Referrals system prompt tests (Phase 5 Prompt 3)

import { describe, it, expect } from 'vitest';
import {
  REFERRALS_SYSTEM_PROMPT_TEMPLATE,
  REFERRALS_FEATURE_KEY,
  renderReferralsSystemPrompt,
} from '../system-prompt.js';

describe('referrals system prompt', () => {
  it('feature key is referrals', () => {
    expect(REFERRALS_FEATURE_KEY).toBe('referrals');
  });

  it('contains the MANDATORY tool-use block (Bug 4 compliance)', () => {
    expect(REFERRALS_SYSTEM_PROMPT_TEMPLATE).toContain('CRITICAL');
    expect(REFERRALS_SYSTEM_PROMPT_TEMPLATE).toContain('TOOL USE IS MANDATORY');
    expect(REFERRALS_SYSTEM_PROMPT_TEMPLATE).toContain('MANDATORY RULES');
  });

  it('mentions all 5 tool names', () => {
    expect(REFERRALS_SYSTEM_PROMPT_TEMPLATE).toContain('get_referral_stats');
    expect(REFERRALS_SYSTEM_PROMPT_TEMPLATE).toContain('get_referral_history');
    expect(REFERRALS_SYSTEM_PROMPT_TEMPLATE).toContain('validate_referral_code');
    expect(REFERRALS_SYSTEM_PROMPT_TEMPLATE).toContain('get_referral_leaderboard');
    expect(REFERRALS_SYSTEM_PROMPT_TEMPLATE).toContain('get_referral_program_info');
  });

  it('includes the 5 forbidden behaviors', () => {
    expect(REFERRALS_SYSTEM_PROMPT_TEMPLATE).toContain('PRIVACY');
    expect(REFERRALS_SYSTEM_PROMPT_TEMPLATE).toContain('HONESTY');
    expect(REFERRALS_SYSTEM_PROMPT_TEMPLATE).toContain('SELF-REFERRAL');
    expect(REFERRALS_SYSTEM_PROMPT_TEMPLATE).toContain('CODE LOOKUPS FOR OTHERS');
    expect(REFERRALS_SYSTEM_PROMPT_TEMPLATE).toContain('MUTATION PROMISES');
  });

  it('includes domain knowledge', () => {
    expect(REFERRALS_SYSTEM_PROMPT_TEMPLATE).toContain('$25');
    expect(REFERRALS_SYSTEM_PROMPT_TEMPLATE).toContain('$10');
    expect(REFERRALS_SYSTEM_PROMPT_TEMPLATE).toContain('30 days');
    expect(REFERRALS_SYSTEM_PROMPT_TEMPLATE).toContain('STGO');
  });

  it('branches on isAuthenticated = true', () => {
    const prompt = renderReferralsSystemPrompt({
      userContext: { isAuthenticated: true, userId: 'user-1' },
    });
    expect(prompt).toContain('LOGGED IN USER');
    expect(prompt).not.toContain('GUEST USER');
  });

  it('branches on isAuthenticated = false', () => {
    const prompt = renderReferralsSystemPrompt({
      userContext: { isAuthenticated: false },
    });
    expect(prompt).toContain('GUEST USER');
    expect(prompt).not.toContain('LOGGED IN USER');
    expect(prompt).toContain('sign in');
  });
});
