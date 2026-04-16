import { prisma } from "../plugins/prisma.js";

const AUTO_ASSIGN_THRESHOLD = 0.8;
const REVIEW_THRESHOLD = 0.5;

// ============ MAPPING RULES ============

export async function getMappingRules() {
  return prisma.categoryMapping.findMany({
    orderBy: [{ priority: 'desc' }, { targetCategoryId: "asc" }]
  });
}

export async function createMappingRule(data) {
  return prisma.categoryMapping.create({ data: { ...data, priority: data.priority ?? 50 } });
}

export async function updateMappingRule(id, data) {
  return prisma.categoryMapping.update({ where: { id }, data });
}

export async function deleteMappingRule(id) {
  return prisma.categoryMapping.delete({ where: { id } });
}

// ============ CATEGORIZATION ENGINE ============

function scoreProduct(product, categoryName, rules) {
  const productText = (product.name + ' ' + (product.description || '')).toLowerCase();
  const scores: Record<string, { score: number; rule: string }> = {};

  for (const rule of rules) {
    const val = rule.matchValue.toLowerCase();
    let matched = false;

    if (rule.matchType === 'keyword') matched = productText.includes(val);
    else if (rule.matchType === 'brand') matched = productText.includes(val);
    else if (rule.matchType === 'category_name') matched = categoryName?.toLowerCase() === val;
    else if (rule.matchType === 'regex') {
      try { matched = new RegExp(rule.matchValue, 'i').test(productText); } catch {}
    }

    if (matched) {
      const conf = rule.priority / 100;
      if (!scores[rule.targetCategory] || scores[rule.targetCategory].score < conf) {
        scores[rule.targetCategory] = { score: conf, rule: rule.matchType + ':' + rule.matchValue };
      }
    }
  }

  return Object.entries(scores).map(([slug, d]) => ({ 
    categorySlug: slug, confidence: d.score, matchedRule: d.rule 
  })).sort((a, b) => b.confidence - a.confidence);
}

export async function categorizeProducts(options) {
  const { productIds, limit = 1000, dryRun = false } = options;
  const stats = { processed: 0, assigned: 0, pendingReview: 0, skipped: 0 };

  const rules = await prisma.categoryMapping.findMany({ where: { isActive: true }, orderBy: { priority: 'desc' } });
  if (!rules.length) return stats;

  const mainCats = await prisma.category.findMany({ where: { parentId: null }, select: { id: true, slug: true, name: true } });
  const catMap = {};
  mainCats.forEach(c => { catMap[c.slug] = c.id; });

  const where = productIds?.length ? { id: { in: productIds } } : {};
  const products = await prisma.product.findMany({
    where, take: limit,
    select: { id: true, name: true, description: true, category: { select: { name: true } } }
  });

  for (const p of products) {
    stats.processed++;
    const assignments = scoreProduct(p, p.category?.name || null, rules);
    if (!assignments.length) { stats.skipped++; continue; }

    for (let i = 0; i < assignments.length; i++) {
      const a = assignments[i];
      const catId = catMap[a.categorySlug];
      if (!catId) continue;

      const status = a.confidence >= AUTO_ASSIGN_THRESHOLD ? 'auto' : a.confidence >= REVIEW_THRESHOLD ? 'pending_review' : null;
      if (!status) continue;

      if (!dryRun) {
        await prisma.productCategoryAssignment.upsert({
          where: { productId_categoryId: { productId: p.id, categoryId: catId } },
          create: { productId: p.id, categoryId: catId, confidence: a.confidence, isPrimary: i === 0, assignedBy: 'system', reviewStatus: status },
          update: { confidence: a.confidence, reviewStatus: status }
        }).catch(() => {});
      }
      status === 'auto' ? stats.assigned++ : stats.pendingReview++;
    }
  }
  return stats;
}

// ============ REVIEW QUEUE ============

export async function getPendingReviews(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    prisma.productCategoryAssignment.findMany({
      where: { reviewStatus: 'pending_review' },
      include: { 
        product: { select: { id: true, name: true, imageUrl: true, slug: true } }, 
        category: { select: { id: true, name: true, slug: true, icon: true } } 
      },
      orderBy: { confidence: 'desc' }, skip, take: pageSize
    }),
    prisma.productCategoryAssignment.count({ where: { reviewStatus: 'pending_review' } })
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function reviewAssignment(id, action, adminId) {
  return prisma.productCategoryAssignment.update({
    where: { id },
    data: { reviewStatus: action === 'approve' ? 'approved' : 'rejected', reviewedAt: new Date(), reviewedBy: adminId }
  });
}

export async function bulkReviewAssignments(ids, action, adminId) {
  return prisma.productCategoryAssignment.updateMany({
    where: { id: { in: ids } },
    data: { reviewStatus: action === 'approve' ? 'approved' : 'rejected', reviewedAt: new Date(), reviewedBy: adminId }
  });
}

// ============ MANUAL ASSIGNMENT ============

export async function manualAssign(productId, categoryIds, adminId) {
  await prisma.productCategoryAssignment.deleteMany({ where: { productId } });
  if (categoryIds.length === 0) return [];

  await prisma.productCategoryAssignment.createMany({
    data: categoryIds.map((cid, i) => ({
      productId, categoryId: cid, confidence: 1.0, isPrimary: i === 0, 
      assignedBy: 'admin', reviewStatus: 'approved', reviewedAt: new Date(), reviewedBy: adminId
    }))
  });
  return prisma.productCategoryAssignment.findMany({ where: { productId }, include: { category: true } });
}

export async function getProductAssignments(productId) {
  return prisma.productCategoryAssignment.findMany({
    where: { productId },
    include: { category: { select: { id: true, name: true, slug: true, icon: true } } },
    orderBy: { isPrimary: 'desc' }
  });
}

// ============ STATISTICS ============

export async function getAssignmentStats() {
  const [total, auto, pending, approved, rejected] = await Promise.all([
    prisma.productCategoryAssignment.count(),
    prisma.productCategoryAssignment.count({ where: { reviewStatus: 'auto' } }),
    prisma.productCategoryAssignment.count({ where: { reviewStatus: 'pending_review' } }),
    prisma.productCategoryAssignment.count({ where: { reviewStatus: 'approved' } }),
    prisma.productCategoryAssignment.count({ where: { reviewStatus: 'rejected' } })
  ]);

  const totalProducts = await prisma.product.count();
  const assignedProducts = await prisma.productCategoryAssignment.groupBy({ by: ['productId'] });
  const unassigned = totalProducts - assignedProducts.length;

  const byCategory = await prisma.productCategoryAssignment.groupBy({
    by: ['categoryId'], _count: true, where: { reviewStatus: { in: ['auto', 'approved'] } }
  });
  const cats = await prisma.category.findMany({
    where: { id: { in: byCategory.map(b => b.categoryId) } }, 
    select: { id: true, name: true, icon: true, slug: true }
  });
  const categoryStats = byCategory.map(b => {
    const c = cats.find(x => x.id === b.categoryId);
    return { id: b.categoryId, name: c?.name, icon: c?.icon, slug: c?.slug, count: b._count };
  }).sort((a, b) => b.count - a.count);

  return { total, auto, pending, approved, rejected, unassigned, totalProducts, byCategory: categoryStats };
}

// ============ HIERARCHY ============

export async function getCategoryTree() {
  const all = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: true, children: true } } }
  });

  const map = {};
  all.forEach(c => { map[c.id] = { ...c, children: [] }; });

  const roots = [];
  all.forEach(c => {
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].children.push(map[c.id]);
    } else if (!c.parentId) {
      roots.push(map[c.id]);
    }
  });

  return roots;
}

export async function reorderCategories(updates) {
  for (const u of updates) {
    await prisma.category.update({ where: { id: u.id }, data: { sortOrder: u.sortOrder, parentId: u.parentId } });
  }
  return getCategoryTree();
}
