import { prisma } from "../plugins/prisma.js";

// ============ TYPES ============

export interface FilterOption {
  value: string;
  label?: string;
  count: number;
  selected?: boolean;
}

export interface FilterDefinition {
  key: string;
  displayName: string;
  type: 'checkbox' | 'radio' | 'range';
  options: FilterOption[];
}

export interface ActiveFilters {
  brands?: string[];
  dietary?: string[];
  origin?: string[];
  priceMin?: number;
  priceMax?: number;
  storeIds?: number[];
  [key: string]: any;
}

export interface FilteredProductsResult {
  products: any[];
  filters: FilterDefinition[];
  total: number;
  page: number;
  pageSize: number;
  appliedFilters: ActiveFilters;
}

// ============ KNOWN VALUES FOR EXTRACTION ============

const DIETARY_KEYWORDS: Record<string, string[]> = {
  'organic': ['organic', 'organico'],
  'gluten-free': ['gluten-free', 'gluten free', 'sin gluten'],
  'vegan': ['vegan', 'vegano'],
  'vegetarian': ['vegetarian', 'vegetariano'],
  'kosher': ['kosher'],
  'halal': ['halal'],
  'sugar-free': ['sugar-free', 'sugar free', 'sin azucar', 'no sugar'],
  'low-sodium': ['low-sodium', 'low sodium', 'reduced sodium'],
  'non-gmo': ['non-gmo', 'non gmo', 'no gmo'],
  'dairy-free': ['dairy-free', 'dairy free', 'sin lactosa', 'lactose free'],
  'nut-free': ['nut-free', 'nut free', 'peanut free'],
  'keto': ['keto', 'ketogenic'],
  'paleo': ['paleo']
};

const KNOWN_BRANDS = [
  'Goya', 'Grace', 'Iberia', 'Badia', 'La Fe', 'Kikkoman', 'Knorr', 'Nestle', 'Kraft', 'Heinz',
  'Del Monte', 'Dole', 'Libby', 'Hunt', 'Campbell', 'Progresso', 'Barilla', 'Ronzoni',
  'Quaker', 'Kellogg', 'General Mills', 'Post', 'Nabisco', 'Oreo', 'Ritz', 'Planters',
  'Blue Diamond', 'Wonderful', 'Ocean Spray', 'Welch', 'Smucker', 'Jif', 'Skippy', 'Nutella',
  'Hershey', 'Mars', 'Snickers', 'M&M', 'Skittles', 'Pepsi', 'Coca-Cola', 'Sprite', 'Fanta',
  'Dr Pepper', 'Gatorade', 'Tropicana', 'Minute Maid', 'Snapple', 'Lipton', 'Arizona',
  'Starbucks', 'Folgers', 'Maxwell House', 'Nescafe', 'Bustelo', 'Pilon', 'Cafe La Llave',
  'Lavazza', 'Walkerswood', 'Ting', 'Jarritos', 'Jumex', 'Maruchan', 'Nissin', 'Nongshim',
  'Samyang', 'Thai Kitchen', 'Lee Kum Kee', 'Mama', 'Maggi', 'Sazon', 'Adobo', 'Sofrito',
  'La Costena', 'Herdez', 'Cholula', 'Valentina', 'Tajin', 'Takis', 'Bimbo', 'Marinela',
  'Gamesa', 'Tia Rosa', 'Old El Paso', 'Ortega', 'Chi-Chi', 'Mission', 'Guerrero'
];

const ORIGIN_KEYWORDS: Record<string, string[]> = {
  'jamaica': ['jamaican', 'jamaica'],
  'puerto-rico': ['puerto rican', 'puerto rico', 'boricua'],
  'dominican': ['dominican', 'dominicano'],
  'mexico': ['mexican', 'mexico', 'mexicano'],
  'cuba': ['cuban', 'cuba', 'cubano'],
  'haiti': ['haitian', 'haiti'],
  'trinidad': ['trinidad', 'trinidadian'],
  'china': ['chinese', 'china'],
  'japan': ['japanese', 'japan'],
  'korea': ['korean', 'korea'],
  'thailand': ['thai', 'thailand'],
  'vietnam': ['vietnamese', 'vietnam'],
  'india': ['indian', 'india'],
  'philippines': ['filipino', 'philippines']
};

// ============ ATTRIBUTE EXTRACTION ============

function extractBrand(productName: string): string | null {
  const nameLower = productName.toLowerCase();
  for (const brand of KNOWN_BRANDS) {
    if (nameLower.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return null;
}

function extractDietary(text: string): string[] {
  const textLower = text.toLowerCase();
  const found: string[] = [];
  for (const [key, keywords] of Object.entries(DIETARY_KEYWORDS)) {
    if (keywords.some(kw => textLower.includes(kw))) {
      found.push(key);
    }
  }
  return found;
}

function extractOrigin(text: string): string[] {
  const textLower = text.toLowerCase();
  const found: string[] = [];
  for (const [key, keywords] of Object.entries(ORIGIN_KEYWORDS)) {
    if (keywords.some(kw => textLower.includes(kw))) {
      found.push(key);
    }
  }
  return found;
}

/**
 * Extract and save attributes for a product (uses AI tags + text analysis)
 */
export async function extractProductAttributes(productId: number): Promise<number> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, description: true, aiTags: true, aiDescription: true }
  });
  if (!product) return 0;

  const text = [product.name, product.description, product.aiDescription, ...(product.aiTags || [])].filter(Boolean).join(' ');
  const attributes: { key: string; value: string }[] = [];

  // Extract brand
  const brand = extractBrand(product.name);
  if (brand) attributes.push({ key: 'brand', value: brand });

  // Extract dietary
  extractDietary(text).forEach(d => attributes.push({ key: 'dietary', value: d }));

  // Extract origin
  extractOrigin(text).forEach(o => attributes.push({ key: 'origin', value: o }));

  // Save attributes
  let created = 0;
  for (const attr of attributes) {
    try {
      await prisma.productAttribute.create({
        data: { productId, key: attr.key, value: attr.value }
      });
      created++;
    } catch (e) {
      // Ignore duplicates
    }
  }
  return created;
}

/**
 * Bulk extract attributes for all products
 */
export async function extractAllProductAttributes(options: { batchSize?: number } = {}): Promise<{ processed: number; attributesCreated: number }> {
  const { batchSize = 1000 } = options;
  let processed = 0, attributesCreated = 0, offset = 0;

  while (true) {
    const products = await prisma.product.findMany({
      skip: offset,
      take: batchSize,
      select: { id: true, name: true, description: true, aiTags: true, aiDescription: true }
    });
    
    if (products.length === 0) break;

    for (const product of products) {
      const text = [product.name, product.description, product.aiDescription, ...(product.aiTags || [])].filter(Boolean).join(' ');
      const attributes: { key: string; value: string }[] = [];

      const brand = extractBrand(product.name);
      if (brand) attributes.push({ key: 'brand', value: brand });
      extractDietary(text).forEach(d => attributes.push({ key: 'dietary', value: d }));
      extractOrigin(text).forEach(o => attributes.push({ key: 'origin', value: o }));

      for (const attr of attributes) {
        try {
          await prisma.productAttribute.create({ data: { productId: product.id, key: attr.key, value: attr.value } });
          attributesCreated++;
        } catch (e) {}
      }
      processed++;
    }

    console.log(`Processed ${processed} products, ${attributesCreated} attributes created...`);
    offset += batchSize;
  }

  return { processed, attributesCreated };
}

// ============ FILTER CONFIG ============

export async function ensureFilterConfigs(): Promise<void> {
  const existing = await prisma.filterConfig.count();
  if (existing > 0) return;

  const defaults = [
    { categorySlug: null, filterKey: 'brand', displayName: 'Brand', filterType: 'checkbox', sortOrder: 1 },
    { categorySlug: null, filterKey: 'dietary', displayName: 'Dietary Preferences', filterType: 'checkbox', sortOrder: 2 },
    { categorySlug: null, filterKey: 'origin', displayName: 'Origin', filterType: 'checkbox', sortOrder: 3 },
    { categorySlug: null, filterKey: 'price', displayName: 'Price Range', filterType: 'range', sortOrder: 4 },
    { categorySlug: null, filterKey: 'store', displayName: 'Store', filterType: 'checkbox', sortOrder: 5 },
  ];

  for (const config of defaults) {
    await prisma.filterConfig.create({ data: config }).catch(() => {});
  }
}

export async function getFilterConfigs(categorySlug?: string): Promise<any[]> {
  await ensureFilterConfigs();
  return prisma.filterConfig.findMany({
    where: { isActive: true, OR: [{ categorySlug: null }, { categorySlug }] },
    orderBy: { sortOrder: 'asc' }
  });
}

// ============ HELPER: GET DESCENDANT CATEGORIES ============

async function getDescendantCategoryIds(categoryId: number): Promise<number[]> {
  const allCats = await prisma.category.findMany({ select: { id: true, parentId: true } });
  const ids = [categoryId];
  let added = true;
  while (added) {
    added = false;
    for (const cat of allCats) {
      if (cat.parentId && ids.includes(cat.parentId) && !ids.includes(cat.id)) {
        ids.push(cat.id);
        added = true;
      }
    }
  }
  return ids;
}

// ============ FACETED FILTERS WITH COUNTS ============

export async function getFiltersWithCounts(options: {
  categorySlug?: string;
  categoryId?: number;
  sellerId?: number;
  searchQuery?: string;
  activeFilters?: ActiveFilters;
}): Promise<FilterDefinition[]> {
  const { categorySlug, categoryId, sellerId, searchQuery, activeFilters = {} } = options;
  const configs = await getFilterConfigs(categorySlug);

  // Build base where for products
  const baseWhere: any = { isActive: true };
  if (categoryId) {
    const ids = await getDescendantCategoryIds(categoryId);
    baseWhere.categoryAssignments = { some: { categoryId: { in: ids } } };
  }
  if (searchQuery) {
    baseWhere.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } },
      { aiTags: { hasSome: [searchQuery.toLowerCase()] } }
    ];
  }

  const filters: FilterDefinition[] = [];

  for (const config of configs) {
    if (config.filterKey === 'brand') {
      const brands = await prisma.productAttribute.groupBy({
        by: ['value'],
        where: { key: 'brand', product: baseWhere },
        _count: true,
        orderBy: { _count: { value: 'desc' } },
        take: 30
      });
      if (brands.length > 0) {
        filters.push({
          key: 'brand',
          displayName: config.displayName,
          type: 'checkbox',
          options: brands.map(b => ({ value: b.value, count: b._count, selected: activeFilters.brands?.includes(b.value) }))
        });
      }
    }

    else if (config.filterKey === 'dietary') {
      const dietary = await prisma.productAttribute.groupBy({
        by: ['value'],
        where: { key: 'dietary', product: baseWhere },
        _count: true,
        orderBy: { _count: { value: 'desc' } }
      });
      if (dietary.length > 0) {
        filters.push({
          key: 'dietary',
          displayName: config.displayName,
          type: 'checkbox',
          options: dietary.map(d => ({ value: d.value, label: d.value.replace(/-/g, ' '), count: d._count, selected: activeFilters.dietary?.includes(d.value) }))
        });
      }
    }

    else if (config.filterKey === 'origin') {
      const origins = await prisma.productAttribute.groupBy({
        by: ['value'],
        where: { key: 'origin', product: baseWhere },
        _count: true,
        orderBy: { _count: { value: 'desc' } }
      });
      if (origins.length > 0) {
        filters.push({
          key: 'origin',
          displayName: config.displayName,
          type: 'checkbox',
          options: origins.map(o => ({ value: o.value, label: o.value.replace(/-/g, ' '), count: o._count, selected: activeFilters.origin?.includes(o.value) }))
        });
      }
    }

    else if (config.filterKey === 'price') {
      const stats = await prisma.product.aggregate({ where: baseWhere, _min: { priceCents: true }, _max: { priceCents: true } });
      filters.push({
        key: 'price',
        displayName: config.displayName,
        type: 'range',
        options: [
          { value: 'min', count: Math.floor((stats._min.priceCents || 0) / 100) },
          { value: 'max', count: Math.ceil((stats._max.priceCents || 10000) / 100) }
        ]
      });
    }

    else if (config.filterKey === 'store') {
      const stores = await prisma.product.groupBy({
        by: ['storeId'],
        where: { ...baseWhere, storeId: { not: null } },
        _count: true,
        orderBy: { _count: { storeId: 'desc' } },
        take: 15
      });
      const storeIds = stores.map(s => s.storeId).filter(Boolean) as number[];
      if (storeIds.length > 0) {
        const storeDetails = await prisma.store.findMany({ where: { id: { in: storeIds } }, select: { id: true, name: true } });
        filters.push({
          key: 'store',
          displayName: config.displayName,
          type: 'checkbox',
          options: stores.filter(s => s.storeId).map(s => {
            const store = storeDetails.find(sd => sd.id === s.storeId);
            return { value: String(s.storeId), label: store?.name || 'Unknown', count: s._count, selected: activeFilters.storeIds?.includes(s.storeId!) };
          })
        });
      }
    }
  }

  return filters;
}

// ============ FILTERED PRODUCTS (CATEGORY + SEARCH) ============

export async function getFilteredProducts(options: {
  categorySlug?: string;
  categoryId?: number;
  sellerId?: number;
  searchQuery?: string;
  filters?: ActiveFilters;
  page?: number;
  pageSize?: number;
  sort?: string;
}): Promise<FilteredProductsResult> {
  const { categorySlug, categoryId, sellerId, searchQuery, filters = {}, page = 1, pageSize = 24, sort = 'relevance' } = options;
  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: any = { isActive: true };
  if (sellerId) where.sellerId = sellerId;

  if (categoryId) {
    const ids = await getDescendantCategoryIds(categoryId);
    where.categoryAssignments = { some: { categoryId: { in: ids } } };
  }

  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } },
      { aiTags: { hasSome: [searchQuery.toLowerCase()] } },
      { aiSeoKeywords: { hasSome: [searchQuery.toLowerCase()] } }
    ];
  }

  // Apply attribute filters
  const attrFilters: any[] = [];
  if (filters.brands?.length) {
    attrFilters.push({ attributes: { some: { key: 'brand', value: { in: filters.brands } } } });
  }
  if (filters.dietary?.length) {
    attrFilters.push({ attributes: { some: { key: 'dietary', value: { in: filters.dietary } } } });
  }
  if (filters.origin?.length) {
    attrFilters.push({ attributes: { some: { key: 'origin', value: { in: filters.origin } } } });
  }
  if (attrFilters.length > 0) {
    where.AND = attrFilters;
  }

  // Price filter
  if (filters.priceMin || filters.priceMax) {
    where.priceCents = {};
    if (filters.priceMin) where.priceCents.gte = Math.round(filters.priceMin * 100);
    if (filters.priceMax) where.priceCents.lte = Math.round(filters.priceMax * 100);
  }

  // Store filter
  if (filters.storeIds?.length) {
    where.storeId = { in: filters.storeIds };
  }

  // Sort
  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'price-asc') orderBy = { priceCents: 'asc' };
  else if (sort === 'price-desc') orderBy = { priceCents: 'desc' };
  else if (sort === 'name-asc') orderBy = { name: 'asc' };
  else if (sort === 'name-desc') orderBy = { name: 'desc' };
  else if (sort === 'newest') orderBy = { createdAt: 'desc' };

  const [products, total, filterDefs] = await Promise.all([
    prisma.product.findMany({
      where, skip, take: pageSize, orderBy,
      select: {
        id: true, name: true, slug: true, priceCents: true, imageUrl: true, currency: true,
        aiTags: true, aiDescription: true,
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, storeName: true, slug: true } },
        store: { select: { id: true, name: true, slug: true } }
      }
    }),
    prisma.product.count({ where }),
    getFiltersWithCounts({ categorySlug, categoryId, searchQuery, activeFilters: filters })
  ]);

  return { products, filters: filterDefs, total, page, pageSize, appliedFilters: filters };
}

// ============ SMART SEARCH (UNIFIED) ============

export async function smartSearch(options: {
  query: string;
  filters?: ActiveFilters;
  page?: number;
  pageSize?: number;
  sort?: string;
}): Promise<FilteredProductsResult> {
  return getFilteredProducts({
    searchQuery: options.query,
    filters: options.filters,
    page: options.page,
    pageSize: options.pageSize,
    sort: options.sort
  });
}

// ============ ADMIN ============

export async function getFilterConfigsAdmin() {
  return prisma.filterConfig.findMany({ orderBy: [{ categorySlug: 'asc' }, { sortOrder: 'asc' }] });
}

export async function createFilterConfig(data: any) {
  return prisma.filterConfig.create({ data });
}

export async function updateFilterConfig(id: number, data: any) {
  return prisma.filterConfig.update({ where: { id }, data });
}

export async function deleteFilterConfig(id: number) {
  return prisma.filterConfig.delete({ where: { id } });
}

export async function getAttributeStats() {
  const [total, byKey, productsWithAttrs, totalProducts] = await Promise.all([
    prisma.productAttribute.count(),
    prisma.productAttribute.groupBy({ by: ['key'], _count: true }),
    prisma.product.count({ where: { attributes: { some: {} } } }),
    prisma.product.count()
  ]);

  return {
    total,
    byKey: byKey.map(b => ({ key: b.key, count: b._count })),
    productsWithAttributes: productsWithAttrs,
    totalProducts,
    coverage: totalProducts > 0 ? ((productsWithAttrs / totalProducts) * 100).toFixed(1) + '%' : '0%'
  };
}
