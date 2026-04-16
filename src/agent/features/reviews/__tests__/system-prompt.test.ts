// Agent Suite — Reviews system prompt tests (Phase 11 Prompt 3)

import { describe, it, expect } from 'vitest';
import {
  REVIEWS_FEATURE_KEY,
  REVIEWS_TEMPLATE_HASH,
  REVIEWS_SYSTEM_PROMPT_TEMPLATE,
  renderReviewsSystemPrompt,
} from '../system-prompt.js';

describe('REVIEWS_FEATURE_KEY', () => {
  it("is the string 'reviews'", () => {
    expect(REVIEWS_FEATURE_KEY).toBe('reviews');
  });
});

describe('REVIEWS_TEMPLATE_HASH', () => {
  it('is a 16-character hex string', () => {
    expect(REVIEWS_TEMPLATE_HASH).toMatch(/^[a-f0-9]{16}$/);
  });
});

describe('REVIEWS_SYSTEM_PROMPT_TEMPLATE', () => {
  it('contains the MANDATORY tool-use block (Bug 4 fix)', () => {
    expect(REVIEWS_SYSTEM_PROMPT_TEMPLATE).toContain('CRITICAL — TOOL USE IS MANDATORY');
    expect(REVIEWS_SYSTEM_PROMPT_TEMPLATE).toContain('MANDATORY RULES');
  });

  it('mentions all 5 review tool names', () => {
    expect(REVIEWS_SYSTEM_PROMPT_TEMPLATE).toContain('list_my_reviews');
    expect(REVIEWS_SYSTEM_PROMPT_TEMPLATE).toContain('get_review_by_id');
    expect(REVIEWS_SYSTEM_PROMPT_TEMPLATE).toContain('get_review_stats');
    expect(REVIEWS_SYSTEM_PROMPT_TEMPLATE).toContain('find_reviews_needing_response');
    expect(REVIEWS_SYSTEM_PROMPT_TEMPLATE).toContain('draft_response');
  });

  it('encodes the 7 forbidden behaviors from audit B8', () => {
    const t = REVIEWS_SYSTEM_PROMPT_TEMPLATE;
    expect(t).toContain('NEVER PUBLISH');
    expect(t).toContain('NEVER ARGUE');
    expect(t).toContain('NEVER ADMIT FAULT');
    expect(t).toContain('NEVER OFFER refunds');
    expect(t).toContain("NEVER REVEAL another seller's data");
    expect(t).toContain('NEVER ECHO PERSONAL INFORMATION');
    expect(t).toContain('NEVER REFERENCE THE PLATFORM');
  });

  it('contains the {{sellerContext}} placeholder', () => {
    expect(REVIEWS_SYSTEM_PROMPT_TEMPLATE).toContain('{{sellerContext}}');
  });

  it('explicitly forbids claiming the agent has published anything', () => {
    // The prompt mentions "publish" only inside NEVER blocks. Verify the
    // load-bearing forbidden phrases are present.
    expect(REVIEWS_SYSTEM_PROMPT_TEMPLATE).toContain('There is no tool to post a response');
    expect(REVIEWS_SYSTEM_PROMPT_TEMPLATE).toContain('your response is now live');
    expect(REVIEWS_SYSTEM_PROMPT_TEMPLATE).toContain('NEVER PUBLISH');
  });
});

describe('renderReviewsSystemPrompt', () => {
  it('replaces sellerContext placeholder for authenticated seller with store name', () => {
    const rendered = renderReviewsSystemPrompt({
      sellerContext: { isAuthenticated: true, storeName: 'Caribbean Fresh Market' },
    });
    expect(rendered).toContain('AUTHENTICATED SELLER');
    expect(rendered).toContain('Caribbean Fresh Market');
    expect(rendered).not.toContain('{{sellerContext}}');
  });

  it('handles authenticated seller without store name gracefully', () => {
    const rendered = renderReviewsSystemPrompt({
      sellerContext: { isAuthenticated: true, storeName: null },
    });
    expect(rendered).toContain('AUTHENTICATED SELLER');
    expect(rendered).not.toContain('{{sellerContext}}');
  });

  it('renders an unauthenticated branch that tells the user to sign in', () => {
    const rendered = renderReviewsSystemPrompt({
      sellerContext: { isAuthenticated: false },
    });
    expect(rendered).toContain('UNAUTHENTICATED CALLER');
    expect(rendered).toContain('signed in as a seller');
    expect(rendered).not.toContain('{{sellerContext}}');
  });
});
