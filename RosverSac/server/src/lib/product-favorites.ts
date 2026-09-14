import { pool } from '../db.js'
import { findProductIdBySlug } from './product-ratings.js'

export type FavoriteProduct = {
  id: string
  slug: string
  name: string
  sku: string
  imageUrl?: string
  rating: number
  price: number | null
  favoritedAt: string
}

function mapFavoriteRow(r: Record<string, unknown>): FavoriteProduct {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    sku: String(r.sku),
    imageUrl: r.image_url ? String(r.image_url) : undefined,
    rating: Number(r.rating ?? 0),
    price: r.list_price != null ? Number(r.list_price) : null,
    favoritedAt: String(r.favorited_at),
  }
}

const FAVORITE_SELECT = `
  SELECT p.id, p.slug, p.name, p.sku, p.image_url, p.rating,
         pf.created_at AS favorited_at,
         (
           SELECT pr.amount FROM product_prices pr
           JOIN product_packagings pk ON pk.id = pr.packaging_id
           WHERE pr.product_id = p.id AND pr.is_active AND pr.price_kind = 'list'
           ORDER BY pk.is_default DESC, pr.min_qty ASC
           LIMIT 1
         ) AS list_price
  FROM product_favorites pf
  JOIN products p ON p.id = pf.product_id
  WHERE pf.user_id = $1 AND p.visible = true
`

export async function listFavoriteIds(userId: string): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT product_id FROM product_favorites WHERE user_id = $1`,
    [userId],
  )
  return rows.map((r) => String(r.product_id))
}

/** IDs + slugs para que el front marque el corazón aunque el card use slug. */
export async function listFavoriteKeys(
  userId: string,
): Promise<{ ids: string[]; slugs: string[] }> {
  const { rows } = await pool.query(
    `SELECT pf.product_id, p.slug
     FROM product_favorites pf
     JOIN products p ON p.id = pf.product_id
     WHERE pf.user_id = $1 AND p.visible = true`,
    [userId],
  )
  return {
    ids: rows.map((r) => String(r.product_id)),
    slugs: rows.map((r) => String(r.slug)),
  }
}

export async function listFavorites(
  userId: string,
  limit = 100,
): Promise<FavoriteProduct[]> {
  const { rows } = await pool.query(
    `${FAVORITE_SELECT}
     ORDER BY pf.created_at DESC
     LIMIT $2`,
    [userId, limit],
  )
  return rows.map((r) => mapFavoriteRow(r as Record<string, unknown>))
}

export async function isFavorite(
  userId: string,
  productId: string,
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM product_favorites WHERE user_id = $1 AND product_id = $2`,
    [userId, productId],
  )
  return (rowCount ?? 0) > 0
}

export async function addFavorite(
  userId: string,
  productId: string,
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `INSERT INTO product_favorites (user_id, product_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [userId, productId],
  )
  return (rowCount ?? 0) > 0
}

export async function removeFavorite(
  userId: string,
  productId: string,
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM product_favorites WHERE user_id = $1 AND product_id = $2`,
    [userId, productId],
  )
  return (rowCount ?? 0) > 0
}

/** Resuelve productId desde UUID o slug. */
export async function resolveFavoriteProductId(input: {
  productId?: string
  slug?: string
}): Promise<string | null> {
  const id = input.productId?.trim()
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    const { rows } = await pool.query(
      `SELECT id FROM products WHERE id = $1::uuid AND visible = true LIMIT 1`,
      [id],
    )
    if (rows[0]) return String(rows[0].id)
  }
  const slug = input.slug?.trim()
  if (slug) {
    return findProductIdBySlug(slug)
  }
  return null
}

export async function countFavorites(userId: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM product_favorites WHERE user_id = $1`,
    [userId],
  )
  return Number(rows[0]?.n ?? 0)
}
