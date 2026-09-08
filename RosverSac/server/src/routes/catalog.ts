import { Hono } from 'hono'
import { pool } from '../db.js'
import { featuredCache, invalidateCatalogHomeCaches, redisStatus, trendingCache } from '../lib/redis.js'
import {
  queryFeaturedProducts,
  queryStoreProducts,
  queryTrendingProducts,
  queryTrendingTabs,
} from '../lib/catalog-products.js'

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

catalogRoutes.get('/', async (c) => {
  try {
    const brands = await pool.query(
      `SELECT id, code, sku, name, slug, logo_url, visible, sort_order
       FROM brands WHERE visible = true ORDER BY sort_order, name`,
    )
    const categories = await pool.query(
      `SELECT id, parent_id, code, sku, name, slug, icon_key, image_url,
              visible, sort_order, show_in_nav, show_on_home, tagline, highlight_points
       FROM categories WHERE visible = true ORDER BY sort_order, name`,
    )

    const mappedProducts = await queryStoreProducts(1000)
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
      featured: [],
      trending: [],
      trendingTabs: [],
      categories: [],
      brands: [],
      message: 'Catálogo DB no disponible; cliente usa mocks.',
    })
  }
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
    sortOrder: r.sort_order,
  }
}
