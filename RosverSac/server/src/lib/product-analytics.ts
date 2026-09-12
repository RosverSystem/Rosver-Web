import { pool } from '../db.js'
import { invalidateCatalogHomeCaches } from './redis.js'

export type MetricKind = 'views' | 'orders' | 'quotes'

type LineLike = {
  productSlug?: string
  productName?: string
  quantity?: number
  lineKind?: string
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

/** No bloquear la tienda si Redis Railway va lento. */
function softInvalidateCaches() {
  void Promise.race([
    invalidateCatalogHomeCaches(),
    new Promise<void>((resolve) => setTimeout(resolve, 800)),
  ]).catch(() => {})
}

async function bumpDaily(
  productId: string,
  kind: MetricKind,
  amount: number,
  day = todayUtc(),
) {
  if (amount <= 0) return
  const col =
    kind === 'views' ? 'views' : kind === 'orders' ? 'orders' : 'quotes'
  await pool.query(
    `INSERT INTO product_metrics_daily (day, product_id, ${col})
     VALUES ($1::date, $2, $3)
     ON CONFLICT (day, product_id) DO UPDATE SET
       ${col} = product_metrics_daily.${col} + EXCLUDED.${col}`,
    [day, productId, amount],
  )
}

async function findProductIdForLine(opts: {
  slug?: string | null
  name?: string | null
}): Promise<string | null> {
  const slug = opts.slug?.trim() || ''
  const name = opts.name?.trim() || ''
  if (slug) {
    const bySlug = await pool.query<{ id: string }>(
      `SELECT id FROM products WHERE slug = $1 LIMIT 1`,
      [slug],
    )
    if (bySlug.rows[0]) return bySlug.rows[0].id
    const byPrefix = await pool.query<{ id: string }>(
      `SELECT id FROM products WHERE slug ILIKE $1 LIMIT 1`,
      [`${slug}%`],
    )
    if (byPrefix.rows[0]) return byPrefix.rows[0].id
  }
  if (name) {
    const byName = await pool.query<{ id: string }>(
      `SELECT id FROM products WHERE lower(name) = lower($1) LIMIT 1`,
      [name],
    )
    if (byName.rows[0]) return byName.rows[0].id
    const byLike = await pool.query<{ id: string }>(
      `SELECT id FROM products WHERE name ILIKE $1 LIMIT 1`,
      [`%${name}%`],
    )
    if (byLike.rows[0]) return byLike.rows[0].id
  }
  return null
}

/** Vista de ficha (global + por usuario si hay sesión). */
export async function recordProductViewBySlug(
  slug: string,
  userId?: string | null,
): Promise<{
  ok: boolean
  viewCount?: number
}> {
  const { rows } = await pool.query<{ id: string; view_count: number }>(
    `UPDATE products
     SET view_count = view_count + 1, updated_at = now()
     WHERE slug = $1 AND visible = true
     RETURNING id, view_count`,
    [slug],
  )
  const row = rows[0]
  if (!row) return { ok: false }
  await bumpDaily(row.id, 'views', 1)

  if (userId) {
    await pool.query(
      `INSERT INTO user_product_views (user_id, product_id, view_count, first_viewed_at, last_viewed_at)
       VALUES ($1, $2, 1, now(), now())
       ON CONFLICT (user_id, product_id) DO UPDATE SET
         view_count = user_product_views.view_count + 1,
         last_viewed_at = now()`,
      [userId, row.id],
    )
  }

  softInvalidateCaches()
  return { ok: true, viewCount: Number(row.view_count) }
}

/**
 * Suma cantidades pedidas/cotizadas por slug/nombre (ignora combos).
 */
export async function bumpDemandFromLines(
  kind: 'orders' | 'quotes',
  items: LineLike[],
) {
  const byProduct = new Map<string, number>()
  for (const it of items) {
    if (it.lineKind === 'combo') continue
    const qty = Math.max(0, Math.floor(Number(it.quantity) || 0))
    if (qty <= 0) continue
    const id = await findProductIdForLine({
      slug: it.productSlug,
      name: it.productName,
    })
    if (!id) continue
    byProduct.set(id, (byProduct.get(id) ?? 0) + qty)
  }
  if (byProduct.size === 0) return

  const col = kind === 'orders' ? 'order_count' : 'quote_count'
  for (const [productId, qty] of byProduct) {
    await pool.query(
      `UPDATE products SET ${col} = ${col} + $2, updated_at = now() WHERE id = $1`,
      [productId, qty],
    )
    await bumpDaily(productId, kind, qty)
  }
  softInvalidateCaches()
}

/** Rellena serie diaria de pedidos/cotizaciones desde historial. */
export async function backfillDailyDemandFromHistory() {
  await pool.query(
    `UPDATE product_metrics_daily SET orders = 0, quotes = 0`,
  )

  await pool.query(`
    WITH lines AS (
      SELECT
        (o.created_at AT TIME ZONE 'UTC')::date AS day,
        NULLIF(TRIM(item->>'productSlug'), '') AS slug,
        NULLIF(TRIM(item->>'productName'), '') AS pname,
        GREATEST(1, COALESCE((item->>'quantity')::int, 1)) AS qty
      FROM order_requests o
      CROSS JOIN LATERAL jsonb_array_elements(o.items) AS item
      WHERE COALESCE(item->>'lineKind', 'product') <> 'combo'
    ),
    matched AS (
      SELECT l.day, p.id AS product_id, SUM(l.qty)::int AS qty
      FROM lines l
      JOIN products p ON (
        (l.slug IS NOT NULL AND p.slug = l.slug)
        OR (l.slug IS NOT NULL AND p.slug ILIKE l.slug || '%')
        OR (l.pname IS NOT NULL AND lower(p.name) = lower(l.pname))
        OR (l.pname IS NOT NULL AND p.name ILIKE '%' || l.pname || '%')
      )
      GROUP BY l.day, p.id
    )
    INSERT INTO product_metrics_daily (day, product_id, orders)
    SELECT day, product_id, qty FROM matched
    ON CONFLICT (day, product_id) DO UPDATE SET
      orders = EXCLUDED.orders
  `)

  await pool.query(`
    WITH lines AS (
      SELECT
        (q.created_at AT TIME ZONE 'UTC')::date AS day,
        NULLIF(TRIM(item->>'productSlug'), '') AS slug,
        NULLIF(TRIM(item->>'productName'), '') AS pname,
        GREATEST(1, COALESCE((item->>'quantity')::int, 1)) AS qty
      FROM quote_requests q
      CROSS JOIN LATERAL jsonb_array_elements(q.items) AS item
      WHERE COALESCE(item->>'lineKind', 'product') <> 'combo'
    ),
    matched AS (
      SELECT l.day, p.id AS product_id, SUM(l.qty)::int AS qty
      FROM lines l
      JOIN products p ON (
        (l.slug IS NOT NULL AND p.slug = l.slug)
        OR (l.slug IS NOT NULL AND p.slug ILIKE l.slug || '%')
        OR (l.pname IS NOT NULL AND lower(p.name) = lower(l.pname))
        OR (l.pname IS NOT NULL AND p.name ILIKE '%' || l.pname || '%')
      )
      GROUP BY l.day, p.id
    )
    INSERT INTO product_metrics_daily (day, product_id, quotes)
    SELECT day, product_id, qty FROM matched
    ON CONFLICT (day, product_id) DO UPDATE SET
      quotes = EXCLUDED.quotes
  `)
}

/** Recalcula order_count / quote_count desde pedidos y cotizaciones existentes. */
export async function rebuildDemandCountsFromHistory() {
  await pool.query(`UPDATE products SET order_count = 0, quote_count = 0`)

  await pool.query(`
    WITH lines AS (
      SELECT
        NULLIF(TRIM(item->>'productSlug'), '') AS slug,
        NULLIF(TRIM(item->>'productName'), '') AS pname,
        GREATEST(1, COALESCE((item->>'quantity')::int, 1)) AS qty
      FROM order_requests o
      CROSS JOIN LATERAL jsonb_array_elements(o.items) AS item
      WHERE COALESCE(item->>'lineKind', 'product') <> 'combo'
    ),
    matched AS (
      SELECT p.id, SUM(l.qty)::int AS total
      FROM lines l
      JOIN products p ON (
        (l.slug IS NOT NULL AND p.slug = l.slug)
        OR (l.slug IS NOT NULL AND p.slug ILIKE l.slug || '%')
        OR (l.pname IS NOT NULL AND lower(p.name) = lower(l.pname))
        OR (l.pname IS NOT NULL AND p.name ILIKE '%' || l.pname || '%')
      )
      GROUP BY p.id
    )
    UPDATE products p
    SET order_count = m.total
    FROM matched m
    WHERE p.id = m.id
  `)

  await pool.query(`
    WITH lines AS (
      SELECT
        NULLIF(TRIM(item->>'productSlug'), '') AS slug,
        NULLIF(TRIM(item->>'productName'), '') AS pname,
        GREATEST(1, COALESCE((item->>'quantity')::int, 1)) AS qty
      FROM quote_requests q
      CROSS JOIN LATERAL jsonb_array_elements(q.items) AS item
      WHERE COALESCE(item->>'lineKind', 'product') <> 'combo'
    ),
    matched AS (
      SELECT p.id, SUM(l.qty)::int AS total
      FROM lines l
      JOIN products p ON (
        (l.slug IS NOT NULL AND p.slug = l.slug)
        OR (l.slug IS NOT NULL AND p.slug ILIKE l.slug || '%')
        OR (l.pname IS NOT NULL AND lower(p.name) = lower(l.pname))
        OR (l.pname IS NOT NULL AND p.name ILIKE '%' || l.pname || '%')
      )
      GROUP BY p.id
    )
    UPDATE products p
    SET quote_count = m.total
    FROM matched m
    WHERE p.id = m.id
  `)

  await backfillDailyDemandFromHistory()
  softInvalidateCaches()
}

let lastSyncAt = 0

/** Sincroniza demanda al abrir analítica (máx. 1 vez / 60s). */
export async function ensureAnalyticsSynced() {
  const now = Date.now()
  if (now - lastSyncAt < 60_000) return
  lastSyncAt = now
  try {
    await rebuildDemandCountsFromHistory()
  } catch (err) {
    console.error('ensureAnalyticsSynced', err)
  }
}

export type AnalyticsTopItem = {
  id: string
  slug: string
  name: string
  sku: string
  imageUrl?: string
  rating: number
  reviewCount: number
  viewCount: number
  orderCount: number
  quoteCount: number
  score: number
}

export type AnalyticsOverview = {
  ok: true
  updatedAt: string
  kpis: {
    products: number
    totalViews: number
    totalOrdersUnits: number
    totalQuotesUnits: number
    ratedProducts: number
    top1: AnalyticsTopItem | null
  }
  tops: {
    rated: AnalyticsTopItem[]
    viewed: AnalyticsTopItem[]
    ordered: AnalyticsTopItem[]
    quoted: AnalyticsTopItem[]
    trending: AnalyticsTopItem[]
  }
  series: {
    day: string
    views: number
    orders: number
    quotes: number
  }[]
  mix: {
    views: number
    orders: number
    quotes: number
    reviews: number
  }
}

function mapTop(r: Record<string, unknown>): AnalyticsTopItem {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    sku: String(r.sku),
    imageUrl: r.image_url ? String(r.image_url) : undefined,
    rating: Number(r.rating ?? 0),
    reviewCount: Number(r.review_count ?? 0),
    viewCount: Number(r.view_count ?? 0),
    orderCount: Number(r.order_count ?? 0),
    quoteCount: Number(r.quote_count ?? 0),
    score: Number(r.score ?? 0),
  }
}

/** Prioriza demanda real; rating pesa menos. */
const SCORE_SQL = `(
  LN(p.view_count + 1) * 3
  + LN(p.order_count + 1) * 4
  + LN(p.quote_count + 1) * 3.5
  + (p.rating * LN(p.review_count + 1)) * 0.6
)`

export async function getAnalyticsOverview(
  days = 14,
): Promise<AnalyticsOverview> {
  await ensureAnalyticsSynced()
  const range = Math.min(60, Math.max(7, days))

  const [kpis, rated, viewed, ordered, quoted, trending, series, mix] =
    await Promise.all([
      pool.query<{
        products: number
        total_views: string
        total_orders: string
        total_quotes: string
        rated_products: number
      }>(`
        SELECT
          COUNT(*)::int AS products,
          COALESCE(SUM(view_count), 0)::text AS total_views,
          COALESCE(SUM(order_count), 0)::text AS total_orders,
          COALESCE(SUM(quote_count), 0)::text AS total_quotes,
          COUNT(*) FILTER (WHERE review_count > 0)::int AS rated_products
        FROM products
        WHERE visible = true
      `),
      pool.query(`
        SELECT id, slug, name, sku, image_url, rating, review_count,
               view_count, order_count, quote_count,
               (rating * LN(review_count + 1)) AS score
        FROM products
        WHERE visible = true AND review_count > 0
        ORDER BY score DESC, rating DESC, review_count DESC
        LIMIT 8
      `),
      pool.query(`
        SELECT id, slug, name, sku, image_url, rating, review_count,
               view_count, order_count, quote_count,
               view_count::float AS score
        FROM products
        WHERE visible = true AND view_count > 0
        ORDER BY view_count DESC, updated_at DESC
        LIMIT 8
      `),
      pool.query(`
        SELECT id, slug, name, sku, image_url, rating, review_count,
               view_count, order_count, quote_count,
               order_count::float AS score
        FROM products
        WHERE visible = true AND order_count > 0
        ORDER BY order_count DESC, updated_at DESC
        LIMIT 8
      `),
      pool.query(`
        SELECT id, slug, name, sku, image_url, rating, review_count,
               view_count, order_count, quote_count,
               quote_count::float AS score
        FROM products
        WHERE visible = true AND quote_count > 0
        ORDER BY quote_count DESC, updated_at DESC
        LIMIT 8
      `),
      pool.query(`
        SELECT id, slug, name, sku, image_url, rating, review_count,
               view_count, order_count, quote_count,
               ${SCORE_SQL} AS score
        FROM products p
        WHERE p.visible = true
        ORDER BY
          ((p.view_count + p.order_count + p.quote_count) > 0) DESC,
          score DESC,
          p.updated_at DESC
        LIMIT 8
      `),
      pool.query<{
        day: string
        views: number
        orders: number
        quotes: number
      }>(
        `
        SELECT d::date::text AS day,
               COALESCE(SUM(m.views), 0)::int AS views,
               COALESCE(SUM(m.orders), 0)::int AS orders,
               COALESCE(SUM(m.quotes), 0)::int AS quotes
        FROM generate_series(
          (CURRENT_DATE - ($1::int - 1)),
          CURRENT_DATE,
          '1 day'::interval
        ) AS d
        LEFT JOIN product_metrics_daily m ON m.day = d::date
        GROUP BY d
        ORDER BY d
        `,
        [range],
      ),
      pool.query<{
        views: string
        orders: string
        quotes: string
        reviews: string
      }>(`
        SELECT
          COALESCE(SUM(view_count), 0)::text AS views,
          COALESCE(SUM(order_count), 0)::text AS orders,
          COALESCE(SUM(quote_count), 0)::text AS quotes,
          COALESCE(SUM(review_count), 0)::text AS reviews
        FROM products
        WHERE visible = true
      `),
    ])

  const trendingList = trending.rows.map((r) =>
    mapTop(r as Record<string, unknown>),
  )

  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    kpis: {
      products: Number(kpis.rows[0]?.products ?? 0),
      totalViews: Number(kpis.rows[0]?.total_views ?? 0),
      totalOrdersUnits: Number(kpis.rows[0]?.total_orders ?? 0),
      totalQuotesUnits: Number(kpis.rows[0]?.total_quotes ?? 0),
      ratedProducts: Number(kpis.rows[0]?.rated_products ?? 0),
      top1: trendingList[0] ?? null,
    },
    tops: {
      rated: rated.rows.map((r) => mapTop(r as Record<string, unknown>)),
      viewed: viewed.rows.map((r) => mapTop(r as Record<string, unknown>)),
      ordered: ordered.rows.map((r) => mapTop(r as Record<string, unknown>)),
      quoted: quoted.rows.map((r) => mapTop(r as Record<string, unknown>)),
      trending: trendingList,
    },
    series: series.rows.map((r) => ({
      day: String(r.day).slice(0, 10),
      views: Number(r.views),
      orders: Number(r.orders),
      quotes: Number(r.quotes),
    })),
    mix: {
      views: Number(mix.rows[0]?.views ?? 0),
      orders: Number(mix.rows[0]?.orders ?? 0),
      quotes: Number(mix.rows[0]?.quotes ?? 0),
      reviews: Number(mix.rows[0]?.reviews ?? 0),
    },
  }
}

/** Expuesto para SQL de tendencia en catalog-products. */
export const TREND_SCORE_SQL = SCORE_SQL
