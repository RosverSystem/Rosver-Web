import { Hono } from 'hono'
import { pool } from '../db.js'

/**
 * Catálogo público.
 * - Categorías / marcas desde DB siempre que existan (menú, inicio, filtros).
 * - Productos: liveProducts si hay filas; si no, cliente puede usar mocks.
 */
export const catalogRoutes = new Hono()

function parseHighlightPoints(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, 3)
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
    const products = await pool.query(
      `SELECT p.id, p.code, p.sku, p.slug, p.name, p.description, p.origin,
              p.moq, p.rating, p.review_count, p.featured, p.visible,
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
       WHERE p.visible = true
       ORDER BY p.featured DESC, p.name
       LIMIT 1000`,
    )

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
    const mappedProducts = products.rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      sku: r.sku,
      vendor: r.brand_name || r.brand_sku || 'Rosver',
      category: r.category_slug || 'general',
      price:
        r.availability === 'quote_only' || r.list_price == null
          ? null
          : Number(r.list_price),
      originalPrice: r.compare_at != null ? Number(r.compare_at) : undefined,
      wholesalePrice: r.wholesale_price != null ? Number(r.wholesale_price) : undefined,
      featured: r.featured,
      rating: Number(r.rating),
      reviewCount: r.review_count,
      origin: r.origin,
      moq: Number(r.moq),
      description: r.description,
      imageUrl: r.image_url || undefined,
      visible: r.visible,
      availability: r.availability,
    }))

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
