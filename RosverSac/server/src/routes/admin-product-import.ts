import { Hono } from 'hono'
import { z } from 'zod'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from '../db.js'
import {
  buildRosverExcelTemplateBuffer,
  emptyRosverImportTemplate,
  parseElfaProductWorkbook,
  type ImportProductDraft,
} from '../lib/elfa-excel-import.js'
import { invalidateCatalogHomeCaches } from '../lib/redis.js'
import { putPrivateObject, r2PrivateEnabled } from '../lib/r2.js'
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from '../middleware/auth.js'

export const adminProductImportRoutes = new Hono<{ Variables: AuthVariables }>()

adminProductImportRoutes.use('*', requireAuth, requireRole('admin'))

const templatesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../data/import-templates',
)

function slugify(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120)
}

async function ensureUnitType(
  client: import('pg').PoolClient,
  code: string,
  name: string,
): Promise<string> {
  const found = await client.query<{ id: string }>(
    `SELECT id FROM unit_types WHERE code = $1 LIMIT 1`,
    [code],
  )
  if (found.rows[0]?.id) return found.rows[0].id
  const inserted = await client.query<{ id: string }>(
    `INSERT INTO unit_types (code, name, is_base, sort_order)
     VALUES ($1,$2,$3,$4)
     RETURNING id`,
    [code, name, code === 'unidad', code === 'unidad' ? 1 : code === 'docena' ? 2 : 3],
  )
  return inserted.rows[0].id
}

async function ensureBrand(
  client: import('pg').PoolClient,
  name: string,
): Promise<string> {
  const sku = slugify(name).slice(0, 40) || 'marca'
  const found = await client.query<{ id: string }>(
    `SELECT id FROM brands WHERE UPPER(name) = UPPER($1) OR sku = $2 LIMIT 1`,
    [name, sku],
  )
  if (found.rows[0]?.id) return found.rows[0].id
  const inserted = await client.query<{ id: string }>(
    `INSERT INTO brands (sku, name, slug, visible, show_on_home, sort_order)
     VALUES ($1,$2,$3,true,false,10)
     RETURNING id`,
    [sku.toUpperCase(), name, slugify(name)],
  )
  return inserted.rows[0].id
}

/** Plantilla JSON oficial (ejemplo corto). */
adminProductImportRoutes.get('/imports/products/template', async (c) => {
  const examplePath = path.join(templatesDir, 'products-import.v1.example.json')
  if (fs.existsSync(examplePath)) {
    const body = fs.readFileSync(examplePath, 'utf8')
    return c.body(body, 200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition':
        'attachment; filename="rosver-products-import.v1.example.json"',
    })
  }
  return c.json(emptyRosverImportTemplate())
})

/** Plantilla Excel detallada (layout ELFA + instrucciones + ejemplos). */
adminProductImportRoutes.get('/imports/products/template-xlsx', async (c) => {
  try {
    const staticPath = path.join(
      templatesDir,
      'rosver-productos-importacion-plantilla.xlsx',
    )
    const buf = fs.existsSync(staticPath)
      ? fs.readFileSync(staticPath)
      : await buildRosverExcelTemplateBuffer()
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition':
          'attachment; filename="rosver-productos-importacion-plantilla.xlsx"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[import/template-xlsx]', e)
    return c.json({ error: 'No se pudo generar la plantilla Excel' }, 500)
  }
})

/** Catálogo ELFA ya convertido a JSON (desde el Excel comercial). */
adminProductImportRoutes.get('/imports/products/elfa-json', async (c) => {
  const fullPath = path.join(templatesDir, 'products-elfa-from-xlsx.json')
  if (!fs.existsSync(fullPath)) {
    return c.json(
      { error: 'Aún no hay JSON ELFA generado. Sube el Excel una vez.' },
      404,
    )
  }
  const body = fs.readFileSync(fullPath, 'utf8')
  return c.body(body, 200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition':
      'attachment; filename="products-elfa-from-xlsx.json"',
  })
})

/** Parsea Excel ELFA o JSON Rosver v1 → borrador (sin escribir en DB). */
adminProductImportRoutes.post('/imports/products/parse', async (c) => {
  const body = await c.req.parseBody()
  const file = body.file
  if (!file || typeof file === 'string') {
    return c.json({ error: 'Adjunta un archivo .xlsx o .json' }, 400)
  }
  const name = file.name || 'import.xlsx'
  if (!/\.(xlsx?|json|csv)$/i.test(name)) {
    return c.json({ error: 'Solo se aceptan .xlsx / .xls / .json / .csv' }, 400)
  }
  const buf = Buffer.from(await file.arrayBuffer())
  if (buf.byteLength > 12 * 1024 * 1024) {
    return c.json({ error: 'El archivo supera 12 MB' }, 400)
  }

  try {
    const parsed = parseElfaProductWorkbook(buf, name)
    if (parsed.products.length === 0) {
      return c.json(
        {
          error: 'No se detectaron productos en el archivo',
          parse: parsed,
        },
        422,
      )
    }
    // No escribir JSON en disco aquí: Vite observa `server/` y un writeFile
    // recarga la SPA (parece F5) justo al terminar el parse.
    const overwrites = await findImportOverwrites(parsed.products)
    return c.json({
      parse: parsed,
      overwrites,
    })
  } catch (e) {
    console.error('[import/parse]', e)
    return c.json({ error: 'No se pudo leer el archivo' }, 400)
  }
})

function parseInternalCodeHint(value: string | number | null | undefined): number | null {
  if (value == null) return null
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.floor(value)
  }
  const raw = String(value).trim()
  if (!/^\d{1,8}$/.test(raw)) return null
  return Number.parseInt(raw, 10)
}

/** Coincide por SKU o por código interno (00000001 / campo code del JSON). */
async function findImportOverwrites(
  drafts: Array<{ sku: string; code?: number | null }>,
) {
  const skus = [
    ...new Set(drafts.map((d) => d.sku.trim().toUpperCase()).filter(Boolean)),
  ]
  const codes = [
    ...new Set(
      drafts
        .map((d) => parseInternalCodeHint(d.code ?? null))
        .filter((n): n is number => n != null),
    ),
  ]
  if (skus.length === 0 && codes.length === 0) return []

  const { rows } = await pool.query<{
    id: string
    sku: string
    name: string
    code: number
  }>(
    `SELECT id, sku, name, code
     FROM products
     WHERE ($1::text[] <> '{}'::text[] AND UPPER(sku) = ANY($1::text[]))
        OR ($2::int[] <> '{}'::int[] AND code = ANY($2::int[]))
     ORDER BY sku`,
    [skus, codes],
  )
  return rows.map((r) => ({
    id: r.id,
    sku: String(r.sku),
    name: String(r.name),
    code: Number(r.code),
    codeLabel: String(Math.max(0, Math.floor(Number(r.code)))).padStart(8, '0'),
    matchBy:
      skus.includes(String(r.sku).toUpperCase())
        ? ('sku' as const)
        : ('code' as const),
  }))
}

async function replaceProductPrices(
  client: import('pg').PoolClient,
  productId: string,
  draft: ImportProductDraft,
  unitIds: Record<'unidad' | 'docena' | 'caja', string>,
) {
  await client.query(`DELETE FROM product_prices WHERE product_id = $1`, [
    productId,
  ])
  await client.query(`DELETE FROM product_packagings WHERE product_id = $1`, [
    productId,
  ])

  let firstPack = true
  for (const line of draft.prices) {
    const unitTypeId = unitIds[line.unitCode]
    const pack = await client.query<{ id: string }>(
      `INSERT INTO product_packagings
         (product_id, unit_type_id, content_qty, label, is_default)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id`,
      [productId, unitTypeId, line.contentQty, line.label, firstPack],
    )
    const packagingId = pack.rows[0].id
    firstPack = false

    if (line.listAmount != null) {
      await client.query(
        `INSERT INTO product_prices
           (product_id, packaging_id, price_kind, min_qty, amount, is_active)
         VALUES ($1,$2,'list',1,$3,true)`,
        [productId, packagingId, line.listAmount],
      )
    }
    if (line.wholesaleAmount != null) {
      await client.query(
        `INSERT INTO product_prices
           (product_id, packaging_id, price_kind, min_qty, amount, is_active)
         VALUES ($1,$2,'wholesale',1,$3,true)`,
        [productId, packagingId, line.wholesaleAmount],
      )
    }
  }

  if (draft.prices.length === 0) {
    await client.query(
      `INSERT INTO product_packagings
         (product_id, unit_type_id, content_qty, label, is_default)
       VALUES ($1,$2,1,'Unidad',true)`,
      [productId, unitIds.unidad],
    )
  }
}

const commitSchema = z.object({
  products: z
    .array(
      z.object({
        sku: z.string().trim().min(1).max(60),
        /** Código interno opcional (sobrescribe si coincide). */
        code: z.number().int().nonnegative().nullable().optional(),
        name: z.string().trim().min(2).max(200),
        brandName: z.string().trim().min(1).max(80).default('ELFA'),
        contentPerBox: z.number().nullable().optional(),
        prices: z.array(
          z.object({
            unitCode: z.enum(['unidad', 'docena', 'caja']),
            contentQty: z.number().positive(),
            label: z.string().trim().min(1).max(80),
            listAmount: z.number().nullable(),
            wholesaleAmount: z.number().nullable(),
          }),
        ),
        sourceSheet: z.string().optional(),
        warnings: z.array(z.string()).optional(),
      }),
    )
    .min(1)
    .max(2000),
  sourceFileName: z.string().optional(),
  wipeExisting: z.boolean().optional().default(false),
})

/** Confirma importación: inserta productos + precios y archiva JSON en R2 privado. */
adminProductImportRoutes.post('/imports/products/commit', async (c) => {
  const body = commitSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: 'Datos de importación inválidos' }, 400)
  }

  const drafts = body.data.products as ImportProductDraft[]
  const client = await pool.connect()
  const created: { id: string; sku: string; code: number }[] = []
  const updated: { id: string; sku: string; code: number }[] = []
  const errors: { sku: string; error: string }[] = []

  try {
    await client.query('BEGIN')

    if (body.data.wipeExisting) {
      await client.query('DELETE FROM products')
      const seq = await client.query<{ s: string | null }>(
        `SELECT pg_get_serial_sequence('products','code') AS s`,
      )
      if (seq.rows[0]?.s) {
        await client.query('SELECT setval($1::regclass, 0, false)', [
          seq.rows[0].s,
        ])
      }
    }

    const unitIds = {
      unidad: await ensureUnitType(client, 'unidad', 'Unidad'),
      docena: await ensureUnitType(client, 'docena', 'Docena'),
      caja: await ensureUnitType(client, 'caja', 'Caja'),
    }

    for (const draft of drafts) {
      try {
        await client.query('SAVEPOINT product_row')
        const brandId = await ensureBrand(client, draft.brandName || 'ELFA')
        const sku = draft.sku.toUpperCase()
        // Solo usar `code` explícito del JSON; nunca inferir código interno desde el SKU.
        const codeHint = parseInternalCodeHint(draft.code ?? null)

        const existing = await client.query<{
          id: string
          code: number
          slug: string
          sku: string
        }>(
          `SELECT id, code, slug, sku FROM products
           WHERE UPPER(sku) = $1
              OR ($2::int IS NOT NULL AND code = $2)
           ORDER BY CASE WHEN UPPER(sku) = $1 THEN 0 ELSE 1 END
           LIMIT 1`,
          [sku, codeHint],
        )

        if (existing.rows[0]) {
          const productId = existing.rows[0].id
          const code = Number(existing.rows[0].code)
          await client.query(
            `UPDATE products SET
               name = $2,
               brand_id = $3,
               sku = $4,
               updated_at = now()
             WHERE id = $1`,
            [productId, draft.name, brandId, sku],
          )
          await replaceProductPrices(client, productId, draft, unitIds)
          await client.query('RELEASE SAVEPOINT product_row')
          updated.push({ id: productId, sku, code })
          continue
        }

        const slugBase = slugify(draft.name) || slugify(sku) || 'producto'
        let slug = slugBase
        for (let i = 0; i < 20; i++) {
          const candidate = i === 0 ? slugBase : `${slugBase}-${i + 1}`
          const exists = await client.query(
            `SELECT 1 FROM products WHERE slug = $1`,
            [candidate],
          )
          if (!exists.rows[0]) {
            slug = candidate
            break
          }
        }

        let productId: string
        let code: number
        try {
          const { rows } = await client.query(
            `INSERT INTO products
               (sku, slug, name, brand_id, description, moq, availability, visible)
             VALUES ($1,$2,$3,$4,$5,1,'in_stock',true)
             RETURNING id, code`,
            [sku, slug, draft.name, brandId, ''],
          )
          productId = rows[0].id as string
          code = Number(rows[0].code)
        } catch (insertErr) {
          // Carrera / SKU ya existente: actualizar en vez de fallar
          const msg =
            insertErr instanceof Error ? insertErr.message : String(insertErr)
          if (!/products_sku_key|unique/i.test(msg)) throw insertErr
          const again = await client.query<{ id: string; code: number }>(
            `SELECT id, code FROM products WHERE UPPER(sku) = $1 LIMIT 1`,
            [sku],
          )
          if (!again.rows[0]) throw insertErr
          productId = again.rows[0].id
          code = Number(again.rows[0].code)
          await client.query(
            `UPDATE products SET
               name = $2,
               brand_id = $3,
               updated_at = now()
             WHERE id = $1`,
            [productId, draft.name, brandId],
          )
          await replaceProductPrices(client, productId, draft, unitIds)
          await client.query('RELEASE SAVEPOINT product_row')
          updated.push({ id: productId, sku, code })
          continue
        }

        await replaceProductPrices(client, productId, draft, unitIds)
        await client.query('RELEASE SAVEPOINT product_row')
        created.push({ id: productId, sku, code })
      } catch (e) {
        await client.query('ROLLBACK TO SAVEPOINT product_row').catch(() => {})
        errors.push({
          sku: draft.sku,
          error: e instanceof Error ? e.message : 'Error al insertar',
        })
      }
    }

    if (created.length === 0 && updated.length === 0) {
      await client.query('ROLLBACK')
      return c.json(
        { error: 'Ningún producto se pudo importar', errors },
        422,
      )
    }

    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('[import/commit]', e)
    return c.json({ error: 'Falló la importación' }, 500)
  } finally {
    client.release()
  }

  await invalidateCatalogHomeCaches()

  const archive = {
    importedAt: new Date().toISOString(),
    sourceFileName: body.data.sourceFileName ?? null,
    wipeExisting: Boolean(body.data.wipeExisting),
    createdCount: created.length,
    updatedCount: updated.length,
    errorCount: errors.length,
    created,
    updated,
    errors,
    products: drafts,
  }

  let privateArchive: { bucket: string; key: string } | null = null
  if (r2PrivateEnabled()) {
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      const key = `imports/products/${stamp}-${created.length + updated.length}.json`
      privateArchive = await putPrivateObject({
        key,
        body: Buffer.from(JSON.stringify(archive, null, 2), 'utf8'),
        contentType: 'application/json',
      })
    } catch (e) {
      console.error('[import/archive]', e)
    }
  }

  return c.json({
    ok: true,
    createdCount: created.length,
    updatedCount: updated.length,
    errorCount: errors.length,
    created,
    updated,
    errors,
    privateArchive,
    archiveSaved: Boolean(privateArchive),
  })
})
