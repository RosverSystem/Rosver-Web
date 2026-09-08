import { Hono } from 'hono'
import { z } from 'zod'
import { pool } from '../db.js'
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from '../middleware/auth.js'

export const adminCatalogRoutes = new Hono<{ Variables: AuthVariables }>()

adminCatalogRoutes.use('*', requireAuth, requireRole('admin'))

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
    sortOrder: row.sort_order,
  }
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
      logoUrl: z.string().trim().url().optional().or(z.literal('')),
      visible: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: body.error.issues[0]?.message ?? 'Datos inválidos' }, 400)
  }
  const slug = body.data.slug || slugify(body.data.name)
  try {
    const { rows } = await pool.query(
      `INSERT INTO brands (sku, name, slug, logo_url, visible, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        body.data.sku.toUpperCase(),
        body.data.name,
        slug,
        body.data.logoUrl || null,
        body.data.visible ?? true,
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
       sort_order = COALESCE($7, sort_order),
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
      d.sortOrder ?? null,
    ],
  )
  if (!rows[0]) return c.json({ error: 'Marca no encontrada' }, 404)
  return c.json({ brand: mapBrand(rows[0]) })
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
      sortOrder: z.number().int().optional(),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: body.error.issues[0]?.message ?? 'Datos inválidos' }, 400)
  }
  const slug = body.data.slug || slugify(body.data.name)
  try {
    const { rows } = await pool.query(
      `INSERT INTO categories
         (parent_id, sku, name, slug, icon_key, image_url, visible, show_in_nav, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        body.data.parentId ?? null,
        body.data.sku || null,
        body.data.name,
        slug,
        body.data.iconKey || null,
        body.data.imageUrl || null,
        body.data.visible ?? true,
        body.data.showInNav ?? true,
        body.data.sortOrder ?? 0,
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
      sortOrder: z.number().int().optional(),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Datos inválidos' }, 400)
  const d = body.data
  const { rows } = await pool.query(
    `UPDATE categories SET
       name = COALESCE($2, name),
       slug = COALESCE($3, slug),
       sku = COALESCE($4, sku),
       parent_id = CASE WHEN $5::boolean THEN $6::uuid ELSE parent_id END,
       icon_key = COALESCE($7, icon_key),
       image_url = COALESCE($8, image_url),
       visible = COALESCE($9, visible),
       show_in_nav = COALESCE($10, show_in_nav),
       sort_order = COALESCE($11, sort_order),
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
      d.imageUrl === undefined ? null : d.imageUrl,
      d.visible ?? null,
      d.showInNav ?? null,
      d.sortOrder ?? null,
    ],
  )
  if (!rows[0]) return c.json({ error: 'Categoría no encontrada' }, 404)
  return c.json({ category: mapCategory(rows[0]) })
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
          availability, featured, visible, image_url, rating)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
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
    return c.json({ product: { id: productId, sku: rows[0].sku, slug: rows[0].slug } }, 201)
  } catch (e) {
    await client.query('ROLLBACK')
    return c.json({ error: 'SKU o slug de producto ya existe.' }, 409)
  } finally {
    client.release()
  }
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
