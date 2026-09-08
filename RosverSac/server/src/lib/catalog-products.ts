import { pool } from '../db.js'

export type StoreProductDto = {
  id: string
  slug: string
  name: string
  sku: string
  vendor: string
  category: string
  price: number | null
  originalPrice?: number
  wholesalePrice?: number
  featured: boolean
  featuredSort: number
  trending: boolean
  trendingSort: number
  rating: number
  reviewCount: number
  origin: string
  moq: number
  description: string
  imageUrl?: string
  visible: boolean
  availability: string
}

const PRODUCT_SELECT = `
  SELECT p.id, p.code, p.sku, p.slug, p.name, p.description, p.origin,
         p.moq, p.rating, p.review_count, p.featured, p.featured_sort,
         p.trending, p.trending_sort, p.visible,
         p.availability, p.image_url,
         b.name AS brand_name, b.sku AS brand_sku,
         c.slug AS category_slug, c.name AS category_name,
         (
           SELECT pr.amount FROM product_prices pr
           JOIN product_packagings pk ON pk.id = pr.packaging_id
           WHERE pr.product_id = p.id AND pr.is_active AND pr.price_kind = 'list'
           ORDER BY pk.is_default DESC, pr.min_qty ASC
           LIMIT 1
         ) AS list_price,
         (
           SELECT pr.compare_at_amount FROM product_prices pr
           JOIN product_packagings pk ON pk.id = pr.packaging_id
           WHERE pr.product_id = p.id AND pr.is_active AND pr.price_kind = 'list'
           ORDER BY pk.is_default DESC, pr.min_qty ASC
           LIMIT 1
         ) AS compare_at,
         (
           SELECT pr.amount FROM product_prices pr
           WHERE pr.product_id = p.id AND pr.is_active AND pr.price_kind = 'wholesale'
           ORDER BY pr.min_qty ASC
           LIMIT 1
         ) AS wholesale_price
  FROM products p
  LEFT JOIN brands b ON b.id = p.brand_id
  LEFT JOIN categories c ON c.id = p.category_id
`

export function mapStoreProduct(r: Record<string, unknown>): StoreProductDto {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    sku: String(r.sku),
    vendor: String(r.brand_name || r.brand_sku || 'Rosver'),
    category: String(r.category_slug || 'general'),
    price:
      r.availability === 'quote_only' || r.list_price == null
        ? null
        : Number(r.list_price),
    originalPrice: r.compare_at != null ? Number(r.compare_at) : undefined,
    wholesalePrice: r.wholesale_price != null ? Number(r.wholesale_price) : undefined,
    featured: Boolean(r.featured),
    featuredSort: Number(r.featured_sort ?? 0),
    trending: Boolean(r.trending),
    trendingSort: Number(r.trending_sort ?? 0),
    rating: Number(r.rating),
    reviewCount: Number(r.review_count),
    origin: String(r.origin ?? ''),
    moq: Number(r.moq),
    description: String(r.description ?? ''),
    imageUrl: r.image_url ? String(r.image_url) : undefined,
    visible: Boolean(r.visible),
    availability: String(r.availability),
  }
}

export async function queryStoreProducts(limit = 1000): Promise<StoreProductDto[]> {
  const { rows } = await pool.query(
    `${PRODUCT_SELECT}
     WHERE p.visible = true
     ORDER BY p.featured DESC, p.featured_sort ASC, p.name
     LIMIT $1`,
    [limit],
  )
  return rows.map((r) => mapStoreProduct(r as Record<string, unknown>))
}

export async function queryFeaturedProducts(limit = 12): Promise<StoreProductDto[]> {
  const { rows } = await pool.query(
    `${PRODUCT_SELECT}
     WHERE p.visible = true AND p.featured = true
     ORDER BY p.featured_sort ASC, p.updated_at DESC
     LIMIT $1`,
    [limit],
  )
  return rows.map((r) => mapStoreProduct(r as Record<string, unknown>))
}

/**
 * Tendencia por categoría (slug) o todas.
 * Prioridad: productos con trending=true; si ninguno, top por rating.
 */
export async function queryTrendingProducts(opts?: {
  categorySlug?: string | null
  limit?: number
}): Promise<StoreProductDto[]> {
  const limit = opts?.limit ?? 12
  const slug = opts?.categorySlug?.trim() || null

  const categoryFilter = slug
    ? `AND c.slug = $2`
    : ''

  const params: unknown[] = [limit]
  if (slug) params.push(slug)

  const marked = await pool.query(
    `${PRODUCT_SELECT}
     WHERE p.visible = true AND p.trending = true
     ${categoryFilter}
     ORDER BY p.trending_sort ASC, p.rating DESC, p.review_count DESC, p.updated_at DESC
     LIMIT $1`,
    params,
  )
  if (marked.rows.length > 0) {
    return marked.rows.map((r) => mapStoreProduct(r as Record<string, unknown>))
  }

  const fallback = await pool.query(
    `${PRODUCT_SELECT}
     WHERE p.visible = true
     ${categoryFilter}
     ORDER BY (p.rating * LN(p.review_count + 1)) DESC, p.updated_at DESC
     LIMIT $1`,
    params,
  )
  return fallback.rows.map((r) => mapStoreProduct(r as Record<string, unknown>))
}

export async function queryTrendingTabs(): Promise<
  { slug: string; name: string; sortOrder: number }[]
> {
  const { rows } = await pool.query(
    `SELECT c.slug, c.name, c.sort_order
     FROM categories c
     WHERE c.visible = true
       AND c.parent_id IS NULL
       AND EXISTS (
         SELECT 1 FROM products p
         WHERE p.category_id = c.id AND p.visible = true
       )
     ORDER BY c.sort_order, c.name`,
  )
  return rows.map((r) => ({
    slug: String(r.slug),
    name: String(r.name),
    sortOrder: Number(r.sort_order ?? 0),
  }))
}
