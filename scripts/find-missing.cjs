const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== FINDING MISSING CATEGORIES ===\n');
  
  // Search for snacks, baking, health categories
  const searches = ['snack', 'baking', 'health', 'wellness', 'cooking'];
  
  for (const term of searches) {
    const matches = await prisma.category.findMany({
      where: { 
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { slug: { contains: term, mode: 'insensitive' } }
        ],
        parentId: null // top level only
      },
      select: { id: true, name: true, slug: true }
    });
    console.log(`"${term}" top-level matches:`, matches.length);
    if (matches.length > 0) console.table(matches);
  }
  
  // Check what categories have the most uncategorized products
  console.log('\n=== TOP CATEGORIES BY PRODUCT COUNT ===');
  const topCats = await prisma.category.findMany({
    where: { parentId: null },
    select: { id: true, name: true, slug: true }
  });
  
  for (const cat of topCats) {
    const count = await prisma.product.count({ 
      where: { categoryId: cat.id, isActive: true }
    });
    if (count > 0) {
      console.log(`${cat.name} (${cat.slug}): ${count} direct products`);
    }
  }
  
  // Check where the uncategorized products actually are
  console.log('\n=== PRODUCT DISTRIBUTION CHECK ===');
  const productsByTopParent = await prisma.$queryRaw`
    WITH RECURSIVE cat_tree AS (
      SELECT id, name, slug, id as root_id, name as root_name
      FROM categories WHERE parent_id IS NULL
      UNION ALL
      SELECT c.id, c.name, c.slug, ct.root_id, ct.root_name
      FROM categories c
      JOIN cat_tree ct ON c.parent_id = ct.id
    )
    SELECT ct.root_name, COUNT(p.id)::int as product_count
    FROM products p
    JOIN cat_tree ct ON p.category_id = ct.id
    WHERE p.is_active = true
    GROUP BY ct.root_id, ct.root_name
    ORDER BY product_count DESC
  `;
  console.table(productsByTopParent);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
