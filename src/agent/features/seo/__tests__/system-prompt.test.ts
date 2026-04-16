// Agent Suite — SEO system prompt tests (Phase 9 Prompt 3)

import { describe, it, expect } from 'vitest';
import {
  SEO_FEATURE_KEY,
  SEO_TEMPLATE_HASH,
  SEO_SYSTEM_PROMPT_TEMPLATE,
  renderSeoSystemPrompt,
} from '../system-prompt.js';

describe('SEO_FEATURE_KEY', () => {
  it("is the string 'seo'", () => {
    expect(SEO_FEATURE_KEY).toBe('seo');
  });
});

describe('SEO_TEMPLATE_HASH', () => {
  it('is a 16-character hex string', () => {
    expect(SEO_TEMPLATE_HASH).toMatch(/^[a-f0-9]{16}$/);
  });
});

describe('SEO_SYSTEM_PROMPT_TEMPLATE', () => {
  it('contains the MANDATORY tool-use block (Bug 4 fix)', () => {
    expect(SEO_SYSTEM_PROMPT_TEMPLATE).toContain('CRITICAL — TOOL USE IS MANDATORY');
    expect(SEO_SYSTEM_PROMPT_TEMPLATE).toContain('MANDATORY RULES');
  });

  it('mentions all 7 SEO tool names', () => {
    expect(SEO_SYSTEM_PROMPT_TEMPLATE).toContain('audit_blog_post');
    expect(SEO_SYSTEM_PROMPT_TEMPLATE).toContain('audit_seo_page');
    expect(SEO_SYSTEM_PROMPT_TEMPLATE).toContain('find_content_gaps');
    expect(SEO_SYSTEM_PROMPT_TEMPLATE).toContain('find_orphan_blog_posts');
    expect(SEO_SYSTEM_PROMPT_TEMPLATE).toContain('find_similar_blog_posts');
    expect(SEO_SYSTEM_PROMPT_TEMPLATE).toContain('get_blog_stats');
    expect(SEO_SYSTEM_PROMPT_TEMPLATE).toContain('draft_blog_post_outline');
  });

  it('encodes the 6 forbidden behaviors', () => {
    const t = SEO_SYSTEM_PROMPT_TEMPLATE;
    expect(t).toContain('NEVER PUBLISH');
    expect(t).toContain('NEVER MODIFY');
    expect(t).toContain('NEVER GUESS');
    expect(t).toContain('NEVER MAKE UP');
    expect(t).toContain('NEVER RECOMMEND CONTENT');
    expect(t).toContain('NEVER REFERENCE');
  });

  it('explicitly debunks the 14K+ pages claim', () => {
    expect(SEO_SYSTEM_PROMPT_TEMPLATE).toContain('632');
    expect(SEO_SYSTEM_PROMPT_TEMPLATE).toContain('633');
    expect(SEO_SYSTEM_PROMPT_TEMPLATE).toContain('14K+');
  });

  it('contains the {{operatorContext}} placeholder', () => {
    expect(SEO_SYSTEM_PROMPT_TEMPLATE).toContain('{{operatorContext}}');
  });
});

describe('renderSeoSystemPrompt', () => {
  it('renders authenticated branch with operator email', () => {
    const rendered = renderSeoSystemPrompt({
      operatorContext: { isAuthenticated: true, operatorEmail: 'jon@storesgo.com' },
    });
    expect(rendered).toContain('AUTHENTICATED OPERATOR');
    expect(rendered).toContain('jon@storesgo.com');
    expect(rendered).not.toContain('{{operatorContext}}');
  });

  it('renders authenticated branch without email gracefully', () => {
    const rendered = renderSeoSystemPrompt({
      operatorContext: { isAuthenticated: true, operatorEmail: null },
    });
    expect(rendered).toContain('AUTHENTICATED OPERATOR');
    expect(rendered).not.toContain('{{operatorContext}}');
  });

  it('renders unauthenticated branch instructing the user to sign in', () => {
    const rendered = renderSeoSystemPrompt({
      operatorContext: { isAuthenticated: false },
    });
    expect(rendered).toContain('UNAUTHENTICATED CALLER');
    expect(rendered).toContain('signed in as an admin');
    expect(rendered).not.toContain('{{operatorContext}}');
  });
});
