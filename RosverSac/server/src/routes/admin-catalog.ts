import { Hono } from 'hono'
import { z } from 'zod'
import { pool } from '../db.js'
import { queryOfferProducts } from '../lib/catalog-products.js'
import { invalidateCatalogHomeCaches } from '../lib/redis.js'
import { recalculateProductRating } from '../lib/product-ratings.js'
import { isUploadFolder, uploadPublicImage } from '../lib/upload-image.js'
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from '../middleware/auth.js'

export const adminCatalogRoutes = new Hono<{ Variables: AuthVariables }>()

adminCatalogRoutes.use('*', requireAuth, requireRole('admin'))

/* ——— Upload R2 (categorías / marcas / productos) ——— */
adminCatalogRoutes.post('/uploads', async (c) => {
  const body = await c.req.parseBody()
  const file = body.file
  const folderRaw = typeof body.folder === 'string' ? body.folder : ''
  if (!(file instanceof File)) {
    return c.json({ error: 'Adjunta una imagen (campo file).' }, 400)
  }
  if (!isUploadFolder(folderRaw)) {
    return c.json(
      { error: 'Carpeta inválida. Usa categories, brands o products.' },
      400,
    )
  }
  const result = await uploadPublicImage({ file, folder: folderRaw })
  if (!result.ok) {
    return c.json({ error: result.error }, result.status)
  }
  return c.json({ ok: true, url: result.url, key: result.key })
})

function slugify(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

function mapBrand(row: Record<string, unknown>) {
  return {
    id: row.id,
    code: row.code,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    visible: row.visible,
    showOnHome: row.show_on_home ?? true,
    sortOrder: row.sort_order,
  }
}

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

function mapCategory(row: Record<string, unknown>) {
  return {
    id: row.id,
    parentId: row.parent_id,
    code: row.code,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    iconKey: row.icon_key,
    imageUrl: row.image_url,
    visible: row.visible,
    sortOrder: row.sort_order,
    showInNav: row.show_in_nav,
    showOnHome: row.show_on_home ?? false,
    tagline: row.tagline ?? null,
    highlightPoints: parseHighlightPoints(row.highlight_points),
  }
}

/* ——— Marcas ——— */
adminCatalogRoutes.get('/brands', async (c) => {
  const { rows } = await pool.query(`SELECT * FROM brands ORDER BY sort_order, name`)
  return c.json({ brands: rows.map(mapBrand) })
})

adminCatalogRoutes.post('/brands', async (c) => {
  const body = z
    .object({
      name: z.string().trim().min(2).max(120),
      sku: z.string().trim().min(1).max(40),
      slug: z.string().trim().min(1).max(80).optional(),
      logoUrl: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
      visible: z.boolean().optional(),
      showOnHome: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: body.error.issues[0]?.message ?? 'Datos inválidos' }, 400)
  }
  const slug = body.data.slug || slugify(body.data.name)
  try {
    const { rows } = await pool.query(
      `INSERT INTO brands (sku, name, slug, logo_url, visible, show_on_home, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        body.data.sku.toUpperCase(),
        body.data.name,
        slug,
        body.data.logoUrl || null,
        body.data.visible ?? true,
        body.data.showOnHome ?? true,
        body.data.sortOrder ?? 0,
      ],
    )
    return c.json({ brand: mapBrand(rows[0]) }, 201)
  } catch {
    return c.json({ error: 'SKU o slug de marca ya existe.' }, 409)
  }
})

adminCatalogRoutes.patch('/brands/:id', async (c) => {
  const id = c.req.param('id')
  const body = z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      sku: z.string().trim().min(1).max(40).optional(),
      slug: z.string().trim().min(1).max(80).optional(),
      logoUrl: z.string().trim().optional().nullable(),
      visible: z.boolean().optional(),
      showOnHome: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Datos inválidos' }, 400)
  const d = body.data
  const { rows } = await pool.query(
    `UPDATE brands SET
       name = COALESCE($2, name),
       sku = COALESCE($3, sku),
       slug = COALESCE($4, slug),
       logo_url = COALESCE($5, logo_url),
       visible = COALESCE($6, visible),
       show_on_home = COALESCE($7, show_on_home),
       sort_order = COALESCE($8, sort_order),
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      d.name ?? null,
      d.sku?.toUpperCase() ?? null,
      d.slug ?? null,
      d.logoUrl === undefined ? null : d.logoUrl,
      d.visible ?? null,
      d.showOnHome ?? null,
      d.sortOrder ?? null,
    ],
  )
  if (!rows[0]) return c.json({ error: 'Marca no encontrada' }, 404)
  return c.json({ brand: mapBrand(rows[0]) })
})

adminCatalogRoutes.delete('/brands/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const { rowCount } = await pool.query(`DELETE FROM brands WHERE id = $1`, [id])
    if (!rowCount) return c.json({ error: 'Marca no encontrada' }, 404)
    return c.json({ ok: true })
  } catch {
    const { rows } = await pool.query(
      `UPDATE brands SET visible = false, updated_at = now() WHERE id = $1 RETURNING id`,
      [id],
    )
    if (!rows[0]) return c.json({ error: 'Marca no encontrada' }, 404)
    return c.json({ ok: true, softDeleted: true })
  }
})

/* ——— Categorías ——— */
adminCatalogRoutes.get('/categories', async (c) => {
  const { rows } = await pool.query(
    `SELECT * FROM categories ORDER BY sort_order, name`,
  )
  return c.json({ categories: rows.map(mapCategory) })
})

adminCatalogRoutes.post('/categories', async (c) => {
  const body = z
    .object({
      name: z.string().trim().min(2).max(120),
      slug: z.string().trim().min(1).max(80).optional(),
      sku: z.string().trim().max(40).optional(),
      parentId: z.string().uuid().nullable().optional(),
      iconKey: z.string().trim().max(40).optional(),
      imageUrl: z.string().trim().optional(),
      visible: z.boolean().optional(),
      showInNav: z.boolean().optional(),
      showOnHome: z.boolean().optional(),
      tagline: z.string().trim().max(120).optional().nullable(),
      highlightPoints: z.array(z.string().trim().min(1).max(80)).max(3).optional(),
      sortOrder: z.number().int().optional(),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: body.error.issues[0]?.message ?? 'Datos inválidos' }, 400)
  }
  const d = body.data
  const isRoot = !d.parentId
  const showOnHome = isRoot ? (d.showOnHome ?? false) : false
  if (showOnHome) {
    if (!d.tagline?.trim()) {
      return c.json({ error: 'Para el inicio necesitas la etiqueta corta' }, 400)
    }
    if (!d.highlightPoints?.length) {
      return c.json({ error: 'Para el inicio agrega al menos un punto destacado' }, 400)
    }
    if (!d.imageUrl?.trim()) {
      return c.json({ error: 'Para el inicio necesitas la URL de la imagen' }, 400)
    }
  }
  const slug = d.slug || slugify(d.name)
  const points = JSON.stringify(d.highlightPoints ?? [])
  try {
    const { rows } = await pool.query(
      `INSERT INTO categories
         (parent_id, sku, name, slug, icon_key, image_url, visible, show_in_nav,
          show_on_home, tagline, highlight_points, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12)
       RETURNING *`,
      [
        d.parentId ?? null,
        d.sku || null,
        d.name,
        slug,
        d.iconKey || null,
        d.imageUrl || null,
        d.visible ?? true,
        d.showInNav ?? true,
        showOnHome,
        d.tagline?.trim() || null,
        points,
        d.sortOrder ?? 0,
      ],
    )
    return c.json({ category: mapCategory(rows[0]) }, 201)
  } catch {
    return c.json({ error: 'Slug o SKU de categoría ya existe.' }, 409)
  }
})

adminCatalogRoutes.patch('/categories/:id', async (c) => {
  const id = c.req.param('id')
  const body = z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      slug: z.string().trim().min(1).max(80).optional(),
      sku: z.string().trim().max(40).nullable().optional(),
      parentId: z.string().uuid().nullable().optional(),
      iconKey: z.string().trim().max(40).nullable().optional(),
      imageUrl: z.string().trim().nullable().optional(),
      visible: z.boolean().optional(),
      showInNav: z.boolean().optional(),
      showOnHome: z.boolean().optional(),
      tagline: z.string().trim().max(120).nullable().optional(),
      highlightPoints: z.array(z.string().trim().min(1).max(80)).max(3).optional(),
      sortOrder: z.number().int().optional(),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Datos inválidos' }, 400)
  const d = body.data

  const current = await pool.query(`SELECT * FROM categories WHERE id = $1`, [id])
  if (!current.rows[0]) return c.json({ error: 'Categoría no encontrada' }, 404)
  const cur = current.rows[0] as Record<string, unknown>
  const nextParent =
    d.parentId !== undefined ? d.parentId : (cur.parent_id as string | null)
  const isRoot = !nextParent
  const nextShowOnHome = isRoot
    ? (d.showOnHome !== undefined ? d.showOnHome : Boolean(cur.show_on_home))
    : false
  const nextTagline =
    d.tagline !== undefined ? d.tagline : (cur.tagline as string | null)
  const nextPoints =
    d.highlightPoints !== undefined
      ? d.highlightPoints
      : parseHighlightPoints(cur.highlight_points)
  const nextImage =
    d.imageUrl !== undefined ? d.imageUrl : (cur.image_url as string | null)

  if (nextShowOnHome) {
    if (!nextTagline?.trim()) {
      return c.json({ error: 'Para el inicio necesitas la etiqueta corta' }, 400)
    }
    if (!nextPoints.length) {
      return c.json({ error: 'Para el inicio agrega al menos un punto destacado' }, 400)
    }
    if (!nextImage?.trim()) {
      return c.json({ error: 'Para el inicio necesitas la URL de la imagen' }, 400)
    }
  }

  const { rows } = await pool.query(
    `UPDATE categories SET
       name = COALESCE($2, name),
       slug = COALESCE($3, slug),
       sku = COALESCE($4, sku),
       parent_id = CASE WHEN $5::boolean THEN $6::uuid ELSE parent_id END,
       icon_key = COALESCE($7, icon_key),
       image_url = CASE WHEN $8::boolean THEN $9 ELSE image_url END,
       visible = COALESCE($10, visible),
       show_in_nav = COALESCE($11, show_in_nav),
       show_on_home = $12,
       tagline = CASE WHEN $13::boolean THEN $14 ELSE tagline END,
       highlight_points = CASE WHEN $15::boolean THEN $16::jsonb ELSE highlight_points END,
       sort_order = COALESCE($17, sort_order),
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      d.name ?? null,
      d.slug ?? null,
      d.sku === undefined ? null : d.sku,
      d.parentId !== undefined,
      d.parentId ?? null,
      d.iconKey === undefined ? null : d.iconKey,
      d.imageUrl !== undefined,
      d.imageUrl ?? null,
      d.visible ?? null,
      d.showInNav ?? null,
      nextShowOnHome,
      d.tagline !== undefined,
      d.tagline ?? null,
      d.highlightPoints !== undefined,
      d.highlightPoints !== undefined ? JSON.stringify(d.highlightPoints) : null,
      d.sortOrder ?? null,
    ],
  )
  return c.json({ category: mapCategory(rows[0]) })
})

adminCatalogRoutes.delete('/categories/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const { rowCount } = await pool.query(`DELETE FROM categories WHERE id = $1`, [id])
    if (!rowCount) return c.json({ error: 'Categoría no encontrada' }, 404)
    return c.json({ ok: true })
  } catch {
    const { rows } = await pool.query(
      `UPDATE categories SET visible = false, show_in_nav = false, show_on_home = false, updated_at = now()
       WHERE id = $1 RETURNING id`,
      [id],
    )
    if (!rows[0]) return c.json({ error: 'Categoría no encontrada' }, 404)
    return c.json({ ok: true, softDeleted: true })
  }
})

/* ——— Tipos de unidad ——— */
adminCatalogRoutes.get('/unit-types', async (c) => {
  const { rows } = await pool.query(
    `SELECT id, code, name, is_base AS "isBase", sort_order AS "sortOrder"
     FROM unit_types ORDER BY sort_order, name`,
  )
  return c.json({ unitTypes: rows })
})

adminCatalogRoutes.post('/unit-types', async (c) => {
  const body = z
    .object({
      name: z.string().trim().min(1).max(60),
      code: z.string().trim().min(1).max(40).optional(),
      isBase: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Datos inválidos' }, 400)
  const code = body.data.code || slugify(body.data.name)
  try {
    const { rows } = await pool.query(
      `INSERT INTO unit_types (code, name, is_base, sort_order)
       VALUES ($1,$2,$3,$4)
       RETURNING id, code, name, is_base AS "isBase", sort_order AS "sortOrder"`,
      [code, body.data.name, body.data.isBase ?? false, body.data.sortOrder ?? 99],
    )
    return c.json({ unitType: rows[0] }, 201)
  } catch {
    return c.json({ error: 'Código de unidad ya existe.' }, 409)
  }
})

adminCatalogRoutes.patch('/unit-types/:id', async (c) => {
  const id = c.req.param('id')
  const body = z
    .object({
      name: z.string().trim().min(1).max(60).optional(),
      code: z.string().trim().min(1).max(40).optional(),
      isBase: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Datos inválidos' }, 400)
  const d = body.data
  try {
    const { rows } = await pool.query(
      `UPDATE unit_types SET
         name = COALESCE($2, name),
         code = COALESCE($3, code),
         is_base = COALESCE($4, is_base),
         sort_order = COALESCE($5, sort_order)
       WHERE id = $1
       RETURNING id, code, name, is_base AS "isBase", sort_order AS "sortOrder"`,
      [id, d.name ?? null, d.code ?? null, d.isBase ?? null, d.sortOrder ?? null],
    )
    if (!rows[0]) return c.json({ error: 'Unidad no encontrada' }, 404)
    return c.json({ unitType: rows[0] })
  } catch {
    return c.json({ error: 'Código de unidad ya existe.' }, 409)
  }
})

adminCatalogRoutes.delete('/unit-types/:id', async (c) => {
  const id = c.req.param('id')
  const used = await pool.query(
    `SELECT 1 FROM product_packagings WHERE unit_type_id = $1 LIMIT 1`,
    [id],
  )
  if (used.rows[0]) {
    return c.json(
      { error: 'Esta unidad está en uso en presentaciones. No se puede eliminar.' },
      409,
    )
  }
  const { rowCount } = await pool.query(`DELETE FROM unit_types WHERE id = $1`, [id])
  if (!rowCount) return c.json({ error: 'Unidad no encontrada' }, 404)
  return c.json({ ok: true })
})

/* ——— Ofertas (precios price_kind=offer o compare_at) ——— */
adminCatalogRoutes.get('/offers', async (c) => {
  const products = await queryOfferProducts(300)
  return c.json({
    products,
    count: products.length,
  })
})

/** Alta rápida de oferta: producto existente o nuevo + precios lista/oferta. */
adminCatalogRoutes.post('/offers', async (c) => {
  const body = z
    .object({
      productId: z.string().uuid().optional(),
      name: z.string().trim().min(2).max(200).optional(),
      sku: z.string().trim().min(1).max(60).optional(),
      brandId: z.string().uuid().nullable().optional(),
      categoryId: z.string().uuid().nullable().optional(),
      description: z.string().optional(),
      imageUrl: z.string().optional().nullable(),
      listPrice: z.number().positive(),
      offerPrice: z.number().positive(),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: body.error.issues[0]?.message ?? 'Datos inválidos' }, 400)
  }
  const d = body.data
  if (d.offerPrice >= d.listPrice) {
    return c.json({ error: 'El precio oferta debe ser menor que el precio normal' }, 400)
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    let productId = d.productId

    if (!productId) {
      if (!d.name?.trim() || !d.sku?.trim()) {
        await client.query('ROLLBACK')
        return c.json({ error: 'Nombre y código son obligatorios para un producto nuevo' }, 400)
      }
      const slug = slugify(d.name)
      const inserted = await client.query(
        `INSERT INTO products
           (sku, slug, name, brand_id, category_id, description, image_url, availability, visible)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'in_stock',true)
         RETURNING id`,
        [
          d.sku.toUpperCase(),
          slug,
          d.name.trim(),
          d.brandId ?? null,
          d.categoryId ?? null,
          d.description ?? '',
          d.imageUrl ?? null,
        ],
      )
      productId = inserted.rows[0].id as string
      const unit = await client.query(
        `SELECT id FROM unit_types WHERE is_base = true ORDER BY sort_order LIMIT 1`,
      )
      if (unit.rows[0]) {
        await client.query(
          `INSERT INTO product_packagings (product_id, unit_type_id, content_qty, label, is_default)
           VALUES ($1,$2,1,'Unidad',true)
           ON CONFLICT (product_id, unit_type_id, content_qty) DO NOTHING`,
          [productId, unit.rows[0].id],
        )
      }
    }

    const pack = await client.query(
      `SELECT id FROM product_packagings
       WHERE product_id = $1
       ORDER BY is_default DESC, content_qty ASC
       LIMIT 1`,
      [productId],
    )
    let packagingId = pack.rows[0]?.id as string | undefined
    if (!packagingId) {
      const unit = await client.query(
        `SELECT id FROM unit_types WHERE is_base = true ORDER BY sort_order LIMIT 1`,
      )
      if (!unit.rows[0]) {
        await client.query('ROLLBACK')
        return c.json({ error: 'No hay tipos de unidad. Crea uno en Unidades.' }, 400)
      }
      const created = await client.query(
        `INSERT INTO product_packagings (product_id, unit_type_id, content_qty, label, is_default)
         VALUES ($1,$2,1,'Unidad',true)
         RETURNING id`,
        [productId, unit.rows[0].id],
      )
      packagingId = created.rows[0].id as string
    }

    await client.query(
      `UPDATE product_prices SET is_active = false, updated_at = now()
       WHERE product_id = $1 AND packaging_id = $2
         AND price_kind IN ('list','offer') AND is_active = true`,
      [productId, packagingId],
    )

    await client.query(
      `INSERT INTO product_prices
         (product_id, packaging_id, price_kind, min_qty, amount, compare_at_amount, is_active)
       VALUES ($1,$2,'list',1,$3,$3,true)`,
      [productId, packagingId, d.listPrice],
    )
    await client.query(
      `INSERT INTO product_prices
         (product_id, packaging_id, price_kind, min_qty, amount, compare_at_amount, is_active)
       VALUES ($1,$2,'offer',1,$3,$4,true)`,
      [productId, packagingId, d.offerPrice, d.listPrice],
    )

    if (d.imageUrl !== undefined && d.productId) {
      await client.query(
        `UPDATE products SET image_url = COALESCE($2, image_url), updated_at = now() WHERE id = $1`,
        [productId, d.imageUrl],
      )
    }

    await client.query('COMMIT')
    await invalidateCatalogHomeCaches()
    const products = await queryOfferProducts(300)
    const created = products.find((p) => p.id === productId)
    return c.json({ ok: true, product: created ?? { id: productId }, count: products.length }, 201)
  } catch (e) {
    await client.query('ROLLBACK')
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return c.json({ error: 'Ese código de producto ya existe.' }, 409)
    }
    console.error('admin offers POST', e)
    return c.json({ error: 'No se pudo guardar la oferta' }, 500)
  } finally {
    client.release()
  }
})

adminCatalogRoutes.delete('/offers/:productId', async (c) => {
  const productId = c.req.param('productId')
  const { rowCount } = await pool.query(
    `UPDATE product_prices SET is_active = false, updated_at = now()
     WHERE product_id = $1 AND price_kind = 'offer' AND is_active = true`,
    [productId],
  )
  if (!rowCount) {
    return c.json({ error: 'No hay oferta activa en ese producto' }, 404)
  }
  await invalidateCatalogHomeCaches()
  return c.json({ ok: true })
})

/* ——— Specs ——— */
adminCatalogRoutes.get('/spec-attributes', async (c) => {
  const { rows } = await pool.query(
    `SELECT id, key, name, value_type AS "valueType", unit_hint AS "unitHint",
            sort_order AS "sortOrder"
     FROM spec_attributes ORDER BY sort_order, name`,
  )
  return c.json({ attributes: rows })
})

adminCatalogRoutes.put('/products/:id/specs', async (c) => {
  const productId = c.req.param('id')
  const body = z
    .object({
      specs: z.array(
        z.object({
          attributeId: z.string().uuid(),
          valueText: z.string().optional(),
          valueNumber: z.number().nullable().optional(),
          unit: z.string().optional(),
        }),
      ),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Datos inválidos' }, 400)

  const exists = await pool.query(`SELECT id FROM products WHERE id = $1`, [productId])
  if (!exists.rows[0]) return c.json({ error: 'Producto no encontrado' }, 404)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`DELETE FROM product_spec_values WHERE product_id = $1`, [
      productId,
    ])
    for (const s of body.data.specs) {
      const text = s.valueText?.trim() || null
      const num = s.valueNumber ?? null
      if (!text && num == null) continue
      await client.query(
        `INSERT INTO product_spec_values (product_id, attribute_id, value_text, value_number, unit)
         VALUES ($1,$2,$3,$4,$5)`,
        [productId, s.attributeId, text, num, s.unit ?? null],
      )
    }
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
  await invalidateCatalogHomeCaches()
  return c.json({ ok: true })
})

/* ——— Productos ——— */
adminCatalogRoutes.get('/products', async (c) => {
  const { rows } = await pool.query(
    `SELECT p.*,
            b.name AS brand_name, b.sku AS brand_sku,
            c.name AS category_name, c.slug AS category_slug
     FROM products p
     LEFT JOIN brands b ON b.id = p.brand_id
     LEFT JOIN categories c ON c.id = p.category_id
     ORDER BY p.updated_at DESC
     LIMIT 500`,
  )
  return c.json({
    products: rows.map((r) => ({
      id: r.id,
      code: r.code,
      sku: r.sku,
      slug: r.slug,
      name: r.name,
      brandId: r.brand_id,
      brandName: r.brand_name,
      categoryId: r.category_id,
      categoryName: r.category_name,
      categorySlug: r.category_slug,
      description: r.description,
      origin: r.origin,
      moq: Number(r.moq),
      rating: Number(r.rating),
      reviewCount: r.review_count,
      featured: r.featured,
      featuredSort: Number(r.featured_sort ?? 0),
      trending: Boolean(r.trending),
      trendingSort: Number(r.trending_sort ?? 0),
      visible: r.visible,
      availability: r.availability,
      imageUrl: r.image_url,
    })),
  })
})

adminCatalogRoutes.get('/products/:id', async (c) => {
  const id = c.req.param('id')
  const { rows } = await pool.query(`SELECT * FROM products WHERE id = $1`, [id])
  if (!rows[0]) return c.json({ error: 'Producto no encontrado' }, 404)
  const p = rows[0]
  const packagings = await pool.query(
    `SELECT pp.*, ut.name AS unit_name, ut.code AS unit_code
     FROM product_packagings pp
     JOIN unit_types ut ON ut.id = pp.unit_type_id
     WHERE pp.product_id = $1
     ORDER BY pp.is_default DESC, ut.sort_order, pp.content_qty`,
    [id],
  )
  const prices = await pool.query(
    `SELECT * FROM product_prices
     WHERE product_id = $1
     ORDER BY is_active DESC, price_kind, min_qty, created_at DESC`,
    [id],
  )
  const specs = await pool.query(
    `SELECT v.*, a.key, a.name AS attr_name, a.value_type, a.unit_hint
     FROM product_spec_values v
     JOIN spec_attributes a ON a.id = v.attribute_id
     WHERE v.product_id = $1
     ORDER BY v.sort_order, a.sort_order`,
    [id],
  )
  return c.json({
    product: {
      id: p.id,
      code: p.code,
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      brandId: p.brand_id,
      categoryId: p.category_id,
      description: p.description,
      origin: p.origin,
      moq: Number(p.moq),
      rating: Number(p.rating),
      reviewCount: p.review_count,
      featured: p.featured,
      featuredSort: Number(p.featured_sort ?? 0),
      trending: Boolean(p.trending),
      trendingSort: Number(p.trending_sort ?? 0),
      visible: p.visible,
      availability: p.availability,
      imageUrl: p.image_url,
    },
    packagings: packagings.rows.map((r) => ({
      id: r.id,
      unitTypeId: r.unit_type_id,
      unitName: r.unit_name,
      unitCode: r.unit_code,
      contentQty: Number(r.content_qty),
      label: r.label,
      barcode: r.barcode,
      isDefault: r.is_default,
    })),
    prices: prices.rows.map((r) => ({
      id: r.id,
      packagingId: r.packaging_id,
      priceKind: r.price_kind,
      minQty: Number(r.min_qty),
      maxQty: r.max_qty != null ? Number(r.max_qty) : null,
      amount: Number(r.amount),
      compareAtAmount: r.compare_at_amount != null ? Number(r.compare_at_amount) : null,
      currency: r.currency,
      isActive: r.is_active,
      replacesPriceId: r.replaces_price_id,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
    specs: specs.rows.map((r) => ({
      id: r.id,
      attributeId: r.attribute_id,
      key: r.key,
      name: r.attr_name,
      valueType: r.value_type,
      unitHint: r.unit_hint,
      valueText: r.value_text,
      valueNumber: r.value_number != null ? Number(r.value_number) : null,
      unit: r.unit,
    })),
  })
})

adminCatalogRoutes.post('/products', async (c) => {
  const body = z
    .object({
      name: z.string().trim().min(2).max(200),
      sku: z.string().trim().min(1).max(60),
      slug: z.string().trim().min(1).max(120).optional(),
      brandId: z.string().uuid().nullable().optional(),
      categoryId: z.string().uuid().nullable().optional(),
      description: z.string().optional(),
      origin: z.string().optional(),
      moq: z.number().positive().optional(),
      availability: z.enum(['in_stock', 'quote_only', 'out_of_stock']).optional(),
      featured: z.boolean().optional(),
      featuredSort: z.number().int().min(0).max(9999).optional(),
      visible: z.boolean().optional(),
      imageUrl: z.string().optional(),
      rating: z.number().min(0).max(5).optional(),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: body.error.issues[0]?.message ?? 'Datos inválidos' }, 400)
  }
  const slug = body.data.slug || slugify(body.data.name)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      `INSERT INTO products
         (sku, slug, name, brand_id, category_id, description, origin, moq,
          availability, featured, featured_sort, visible, image_url, rating)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        body.data.sku.toUpperCase(),
        slug,
        body.data.name,
        body.data.brandId ?? null,
        body.data.categoryId ?? null,
        body.data.description ?? '',
        body.data.origin ?? '',
        body.data.moq ?? 1,
        body.data.availability ?? 'in_stock',
        body.data.featured ?? false,
        body.data.featuredSort ?? 0,
        body.data.visible ?? true,
        body.data.imageUrl ?? null,
        body.data.rating ?? 0,
      ],
    )
    const productId = rows[0].id as string
    const unit = await client.query(
      `SELECT id FROM unit_types WHERE is_base = true ORDER BY sort_order LIMIT 1`,
    )
    const unitId = unit.rows[0]?.id
    if (unitId) {
      await client.query(
        `INSERT INTO product_packagings (product_id, unit_type_id, content_qty, label, is_default)
         VALUES ($1,$2,1,'Unidad',true)`,
        [productId, unitId],
      )
    }
    await client.query('COMMIT')
    await invalidateCatalogHomeCaches()
    return c.json({ product: { id: productId, sku: rows[0].sku, slug: rows[0].slug } }, 201)
  } catch (e) {
    await client.query('ROLLBACK')
    return c.json({ error: 'SKU o slug de producto ya existe.' }, 409)
  } finally {
    client.release()
  }
})

adminCatalogRoutes.patch('/products/:id', async (c) => {
  const id = c.req.param('id')
  const body = z
    .object({
      name: z.string().trim().min(2).max(200).optional(),
      sku: z.string().trim().min(1).max(60).optional(),
      slug: z.string().trim().min(1).max(120).optional(),
      brandId: z.string().uuid().nullable().optional(),
      categoryId: z.string().uuid().nullable().optional(),
      description: z.string().optional(),
      origin: z.string().optional(),
      moq: z.number().positive().optional(),
      availability: z.enum(['in_stock', 'quote_only', 'out_of_stock']).optional(),
      featured: z.boolean().optional(),
      featuredSort: z.number().int().min(0).max(9999).optional(),
      trending: z.boolean().optional(),
      trendingSort: z.number().int().min(0).max(9999).optional(),
      visible: z.boolean().optional(),
      imageUrl: z.string().nullable().optional(),
      rating: z.number().min(0).max(5).optional(),
      reviewCount: z.number().int().min(0).optional(),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Datos inválidos' }, 400)
  const d = body.data
  const { rows } = await pool.query(
    `UPDATE products SET
       name = COALESCE($2, name),
       sku = COALESCE($3, sku),
       slug = COALESCE($4, slug),
       brand_id = CASE WHEN $5::boolean THEN $6::uuid ELSE brand_id END,
       category_id = CASE WHEN $7::boolean THEN $8::uuid ELSE category_id END,
       description = COALESCE($9, description),
       origin = COALESCE($10, origin),
       moq = COALESCE($11, moq),
       availability = COALESCE($12, availability),
       featured = COALESCE($13, featured),
       featured_sort = COALESCE($14, featured_sort),
       trending = COALESCE($15, trending),
       trending_sort = COALESCE($16, trending_sort),
       visible = COALESCE($17, visible),
       image_url = CASE WHEN $18::boolean THEN $19 ELSE image_url END,
       rating = COALESCE($20, rating),
       review_count = COALESCE($21, review_count),
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      d.name ?? null,
      d.sku?.toUpperCase() ?? null,
      d.slug ?? null,
      d.brandId !== undefined,
      d.brandId ?? null,
      d.categoryId !== undefined,
      d.categoryId ?? null,
      d.description ?? null,
      d.origin ?? null,
      d.moq ?? null,
      d.availability ?? null,
      d.featured ?? null,
      d.featuredSort ?? null,
      d.trending ?? null,
      d.trendingSort ?? null,
      d.visible ?? null,
      d.imageUrl !== undefined,
      d.imageUrl ?? null,
      d.rating ?? null,
      d.reviewCount ?? null,
    ],
  )
  if (!rows[0]) return c.json({ error: 'Producto no encontrado' }, 404)
  await invalidateCatalogHomeCaches()
  return c.json({
    product: {
      id: rows[0].id,
      featured: rows[0].featured,
      featuredSort: rows[0].featured_sort,
      trending: rows[0].trending,
      trendingSort: rows[0].trending_sort,
      rating: Number(rows[0].rating),
      reviewCount: rows[0].review_count,
      visible: rows[0].visible,
      name: rows[0].name,
      sku: rows[0].sku,
    },
  })
})

adminCatalogRoutes.delete('/products/:id', async (c) => {
  const id = c.req.param('id')
  const { rows } = await pool.query(
    `UPDATE products SET visible = false, featured = false, trending = false, updated_at = now()
     WHERE id = $1 RETURNING id`,
    [id],
  )
  if (!rows[0]) return c.json({ error: 'Producto no encontrado' }, 404)
  await invalidateCatalogHomeCaches()
  return c.json({ ok: true, softDeleted: true })
})

/* ——— Empaques ——— */
adminCatalogRoutes.post('/products/:id/packagings', async (c) => {
  const productId = c.req.param('id')
  const body = z
    .object({
      unitTypeId: z.string().uuid(),
      contentQty: z.number().positive(),
      label: z.string().trim().max(120).optional(),
      barcode: z.string().trim().max(80).optional(),
      isDefault: z.boolean().optional(),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Datos inválidos' }, 400)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (body.data.isDefault) {
      await client.query(
        `UPDATE product_packagings SET is_default = false WHERE product_id = $1`,
        [productId],
      )
    }
    const label =
      body.data.label ||
      (
        await client.query(`SELECT name FROM unit_types WHERE id = $1`, [
          body.data.unitTypeId,
        ])
      ).rows[0]?.name + ` ×${body.data.contentQty}`

    const { rows } = await client.query(
      `INSERT INTO product_packagings
         (product_id, unit_type_id, content_qty, label, barcode, is_default)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        productId,
        body.data.unitTypeId,
        body.data.contentQty,
        label,
        body.data.barcode || null,
        body.data.isDefault ?? false,
      ],
    )
    await client.query('COMMIT')
    await invalidateCatalogHomeCaches()
    return c.json({
      packaging: {
        id: rows[0].id,
        unitTypeId: rows[0].unit_type_id,
        contentQty: Number(rows[0].content_qty),
        label: rows[0].label,
        isDefault: rows[0].is_default,
      },
    }, 201)
  } catch {
    await client.query('ROLLBACK')
    return c.json({ error: 'Ese empaque (unidad + cantidad) ya existe.' }, 409)
  } finally {
    client.release()
  }
})

/**
 * Guardar precio:
 * - sin id / saveAsNew → INSERT (nuevo listado)
 * - con id y saveAsNew=false → UPDATE
 * - con id y saveAsNew=true → INSERT y desactiva el anterior
 */
adminCatalogRoutes.post('/products/:id/prices', async (c) => {
  const productId = c.req.param('id')
  const body = z
    .object({
      id: z.string().uuid().optional(),
      packagingId: z.string().uuid(),
      priceKind: z.enum(['list', 'wholesale', 'offer', 'custom']).default('list'),
      minQty: z.number().positive().default(1),
      maxQty: z.number().positive().nullable().optional(),
      amount: z.number().min(0),
      compareAtAmount: z.number().min(0).nullable().optional(),
      currency: z.string().default('PEN'),
      notes: z.string().max(300).optional(),
      saveAsNew: z.boolean().default(false),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: body.error.issues[0]?.message ?? 'Datos inválidos' }, 400)
  }
  const d = body.data
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    if (d.id && !d.saveAsNew) {
      const { rows } = await client.query(
        `UPDATE product_prices SET
           packaging_id = $2,
           price_kind = $3,
           min_qty = $4,
           max_qty = $5,
           amount = $6,
           compare_at_amount = $7,
           currency = $8,
           notes = $9,
           updated_at = now()
         WHERE id = $1 AND product_id = $10
         RETURNING *`,
        [
          d.id,
          d.packagingId,
          d.priceKind,
          d.minQty,
          d.maxQty ?? null,
          d.amount,
          d.compareAtAmount ?? null,
          d.currency,
          d.notes ?? null,
          productId,
        ],
      )
      if (!rows[0]) {
        await client.query('ROLLBACK')
        return c.json({ error: 'Precio no encontrado' }, 404)
      }
      await client.query('COMMIT')
      await invalidateCatalogHomeCaches()
      return c.json({ price: mapPrice(rows[0]), mode: 'updated' })
    }

    if (d.id && d.saveAsNew) {
      await client.query(
        `UPDATE product_prices SET is_active = false, updated_at = now()
         WHERE id = $1 AND product_id = $2`,
        [d.id, productId],
      )
    }

    const { rows } = await client.query(
      `INSERT INTO product_prices
         (product_id, packaging_id, price_kind, min_qty, max_qty, amount,
          compare_at_amount, currency, is_active, replaces_price_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,$10)
       RETURNING *`,
      [
        productId,
        d.packagingId,
        d.priceKind,
        d.minQty,
        d.maxQty ?? null,
        d.amount,
        d.compareAtAmount ?? null,
        d.currency,
        d.id ?? null,
        d.notes ?? null,
      ],
    )
    await client.query('COMMIT')
    await invalidateCatalogHomeCaches()
    return c.json({ price: mapPrice(rows[0]), mode: 'created' }, 201)
  } catch (e) {
    await client.query('ROLLBACK')
    console.error(e)
    return c.json({ error: 'No se pudo guardar el precio' }, 500)
  } finally {
    client.release()
  }
})

function mapPrice(r: Record<string, unknown>) {
  return {
    id: r.id,
    packagingId: r.packaging_id,
    priceKind: r.price_kind,
    minQty: Number(r.min_qty),
    maxQty: r.max_qty != null ? Number(r.max_qty) : null,
    amount: Number(r.amount),
    compareAtAmount: r.compare_at_amount != null ? Number(r.compare_at_amount) : null,
    currency: r.currency,
    isActive: r.is_active,
    replacesPriceId: r.replaces_price_id,
    notes: r.notes,
  }
}

/* ——— Reseñas / calificaciones ——— */
adminCatalogRoutes.get('/products/:id/reviews', async (c) => {
  const productId = c.req.param('id')
  const { rows } = await pool.query(
    `SELECT * FROM product_reviews
     WHERE product_id = $1
     ORDER BY created_at DESC
     LIMIT 200`,
    [productId],
  )
  return c.json({
    reviews: rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      userId: r.user_id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      visible: r.visible,
      createdAt: r.created_at,
    })),
  })
})

adminCatalogRoutes.post('/products/:id/reviews', async (c) => {
  const productId = c.req.param('id')
  const body = z
    .object({
      rating: z.number().int().min(1).max(5),
      title: z.string().trim().max(120).optional(),
      body: z.string().trim().max(2000).optional(),
      visible: z.boolean().optional(),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Datos inválidos' }, 400)

  const exists = await pool.query(`SELECT id FROM products WHERE id = $1`, [productId])
  if (!exists.rows[0]) return c.json({ error: 'Producto no encontrado' }, 404)

  const { rows } = await pool.query(
    `INSERT INTO product_reviews (product_id, rating, title, body, visible)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [
      productId,
      body.data.rating,
      body.data.title ?? '',
      body.data.body ?? '',
      body.data.visible ?? true,
    ],
  )
  await recalculateProductRating(productId)
  await invalidateCatalogHomeCaches()
  return c.json(
    {
      review: {
        id: rows[0].id,
        rating: rows[0].rating,
        title: rows[0].title,
        body: rows[0].body,
        visible: rows[0].visible,
      },
    },
    201,
  )
})

adminCatalogRoutes.patch('/reviews/:id', async (c) => {
  const id = c.req.param('id')
  const body = z
    .object({
      rating: z.number().int().min(1).max(5).optional(),
      title: z.string().trim().max(120).optional(),
      body: z.string().trim().max(2000).optional(),
      visible: z.boolean().optional(),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Datos inválidos' }, 400)
  const d = body.data
  const { rows } = await pool.query(
    `UPDATE product_reviews SET
       rating = COALESCE($2, rating),
       title = COALESCE($3, title),
       body = COALESCE($4, body),
       visible = COALESCE($5, visible),
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, d.rating ?? null, d.title ?? null, d.body ?? null, d.visible ?? null],
  )
  if (!rows[0]) return c.json({ error: 'Reseña no encontrada' }, 404)
  await recalculateProductRating(String(rows[0].product_id))
  await invalidateCatalogHomeCaches()
  return c.json({
    review: {
      id: rows[0].id,
      rating: rows[0].rating,
      visible: rows[0].visible,
      productId: rows[0].product_id,
    },
  })
})

adminCatalogRoutes.delete('/reviews/:id', async (c) => {
  const id = c.req.param('id')
  const { rows } = await pool.query(
    `UPDATE product_reviews SET visible = false, updated_at = now()
     WHERE id = $1 RETURNING product_id`,
    [id],
  )
  if (!rows[0]) return c.json({ error: 'Reseña no encontrada' }, 404)
  await recalculateProductRating(String(rows[0].product_id))
  await invalidateCatalogHomeCaches()
  return c.json({ ok: true, softDeleted: true })
})
