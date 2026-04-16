// Agent Suite — draft_response tool (Phase 11 Prompt 3)
//
// IMPORTANT: This tool returns the CONTEXT the agent needs to compose a draft
// response in its own user-facing assistant message. It does NOT return the
// final draft text and does NOT publish anything. The LLM composes the actual
// draft in its reply, using the suggestedToneNotes, productName, customer
// first name, rating, and original comment surfaced here. There is no
// publish_response tool by design — the human-in-loop guardrail is enforced
// by the absence of any publishing surface in the registry.

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  reviewId: z
    .number()
    .int()
    .positive()
    .describe('The numeric ID of the review the seller wants to draft a response for'),
});

type Args = z.infer<typeof argsSchema>;

export const draftResponseTool: AgentTool<Args, unknown> = {
  name: 'draft_response',
  description:
    "Load the context needed to draft a response to a specific review. Returns the product name, the customer's first name, the rating, the original review text, and tone guidance — but does NOT return a finished draft and does NOT publish anything. The agent uses this context to compose a draft in its own user-facing reply. Only works for reviews on the authenticated seller's products.",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['reviews', 'drafting', 'read'],
  timeoutMs: 8000,
  async execute(args, ctx) {
    if (ctx.sellerId === undefined) return null;

    const { loadReviewForDrafting } = await import('../../../services/reviews.service.js');
    return loadReviewForDrafting(ctx.sellerId, args.reviewId);
  },
};
