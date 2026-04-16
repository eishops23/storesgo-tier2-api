// Agent Suite — list_categories tool (Phase 0 Part C)

import { z } from 'zod';
import type { AgentTool } from '../types.js';
import { getPrisma } from '../../storage/prisma-client.js';

const argsSchema = z.object({
  parentId: z.number().int().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

type Args = z.infer<typeof argsSchema>;

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  parentId: number | null;
  sortOrder: number;
}

interface Result {
  categories: CategoryItem[];
  total: number;
}

export const listCategoriesTool: AgentTool<Args, Result> = {
  name: 'list_categories',
  description:
    'List product categories. By default returns top-level categories. Pass parentId to get subcategories.',
  argsSchema,
  requiredAutonomy: 'L0',
  reversible: true,
  tags: ['read', 'category'],
  async execute(args, ctx) {
    const prisma = ctx.prisma ?? getPrisma();
    const where = args.parentId !== undefined
      ? { parentId: args.parentId }
      : { parentId: null };

    const categories = await prisma.category.findMany({
      where,
      take: args.limit,
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        image: true,
        parentId: true,
        sortOrder: true,
      },
    });

    return {
      categories: categories as CategoryItem[],
      total: categories.length,
    };
  },
};
