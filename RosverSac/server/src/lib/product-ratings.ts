import { pool } from '../db.js'
import { invalidateCatalogHomeCaches } from './redis.js'

/** Recalcula rating y review_count desnormalizados desde reseñas visibles. */
export async function recalculateProductRating(productId: string) {
  await pool.query(
    `UPDATE products SET
       rating = COALESCE((
         SELECT ROUND(AVG(rating)::numeric, 2)
         FROM product_reviews
         WHERE product_id = $1 AND visible = true
       ), 0),
       review_count = (
         SELECT COUNT(*)::int
         FROM product_reviews
         WHERE product_id = $1 AND visible = true
       ),
       updated_at = now()
     WHERE id = $1`,
    [productId],
  )
  await invalidateCatalogHomeCaches()
}

export async function findProductIdBySlug(slug: string): Promise<string | null> {
  const { rows } = await pool.query<{ id: string }>(
    `SELECT id FROM products WHERE slug = $1 AND visible = true LIMIT 1`,
    [slug],
  )
  return rows[0]?.id ?? null
}

/** Sanitiza texto eliminando etiquetas HTML y bytes nulos. */
function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')   // strip HTML tags
    .replace(/\0/g, '')        // strip null bytes
    .trim()
}

export async function getMyProductRating(opts: {
  productId: string
  userId?: string | null
  guestKey?: string | null
}): Promise<number | null> {
  if (opts.userId) {
    const { rows } = await pool.query<{ rating: number }>(
      `SELECT rating FROM product_reviews
       WHERE product_id = $1 AND user_id = $2
       LIMIT 1`,
      [opts.productId, opts.userId],
    )
    if (rows[0]) return Number(rows[0].rating)
  }
  const guest = opts.guestKey?.trim()
  if (guest) {
    const { rows } = await pool.query<{ rating: number }>(
      `SELECT rating FROM product_reviews
       WHERE product_id = $1 AND guest_key = $2
       LIMIT 1`,
      [opts.productId, guest],
    )
    if (rows[0]) return Number(rows[0].rating)
  }
  return null
}

export type MyRatingFull = {
  rating: number
  title: string
  body: string
}

/**
 * Devuelve la reseña completa del usuario/invitado, con rating + comment.
 * @alias getMyProductRatingDetail
 */
export async function getMyProductRatingFull(opts: {
  productId: string
  userId?: string | null
  guestKey?: string | null
}): Promise<MyRatingFull | null> {
  if (opts.userId) {
    const { rows } = await pool.query<{ rating: number; title: string; body: string }>(
      `SELECT rating, title, body FROM product_reviews
       WHERE product_id = $1 AND user_id = $2
       LIMIT 1`,
      [opts.productId, opts.userId],
    )
    if (rows[0]) return { rating: Number(rows[0].rating), title: rows[0].title, body: rows[0].body }
  }
  const guest = opts.guestKey?.trim()
  if (guest) {
    const { rows } = await pool.query<{ rating: number; title: string; body: string }>(
      `SELECT rating, title, body FROM product_reviews
       WHERE product_id = $1 AND guest_key = $2
       LIMIT 1`,
      [opts.productId, guest],
    )
    if (rows[0]) return { rating: Number(rows[0].rating), title: rows[0].title, body: rows[0].body }
  }
  return null
}

/**
 * Crea calificación 1 vez. Si ya existe → error 'already'.
 * Acepta title y body opcionales (sanitizados).
 */
export async function submitProductRating(opts: {
  productId: string
  rating: number
  title?: string | null
  body?: string | null
  userId?: string | null
  guestKey?: string | null
}): Promise<{ ok: true } | { ok: false; code: 'already' | 'invalid' }> {
  const rating = Math.floor(opts.rating)
  if (rating < 1 || rating > 5) return { ok: false, code: 'invalid' }

  const userId = opts.userId || null
  const guestKey = userId ? null : opts.guestKey?.trim() || null
  if (!userId && !guestKey) return { ok: false, code: 'invalid' }

  const title = sanitizeText(opts.title?.slice(0, 120) ?? '')
  const body = sanitizeText(opts.body?.slice(0, 2000) ?? '')

  const existing = await getMyProductRating({
    productId: opts.productId,
    userId,
    guestKey,
  })
  if (existing != null) return { ok: false, code: 'already' }

  try {
    await pool.query(
      `INSERT INTO product_reviews (product_id, user_id, guest_key, rating, title, body, visible)
       VALUES ($1, $2, $3, $4, $5, $6, true)`,
      [opts.productId, userId, guestKey, rating, title, body],
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/unique|duplicate/i.test(msg)) return { ok: false, code: 'already' }
    throw e
  }

  await recalculateProductRating(opts.productId)
  return { ok: true }
}

/**
 * Actualiza solo el comentario (title y/o body) de una reseña existente.
 * No cambia las estrellas — el primer voto las fija.
 * Devuelve 'not_found' si el usuario/invitado no tiene reseña.
 */
export async function updateProductRatingComment(opts: {
  productId: string
  title?: string | null
  body?: string | null
  userId?: string | null
  guestKey?: string | null
}): Promise<{ ok: true } | { ok: false; code: 'not_found' | 'missing' | 'invalid' }> {
  const userId = opts.userId || null
  const guestKey = userId ? null : opts.guestKey?.trim() || null
  if (!userId && !guestKey) return { ok: false, code: 'invalid' }

  const title = sanitizeText(opts.title?.slice(0, 120) ?? '')
  const body = sanitizeText(opts.body?.slice(0, 2000) ?? '')

  let result
  if (userId) {
    result = await pool.query(
      `UPDATE product_reviews
       SET title = $3, body = $4, updated_at = now()
       WHERE product_id = $1 AND user_id = $2`,
      [opts.productId, userId, title, body],
    )
  } else {
    result = await pool.query(
      `UPDATE product_reviews
       SET title = $3, body = $4, updated_at = now()
       WHERE product_id = $1 AND guest_key = $2`,
      [opts.productId, guestKey, title, body],
    )
  }

  if (result.rowCount === 0) return { ok: false, code: 'missing' }
  return { ok: true }
}

export type UserReviewRow = {
  id: string
  productId: string
  productName: string
  productSlug: string
  imageUrl: string | null
  rating: number
  title: string
  body: string
  createdAt: string
  updatedAt: string
}

/** Alias para catalog.ts — devuelve reseña completa (rating + title + body). */
export const getMyProductRatingDetail = getMyProductRatingFull

/** Lista todas las reseñas de un usuario autenticado, con nombre y slug del producto. */
export async function getUserReviews(userId: string): Promise<UserReviewRow[]> {
  const { rows } = await pool.query<{
    id: string
    product_id: string
    product_name: string
    product_slug: string
    image_url: string | null
    rating: number
    title: string
    body: string
    created_at: Date
    updated_at: Date
  }>(
    `SELECT
       pr.id,
       pr.product_id,
       p.name AS product_name,
       p.slug AS product_slug,
       p.image_url,
       pr.rating,
       pr.title,
       pr.body,
       pr.created_at,
       pr.updated_at
     FROM product_reviews pr
     JOIN products p ON p.id = pr.product_id
     WHERE pr.user_id = $1
     ORDER BY pr.created_at DESC`,
    [userId],
  )
  return rows.map((r) => ({
    id: r.id,
    productId: r.product_id,
    productName: r.product_name,
    productSlug: r.product_slug,
    imageUrl: r.image_url ?? null,
    rating: Number(r.rating),
    title: r.title,
    body: r.body,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  }))
}

/** Alias para profile.ts — lista reseñas del usuario autenticado. */
export const listUserReviews = getUserReviews
