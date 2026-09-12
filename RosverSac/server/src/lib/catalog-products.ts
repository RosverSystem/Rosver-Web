import { pool } from '../db.js'
import { TREND_SCORE_SQL } from './product-analytics.js'

export type StorePackagingDto = {
  id: string
  label: string
  contentQty: number
  isDefault: boolean
  unitName: string
  listPrice: number | null
  offerPrice: number | null
  wholesalePrice: number | null
  compareAt: number | null
}

export type StoreProductDto = {
  id: string
  /** Código interno del sistema (serial Postgres, numérico) */
  code: number
  /** Código interno en 8 dígitos (00000002) */
  codeLabel: string
  slug: string
  name: string
  sku: string
  vendor: string
  category: string
  price: number | null
  originalPrice?: number
  wholesalePrice?: number
  offerPrice?: number
  featured: boolean
  featuredSort: number
  trending: boolean
  trendingSort: number
  rating: number
  reviewCount: number
  viewCount: number
  orderCount: number
  quoteCount: number
  origin: string
  moq: number
  description: string
  imageUrl?: string
  visible: boolean
  availability: string
  packagings?: StorePackagingDto[]
  specs?: { key: string; name: string; value: string; unit?: string | null }[]
}

const PRODUCT_SELECT = `
  SELECT p.id, p.code, p.sku, p.slug, p.name, p.description, p.origin,
         p.moq, p.rating, p.review_count, p.featured, p.featured_sort,
         p.trending, p.trending_sort, p.visible,
         p.view_count, p.order_count, p.quote_count,
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
           JOIN product_packagings pk ON pk.id = pr.packaging_id
           WHERE pr.product_id = p.id AND pr.is_active AND pr.price_kind = 'offer'
             AND (pr.valid_from IS NULL OR pr.valid_from <= now())
             AND (pr.valid_to IS NULL OR pr.valid_to >= now())
           ORDER BY pk.is_default DESC, pr.min_qty ASC
           LIMIT 1
         ) AS offer_price,
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
  const listPrice = r.list_price != null ? Number(r.list_price) : null
  const offerPrice = r.offer_price != null ? Number(r.offer_price) : null
  const compareAt = r.compare_at != null ? Number(r.compare_at) : undefined
  const quoteOnly = r.availability === 'quote_only'

  let price: number | null = null
  let originalPrice: number | undefined

  if (!quoteOnly) {
    if (offerPrice != null) {
      price = offerPrice
      originalPrice = listPrice ?? compareAt
    } else if (listPrice != null) {
      price = listPrice
      originalPrice = compareAt
    }
  }

  const code = Number(r.code ?? 0)
  return {
    id: String(r.id),
    code,
    codeLabel: String(Math.max(0, Math.floor(code))).padStart(8, '0'),
    slug: String(r.slug),
    name: String(r.name),
    sku: String(r.sku),
    vendor: String(r.brand_name || r.brand_sku || 'Rosver'),
    category: String(r.category_slug || 'general'),
    price,
    originalPrice,
    wholesalePrice: r.wholesale_price != null ? Number(r.wholesale_price) : undefined,
    offerPrice: offerPrice ?? undefined,
    featured: Boolean(r.featured),
    featuredSort: Number(r.featured_sort ?? 0),
    trending: Boolean(r.trending),
    trendingSort: Number(r.trending_sort ?? 0),
    rating: Number(r.rating),
    reviewCount: Number(r.review_count),
    viewCount: Number(r.view_count ?? 0),
    orderCount: Number(r.order_count ?? 0),
    quoteCount: Number(r.quote_count ?? 0),
    origin: String(r.origin ?? ''),
    moq: Number(r.moq),
    description: String(r.description ?? ''),
    imageUrl: r.image_url ? String(r.image_url) : undefined,
    visible: Boolean(r.visible),
    availability: String(r.availability),
  }
}

async function attachPackagings(products: StoreProductDto[]): Promise<StoreProductDto[]> {
  if (products.length === 0) return products
  const ids = products.map((p) => p.id)
  const { rows } = await pool.query(
    `SELECT pk.id, pk.product_id, pk.content_qty, pk.label, pk.is_default,
            ut.name AS unit_name,
            (
              SELECT pr.amount FROM product_prices pr
              WHERE pr.packaging_id = pk.id AND pr.is_active AND pr.price_kind = 'list'
              ORDER BY pr.min_qty ASC LIMIT 1
            ) AS list_price,
            (
              SELECT pr.amount FROM product_prices pr
              WHERE pr.packaging_id = pk.id AND pr.is_active AND pr.price_kind = 'offer'
                AND (pr.valid_from IS NULL OR pr.valid_from <= now())
                AND (pr.valid_to IS NULL OR pr.valid_to >= now())
              ORDER BY pr.min_qty ASC LIMIT 1
            ) AS offer_price,
            (
              SELECT pr.amount FROM product_prices pr
              WHERE pr.packaging_id = pk.id AND pr.is_active AND pr.price_kind = 'wholesale'
              ORDER BY pr.min_qty ASC LIMIT 1
            ) AS wholesale_price,
            (
              SELECT pr.compare_at_amount FROM product_prices pr
              WHERE pr.packaging_id = pk.id AND pr.is_active AND pr.price_kind = 'list'
              ORDER BY pr.min_qty ASC LIMIT 1
            ) AS compare_at
     FROM product_packagings pk
     JOIN unit_types ut ON ut.id = pk.unit_type_id
     WHERE pk.product_id = ANY($1::uuid[])
     ORDER BY pk.is_default DESC, pk.content_qty ASC`,
    [ids],
  )

  const byProduct = new Map<string, StorePackagingDto[]>()
  for (const r of rows) {
    const pid = String(r.product_id)
    const list = byProduct.get(pid) ?? []
    const contentQty = Number(r.content_qty)
    const unitName = String(r.unit_name)
    const label =
      (r.label as string | null)?.trim() ||
      (contentQty === 1 ? unitName : `${unitName} × ${contentQty}`)
    list.push({
      id: String(r.id),
      label,
      contentQty,
      isDefault: Boolean(r.is_default),
      unitName,
      listPrice: r.list_price != null ? Number(r.list_price) : null,
      offerPrice: r.offer_price != null ? Number(r.offer_price) : null,
      wholesalePrice: r.wholesale_price != null ? Number(r.wholesale_price) : null,
      compareAt: r.compare_at != null ? Number(r.compare_at) : null,
    })
    byProduct.set(pid, list)
  }

  return products.map((p) => ({
    ...p,
    packagings: byProduct.get(p.id) ?? [],
  }))
}

async function attachSpecs(products: StoreProductDto[]): Promise<StoreProductDto[]> {
  if (products.length === 0) return products
  const ids = products.map((p) => p.id)
  const { rows } = await pool.query(
    `SELECT v.product_id, a.key, a.name, a.unit_hint,
            v.value_text, v.value_number, v.unit, v.sort_order
     FROM product_spec_values v
     JOIN spec_attributes a ON a.id = v.attribute_id
     WHERE v.product_id = ANY($1::uuid[])
       AND COALESCE(a.is_catalog, true) = true
     ORDER BY v.sort_order, a.sort_order, a.name`,
    [ids],
  )
  const byProduct = new Map<string, StoreProductDto['specs']>()
  for (const r of rows) {
    const pid = String(r.product_id)
    const list = byProduct.get(pid) ?? []
    const value =
      r.value_text?.trim() ||
      (r.value_number != null ? String(Number(r.value_number)) : '')
    if (!value) continue
    list.push({
      key: String(r.key),
      name: String(r.name),
      value,
      unit: (r.unit as string | null) || null,
    })
    byProduct.set(pid, list)
  }
  return products.map((p) => ({
    ...p,
    specs: byProduct.get(p.id) ?? [],
  }))
}

export async function enrichStoreProducts(
  products: StoreProductDto[],
): Promise<StoreProductDto[]> {
  const withPack = await attachPackagings(products)
  return attachSpecs(withPack)
}

export async function queryStoreProducts(limit = 1000): Promise<StoreProductDto[]> {
  const { rows } = await pool.query(
    `${PRODUCT_SELECT}
     WHERE p.visible = true
     ORDER BY p.featured DESC, p.featured_sort ASC, p.name
     LIMIT $1`,
    [limit],
  )
  return enrichStoreProducts(rows.map((r) => mapStoreProduct(r as Record<string, unknown>)))
}

export async function queryFeaturedProducts(limit = 12): Promise<StoreProductDto[]> {
  const { rows } = await pool.query(
    `${PRODUCT_SELECT}
     WHERE p.visible = true AND p.featured = true
     ORDER BY p.featured_sort ASC, p.updated_at DESC
     LIMIT $1`,
    [limit],
  )
  return enrichStoreProducts(rows.map((r) => mapStoreProduct(r as Record<string, unknown>)))
}

/**
 * Tendencia por categoría (slug) o todas.
 * Si el slug es raíz, incluye productos de subcategorías.
 */
export async function queryTrendingProducts(opts?: {
  categorySlug?: string | null
  limit?: number
}): Promise<StoreProductDto[]> {
  const limit = opts?.limit ?? 12
  const slug = opts?.categorySlug?.trim() || null

  const categoryFilter = slug
    ? `AND (
         c.slug = $2
         OR c.parent_id IN (SELECT id FROM categories WHERE slug = $2)
       )`
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
    return enrichStoreProducts(
      marked.rows.map((r) => mapStoreProduct(r as Record<string, unknown>)),
    )
  }

  const fallback = await pool.query(
    `${PRODUCT_SELECT}
     WHERE p.visible = true
     ${categoryFilter}
     ORDER BY
       ((p.view_count + p.order_count + p.quote_count) > 0) DESC,
       ${TREND_SCORE_SQL} DESC,
       p.updated_at DESC
     LIMIT $1`,
    params,
  )
  return enrichStoreProducts(
    fallback.rows.map((r) => mapStoreProduct(r as Record<string, unknown>)),
  )
}

/** Ranking: mejores calificados (score = rating × ln(reseñas+1)). */
export async function queryRankingProducts(limit = 24): Promise<StoreProductDto[]> {
  const { rows } = await pool.query(
    `${PRODUCT_SELECT}
     WHERE p.visible = true AND p.review_count > 0
     ORDER BY (p.rating * LN(p.review_count + 1)) DESC, p.rating DESC, p.review_count DESC
     LIMIT $1`,
    [Math.min(60, Math.max(1, limit))],
  )
  return enrichStoreProducts(rows.map((r) => mapStoreProduct(r as Record<string, unknown>)))
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
         LEFT JOIN categories pc ON pc.id = p.category_id
         WHERE p.visible = true
           AND (pc.id = c.id OR pc.parent_id = c.id)
       )
     ORDER BY c.sort_order, c.name`,
  )
  return rows.map((r) => ({
    slug: String(r.slug),
    name: String(r.name),
    sortOrder: Number(r.sort_order ?? 0),
  }))
}

/** Productos con precio offer activo o compare_at en lista. */
export async function queryOfferProducts(limit = 200): Promise<StoreProductDto[]> {
  const { rows } = await pool.query(
    `${PRODUCT_SELECT}
     WHERE p.visible = true
       AND (
         EXISTS (
           SELECT 1 FROM product_prices pr
           WHERE pr.product_id = p.id AND pr.is_active AND pr.price_kind = 'offer'
             AND (pr.valid_from IS NULL OR pr.valid_from <= now())
             AND (pr.valid_to IS NULL OR pr.valid_to >= now())
         )
         OR EXISTS (
           SELECT 1 FROM product_prices pr
           WHERE pr.product_id = p.id AND pr.is_active AND pr.price_kind = 'list'
             AND pr.compare_at_amount IS NOT NULL AND pr.compare_at_amount > pr.amount
         )
       )
     ORDER BY p.updated_at DESC
     LIMIT $1`,
    [limit],
  )
  return enrichStoreProducts(rows.map((r) => mapStoreProduct(r as Record<string, unknown>)))
}
