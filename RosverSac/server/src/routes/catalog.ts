import { Hono } from 'hono'
import { z } from 'zod'
import { pool } from '../db.js'
import { featuredCache, redisStatus, trendingCache } from '../lib/redis.js'
import {
  queryFeaturedProducts,
  queryOfferProducts,
  queryRankingProducts,
  queryStoreProducts,
  queryTrendingProducts,
  queryTrendingTabs,
} from '../lib/catalog-products.js'
import { queryOfferCombos, toPublicCombo } from '../lib/offer-combos.js'
import { generateCatalogPdfBuffer } from '../lib/catalog-pdf-render.js'
import {
  findProductIdBySlug,
  getMyProductRatingDetail,
  submitProductRating,
  updateProductRatingComment,
} from '../lib/product-ratings.js'
import { recordProductViewBySlug } from '../lib/product-analytics.js'
import { resolveSessionUser } from '../lib/session.js'

/**
 * Catálogo público.
 * - Categorías / marcas desde DB siempre que existan.
 * - Productos live si hay filas.
 * - Destacados: Postgres + caché Redis (TTL 90s).
 */
export const catalogRoutes = new Hono()

function parseHighlightPoints(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      .slice(0, 3)
  }
  if (typeof raw === 'string') {
    try {
      return parseHighlightPoints(JSON.parse(raw))
    } catch {
      return []
    }
  }
  return []
}

async function loadFeaturedCached() {
  const cached = await featuredCache.get<{
    updatedAt: string
    products: unknown[]
    source: string
  }>()
  if (cached?.products) {
    return { ...cached, cache: 'hit' as const }
  }
  const products = await queryFeaturedProducts(12)
  const payload = {
    updatedAt: new Date().toISOString(),
    products,
    source: 'postgres',
  }
  await featuredCache.set(payload)
  return { ...payload, cache: 'miss' as const }
}

catalogRoutes.get('/featured', async (c) => {
  try {
    const data = await loadFeaturedCached()
    return c.json({
      ok: true,
      ...data,
      redis: redisStatus(),
    })
  } catch (err) {
    console.error('catalog featured', err)
    return c.json({
      ok: true,
      products: [],
      updatedAt: new Date().toISOString(),
      cache: 'error',
      message: 'Destacados no disponibles',
    })
  }
})

async function loadTrendingCached(categorySlug?: string | null) {
  const cached = await trendingCache.get<{
    updatedAt: string
    category: string | null
    products: unknown[]
    tabs: unknown[]
    source: string
  }>(categorySlug)
  if (cached?.products) {
    return { ...cached, cache: 'hit' as const }
  }
  const [products, tabs] = await Promise.all([
    queryTrendingProducts({ categorySlug, limit: 12 }),
    queryTrendingTabs(),
  ])
  const payload = {
    updatedAt: new Date().toISOString(),
    category: categorySlug || null,
    products,
    tabs,
    source: 'postgres',
  }
  await trendingCache.set(categorySlug, payload)
  return { ...payload, cache: 'miss' as const }
}

catalogRoutes.get('/trending', async (c) => {
  try {
    const category = c.req.query('category') || null
    const data = await loadTrendingCached(category)
    return c.json({
      ok: true,
      ...data,
      redis: redisStatus(),
    })
  } catch (err) {
    console.error('catalog trending', err)
    return c.json({
      ok: true,
      products: [],
      tabs: [],
      category: null,
      updatedAt: new Date().toISOString(),
      cache: 'error',
      message: 'Tendencia no disponible',
    })
  }
})

catalogRoutes.get('/offers', async (c) => {
  try {
    const [combos, products] = await Promise.all([
      queryOfferCombos({ visibleOnly: true, limit: 200 }),
      queryOfferProducts(200),
    ])
    return c.json({
      ok: true,
      live: true,
      updatedAt: new Date().toISOString(),
      combos: combos.map(toPublicCombo),
      products,
      count: combos.length + products.length,
    })
  } catch (err) {
    console.error('catalog offers', err)
    return c.json({
      ok: true,
      live: false,
      combos: [],
      products: [],
      count: 0,
      updatedAt: new Date().toISOString(),
      message: 'Ofertas no disponibles',
    })
  }
})

catalogRoutes.get('/', async (c) => {
  try {
    const brands = await pool.query(
      `SELECT id, code, sku, name, slug, logo_url, visible, show_on_home, sort_order
       FROM brands WHERE visible = true ORDER BY sort_order, name`,
    )
    const categories = await pool.query(
      `SELECT id, parent_id, code, sku, name, slug, icon_key, image_url,
              visible, sort_order, show_in_nav, show_on_home, tagline, highlight_points
       FROM categories WHERE visible = true ORDER BY sort_order, name`,
    )

    const mappedProducts = await queryStoreProducts(1000)
    const offerProducts = await queryOfferProducts(200)
    const offerCombos = await queryOfferCombos({ visibleOnly: true, limit: 200 })
    const featuredBundle = await loadFeaturedCached()
    const trendingBundle = await loadTrendingCached(null)

    const mappedCategories = categories.rows.map((r) => ({
      id: r.id,
      parentId: r.parent_id,
      slug: r.slug,
      name: r.name,
      imageUrl: r.image_url,
      visible: r.visible,
      sortOrder: r.sort_order,
      showInNav: r.show_in_nav,
      showOnHome: Boolean(r.show_on_home),
      tagline: r.tagline ?? undefined,
      points: parseHighlightPoints(r.highlight_points),
    }))

    const mappedBrands = brands.rows.map(mapBrand)
    const liveProducts = mappedProducts.length > 0
    const liveTaxonomy = mappedCategories.length > 0 || mappedBrands.length > 0

    return c.json({
      ok: true,
      live: liveProducts || liveTaxonomy,
      liveProducts,
      liveCategories: mappedCategories.length > 0,
      liveBrands: mappedBrands.length > 0,
      updatedAt: new Date().toISOString(),
      brands: mappedBrands,
      categories: mappedCategories,
      products: mappedProducts,
      offers: offerProducts,
      offerCombos: offerCombos.map(toPublicCombo),
      featured: featuredBundle.products,
      featuredMeta: {
        cache: featuredBundle.cache,
        updatedAt: featuredBundle.updatedAt,
        redis: redisStatus(),
      },
      trending: trendingBundle.products,
      trendingTabs: trendingBundle.tabs,
      trendingMeta: {
        cache: trendingBundle.cache,
        updatedAt: trendingBundle.updatedAt,
        redis: redisStatus(),
      },
      message: liveProducts
        ? undefined
        : liveTaxonomy
          ? 'Categorías/marcas desde DB; productos aún mock en cliente si vacío.'
          : 'Sin datos en DB; cliente usa mocks.',
    })
  } catch (err) {
    console.error('catalog GET', err)
    return c.json({
      ok: true,
      live: false,
      liveProducts: false,
      liveCategories: false,
      liveBrands: false,
      updatedAt: new Date().toISOString(),
      products: [],
      offers: [],
      featured: [],
      trending: [],
      trendingTabs: [],
      categories: [],
      brands: [],
      message: 'Catálogo DB no disponible; cliente usa mocks.',
    })
  }
})

/** Catálogo PDF A4 (HTML + Puppeteer) + carátula general. */
catalogRoutes.get('/pdf', async (c) => {
  try {
    const bytes = await generateCatalogPdfBuffer()
    const year = new Date().getFullYear()
    return new Response(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Catalogo-Rosver-${year}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('catalog PDF', err)
    const message =
      err instanceof Error ? err.message : 'No se pudo generar el catálogo PDF.'
    return c.json({ error: message }, 500)
  }
})

/** Ranking: productos mejor calificados. */
catalogRoutes.get('/ranking', async (c) => {
  const limit = Math.min(
    60,
    Math.max(1, Number(c.req.query('limit') || 24) || 24),
  )
  try {
    const products = await queryRankingProducts(limit)
    return c.json({
      ok: true,
      products,
      count: products.length,
      updatedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('catalog ranking', err)
    return c.json({ ok: true, products: [], count: 0 })
  }
})

/** Contabiliza una vista de ficha de producto. */
catalogRoutes.post('/products/:slug/view', async (c) => {
  const slug = c.req.param('slug')
  try {
    const user = await resolveSessionUser(c)
    const result = await recordProductViewBySlug(slug, user?.id)
    if (!result.ok) return c.json({ error: 'Producto no encontrado' }, 404)
    return c.json({ ok: true, viewCount: result.viewCount })
  } catch (err) {
    console.error('catalog view', err)
    return c.json({ error: 'No se pudo registrar la vista.' }, 500)
  }
})

const rateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  guestKey: z.string().trim().min(8).max(80).optional().nullable(),
  title: z.string().max(120).optional().nullable(),
  body: z.string().max(2000).optional().nullable(),
})

const rateCommentSchema = z.object({
  guestKey: z.string().trim().min(8).max(80).optional().nullable(),
  title: z.string().max(120).optional().nullable(),
  body: z.string().max(2000).optional().nullable(),
})

/** Mi calificación de un producto (sesión o guestKey). */
catalogRoutes.get('/products/:slug/rating', async (c) => {
  const slug = c.req.param('slug')
  const guestKey = c.req.query('guestKey')?.trim() || null
  const productId = await findProductIdBySlug(slug)
  if (!productId) return c.json({ error: 'Producto no encontrado' }, 404)
  const user = await resolveSessionUser(c)
  const mine = await getMyProductRatingDetail({
    productId,
    userId: user?.id,
    guestKey,
  })
  const { rows } = await pool.query<{
    rating: string
    review_count: number
  }>(`SELECT rating::text, review_count FROM products WHERE id = $1`, [
    productId,
  ])
  return c.json({
    ok: true,
    myRating: mine?.rating ?? null,
    myTitle: mine?.title ?? '',
    myBody: mine?.body ?? '',
    rating: rows[0] ? Number(rows[0].rating) : 0,
    reviewCount: rows[0] ? Number(rows[0].review_count) : 0,
    canRate: mine == null,
  })
})

/** Calificar producto (1 vez: logueado o invitado con guestKey). */
catalogRoutes.post('/products/:slug/rating', async (c) => {
  const slug = c.req.param('slug')
  const body = rateSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: 'Elige de 1 a 5 estrellas.' }, 400)
  }
  const productId = await findProductIdBySlug(slug)
  if (!productId) return c.json({ error: 'Producto no encontrado' }, 404)

  const user = await resolveSessionUser(c)
  const guestKey = body.data.guestKey?.trim() || null
  if (!user?.id && !guestKey) {
    return c.json(
      { error: 'Falta identificador de invitado para calificar.' },
      400,
    )
  }

  const result = await submitProductRating({
    productId,
    rating: body.data.rating,
    userId: user?.id,
    guestKey,
    title: body.data.title,
    body: body.data.body,
  })
  if (!result.ok) {
    if (result.code === 'already') {
      return c.json(
        { error: 'Ya calificaste este producto. Solo se permite una vez.' },
        409,
      )
    }
    return c.json({ error: 'Calificación inválida.' }, 400)
  }

  const { rows } = await pool.query<{
    rating: string
    review_count: number
  }>(`SELECT rating::text, review_count FROM products WHERE id = $1`, [
    productId,
  ])
  return c.json({
    ok: true,
    myRating: body.data.rating,
    rating: rows[0] ? Number(rows[0].rating) : body.data.rating,
    reviewCount: rows[0] ? Number(rows[0].review_count) : 1,
    canRate: false,
  })
})

/** Actualizar comentario de reseña propia (estrellas no cambian). */
catalogRoutes.patch('/products/:slug/rating', async (c) => {
  const slug = c.req.param('slug')
  const body = rateCommentSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: 'Datos de comentario inválidos.' }, 400)
  }
  const productId = await findProductIdBySlug(slug)
  if (!productId) return c.json({ error: 'Producto no encontrado' }, 404)
  const user = await resolveSessionUser(c)
  const guestKey = body.data.guestKey?.trim() || null
  if (!user?.id && !guestKey) {
    return c.json({ error: 'Debes iniciar sesión o enviar guestKey.' }, 401)
  }
  const result = await updateProductRatingComment({
    productId,
    userId: user?.id,
    guestKey,
    title: body.data.title,
    body: body.data.body,
  })
  if (!result.ok) {
    if (result.code === 'missing') {
      return c.json({ error: 'Primero califica el producto con estrellas.' }, 404)
    }
    return c.json({ error: 'No se pudo guardar el comentario.' }, 400)
  }
  return c.json({ ok: true })
})

function mapBrand(r: Record<string, unknown>) {
  return {
    id: r.id,
    code: r.code,
    sku: r.sku,
    name: r.name,
    slug: r.slug,
    logoUrl: r.logo_url,
    visible: r.visible,
    showOnHome: r.show_on_home ?? true,
    sortOrder: r.sort_order,
  }
}

/**
 * GET /api/catalog/promos
 * Lista pública de promos BOGO activas (por product_id o slug de producto).
 * El front puede usarla para mostrar badges "2x1" en el catálogo.
 */
catalogRoutes.get('/promos', async (c) => {
  // Obtener todos los product_ids con promo vigente
  const now = new Date().toISOString()
  const { rows } = await pool.query<{
    id: string
    product_id: string
    packaging_id: string | null
    kind: string
    buy_qty: number
    pay_qty: number
    valid_from: string | null
    valid_to: string | null
    product_slug: string
    product_name: string
  }>(
    `SELECT pp.id, pp.product_id, pp.packaging_id, pp.kind,
            pp.buy_qty, pp.pay_qty, pp.valid_from, pp.valid_to,
            p.slug AS product_slug, p.name AS product_name
     FROM product_promos pp
     JOIN products p ON p.id = pp.product_id
     WHERE pp.active = true
       AND (pp.valid_from IS NULL OR pp.valid_from <= $1)
       AND (pp.valid_to IS NULL OR pp.valid_to >= $1)
       AND p.visible = true
     ORDER BY pp.created_at DESC`,
    [now],
  )
  return c.json({
    items: rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      productSlug: r.product_slug,
      productName: r.product_name,
      packagingId: r.packaging_id,
      kind: r.kind,
      buyQty: Number(r.buy_qty),
      payQty: Number(r.pay_qty),
      label: `${r.buy_qty}x${r.pay_qty}`,
      validFrom: r.valid_from,
      validTo: r.valid_to,
    })),
  })
})
