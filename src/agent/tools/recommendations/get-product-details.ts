// Agent Suite — get_product_details tool (Phase 18A Prompt 3)

import { z } from 'zod';
import type { AgentTool } from '../types.js';

const argsSchema = z.object({
  productId: z.number().int().positive().describe('Numeric product ID to look up'),
});

type Args = z.infer<typeof argsSchema>;

export const getProductDetailsTool: AgentTool<Args, unknown> = {
  name: 'get_product_details',
  description:
    "Fetch full details for a product by numeric ID. Returns name, slug, price, image, seller, category, and AI tags. Works for both guests and authenticated customers. Returns null if the product is inactive or matches a prohibited category (alcohol).",
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['recommendations', 'product', 'read'],
  timeoutMs: 5000,
  async execute(args) {
    const { getProductDetailsForAgent } = await import(
      '../../../services/recommendations.service.js'
    );
    return getProductDetailsForAgent(args.productId);
  },
};
