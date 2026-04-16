// Agent Suite — Merchandising system prompt tests (Phase 12 Prompt 2)

import { describe, it, expect } from 'vitest';
import {
  MERCHANDISING_FEATURE_KEY,
  MERCHANDISING_TEMPLATE_HASH,
  MERCHANDISING_SYSTEM_PROMPT_TEMPLATE,
  renderMerchandisingSystemPrompt,
} from '../system-prompt.js';

describe('MERCHANDISING_FEATURE_KEY', () => {
  it("is the string 'merchandising'", () => {
    expect(MERCHANDISING_FEATURE_KEY).toBe('merchandising');
  });
});

describe('MERCHANDISING_TEMPLATE_HASH', () => {
  it('is a 16-character hex string', () => {
    expect(MERCHANDISING_TEMPLATE_HASH).toMatch(/^[a-f0-9]{16}$/);
  });
});

describe('MERCHANDISING_SYSTEM_PROMPT_TEMPLATE', () => {
  it('contains the MANDATORY tool-use block (Bug 4 fix)', () => {
    expect(MERCHANDISING_SYSTEM_PROMPT_TEMPLATE).toContain('CRITICAL — TOOL USE IS MANDATORY');
    expect(MERCHANDISING_SYSTEM_PROMPT_TEMPLATE).toContain('MANDATORY RULES');
  });

  it('mentions all 5 merchandising tool names', () => {
    expect(MERCHANDISING_SYSTEM_PROMPT_TEMPLATE).toContain('get_merchandising_snapshot');
    expect(MERCHANDISING_SYSTEM_PROMPT_TEMPLATE).toContain('find_featured_products_zero_orders');
    expect(MERCHANDISING_SYSTEM_PROMPT_TEMPLATE).toContain('find_uncovered_categories');
    expect(MERCHANDISING_SYSTEM_PROMPT_TEMPLATE).toContain('get_featured_product_performance');
    expect(MERCHANDISING_SYSTEM_PROMPT_TEMPLATE).toContain('list_cms_blocks_schedule');
  });

  it('encodes the 6 forbidden behaviors', () => {
    const t = MERCHANDISING_SYSTEM_PROMPT_TEMPLATE;
    expect(t).toContain('NEVER PUBLISH');
    expect(t).toContain('NEVER MODIFY');
    expect(t).toContain('NEVER GUESS');
    expect(t).toContain('NEVER MAKE UP');
    expect(t).toContain('NEVER CLAIM');
    expect(t).toContain('NEVER CONFLATE');
  });

  it('explicitly calls out the null views7d limitation', () => {
    expect(MERCHANDISING_SYSTEM_PROMPT_TEMPLATE).toContain('views7d');
    expect(MERCHANDISING_SYSTEM_PROMPT_TEMPLATE).toContain('favoriteAdds7d');
    expect(MERCHANDISING_SYSTEM_PROMPT_TEMPLATE).toContain('no product-view tracking');
  });

  it('contains the {{operatorContext}} placeholder', () => {
    expect(MERCHANDISING_SYSTEM_PROMPT_TEMPLATE).toContain('{{operatorContext}}');
  });
});

describe('renderMerchandisingSystemPrompt', () => {
  it('renders authenticated branch with operator email', () => {
    const rendered = renderMerchandisingSystemPrompt({
      operatorContext: { isAuthenticated: true, operatorEmail: 'jon@storesgo.com' },
    });
    expect(rendered).toContain('AUTHENTICATED OPERATOR');
    expect(rendered).toContain('jon@storesgo.com');
    expect(rendered).not.toContain('{{operatorContext}}');
  });

  it('renders authenticated branch without email gracefully', () => {
    const rendered = renderMerchandisingSystemPrompt({
      operatorContext: { isAuthenticated: true, operatorEmail: null },
    });
    expect(rendered).toContain('AUTHENTICATED OPERATOR');
    expect(rendered).not.toContain('{{operatorContext}}');
  });

  it('renders unauthenticated branch instructing the user to sign in', () => {
    const rendered = renderMerchandisingSystemPrompt({
      operatorContext: { isAuthenticated: false },
    });
    expect(rendered).toContain('UNAUTHENTICATED CALLER');
    expect(rendered).toContain('signed in as an admin');
    expect(rendered).not.toContain('{{operatorContext}}');
  });
});
