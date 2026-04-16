/**
 * STORESGO SLUG UTILITY
 * Marketplace-grade slug generation for products, categories, sellers
 * Used by: product creation, bulk import, API endpoints, migrations
 */

export function generateProductSlug(name: string, id: number): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')                    // Remove apostrophes  
    .replace(/[^a-z0-9\s-]/g, '')            // Remove special chars
    .replace(/\s+/g, '-')                     // Spaces to hyphens
    .replace(/-+/g, '-')                      // Collapse multiple hyphens
    .replace(/^-|-$/g, '')                    // Trim leading/trailing hyphens
    .substring(0, 80);                        // SEO-friendly length
  
  return `${base}-${id}`;
}

export function generateCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[''&]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function generateSellerSlug(storeName: string, id: number): string {
  const base = storeName
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
  
  return `${base}-${id}`;
}

// Extract ID from slug (e.g., "dr-bronners-soap-1700" -> 1700)
export function extractIdFromSlug(slug: string): number | null {
  const match = slug.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

// Check if string is numeric ID or slug
export function isNumericId(value: string): boolean {
  return /^\d+$/.test(value);
}
