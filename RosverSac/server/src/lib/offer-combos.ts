import { pool } from '../db.js'

export type OfferComboKind = 'bogo' | 'bundle_fixed' | 'qty_pack'

export type OfferComboItemRow = {
  id: string
  productId: string
  packagingId: string | null
  quantity: number
  sortOrder: number
  productName: string
  productSku: string
  productSlug: string
  productImageUrl: string | null
  listPrice: number | null
  productRating: number
  productReviewCount: number
}

export type OfferComboRow = {
  id: string
  code: number
  sku: string
  slug: string
  name: string
  description: string
  imageUrl: string | null
  kind: OfferComboKind
  buyQty: number | null
  payQty: number | null
  fixedPrice: number | null
  /** Máx. unidades de este combo por usuario (NULL = sin límite). */
  maxPerUser: number | null
  visible: boolean
  validFrom: string | null
  validTo: string | null
  sortOrder: number
  items: OfferComboItemRow[]
  /** Precio a mostrar en tienda / carrito */
  displayPrice: number | null
  /** Comparación (suma lista de ítems) para badge ahorro */
  compareAt: number | null
  /** Promedio ponderado de rating de productos del combo */
  rating: number
  reviewCount: number
}

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

export function comboSkuFromName(name: string, codeHint?: number) {
  const base = slugify(name).replace(/-/g, '').slice(0, 10).toUpperCase() || 'COMBO'
  const n = codeHint != null ? String(codeHint).padStart(4, '0') : 'XXXX'
  return `CB-${base}-${n}`.slice(0, 60)
}

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || 'combo'
  for (let i = 0; i < 30; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`
    const { rows } = await pool.query(
      `SELECT 1 FROM offer_combos WHERE slug = $1 AND ($2::uuid IS NULL OR id <> $2) LIMIT 1`,
      [candidate, excludeId ?? null],
    )
    if (!rows[0]) return candidate
  }
  return `${root}-${Date.now().toString(36)}`
}

async function uniqueSku(base: string, excludeId?: string) {
  const root = base.toUpperCase().slice(0, 50)
  for (let i = 0; i < 30; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`.slice(0, 60)
    const { rows } = await pool.query(
      `SELECT 1 FROM offer_combos WHERE UPPER(sku) = $1 AND ($2::uuid IS NULL OR id <> $2) LIMIT 1`,
      [candidate, excludeId ?? null],
    )
    if (!rows[0]) return candidate
  }
  return `${root}-${Date.now().toString(36)}`.slice(0, 60)
}

const LIST_PRICE_SQL = `
  (SELECT pp.amount
     FROM product_prices pp
     JOIN product_packagings pk ON pk.id = pp.packaging_id
    WHERE pp.product_id = p.id
      AND pp.price_kind = 'list'
      AND pp.is_active = true
      AND (i.packaging_id IS NULL OR pp.packaging_id = i.packaging_id)
    ORDER BY pk.is_default DESC, pp.min_qty ASC
    LIMIT 1)
`

function mapCombo(
  row: Record<string, unknown>,
  items: OfferComboItemRow[],
): OfferComboRow {
  const kind = String(row.kind) as OfferComboKind
  const buyQty = row.buy_qty == null ? null : Number(row.buy_qty)
  const payQty = row.pay_qty == null ? null : Number(row.pay_qty)
  const fixedPrice = row.fixed_price == null ? null : Number(row.fixed_price)

  const itemsListSum = items.reduce((s, it) => {
    const unit = it.listPrice ?? 0
    return s + unit * it.quantity
  }, 0)

  let displayPrice: number | null = fixedPrice
  if (kind === 'bogo' && payQty != null) {
    // Precio del combo = pagar payQty del primer ítem (o suma proporcional)
    const first = items[0]
    const unit = first?.listPrice ?? 0
    displayPrice = unit * payQty * (first?.quantity ?? 1)
  }

  let ratingSum = 0
  let reviewSum = 0
  let rated = 0
  for (const it of items) {
    if (it.productRating > 0) {
      ratingSum += it.productRating
      rated += 1
    }
    reviewSum += it.productReviewCount
  }

  return {
    id: String(row.id),
    code: Number(row.code),
    sku: String(row.sku),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description ?? ''),
    imageUrl: row.image_url ? String(row.image_url) : null,
    kind,
    buyQty,
    payQty,
    fixedPrice,
    maxPerUser:
      row.max_per_user == null ? null : Math.max(1, Number(row.max_per_user)),
    visible: Boolean(row.visible),
    validFrom: row.valid_from ? String(row.valid_from) : null,
    validTo: row.valid_to ? String(row.valid_to) : null,
    sortOrder: Number(row.sort_order ?? 0),
    items,
    displayPrice,
    compareAt: itemsListSum > 0 ? itemsListSum : null,
    rating: rated > 0 ? Math.round((ratingSum / rated) * 100) / 100 : 0,
    reviewCount: reviewSum,
  }
}

async function loadItemsForCombos(
  comboIds: string[],
): Promise<Map<string, OfferComboItemRow[]>> {
  const map = new Map<string, OfferComboItemRow[]>()
  if (comboIds.length === 0) return map
  const { rows } = await pool.query(
    `SELECT i.id, i.combo_id, i.product_id, i.packaging_id, i.quantity, i.sort_order,
            p.name AS product_name, p.sku AS product_sku, p.slug AS product_slug,
            p.image_url AS product_image_url,
            COALESCE(p.rating, 0)::float8 AS product_rating,
            COALESCE(p.review_count, 0)::int AS product_review_count,
            ${LIST_PRICE_SQL} AS list_price
     FROM offer_combo_items i
     JOIN products p ON p.id = i.product_id
     WHERE i.combo_id = ANY($1::uuid[])
     ORDER BY i.sort_order, p.name`,
    [comboIds],
  )
  for (const r of rows) {
    const comboId = String(r.combo_id)
    const list = map.get(comboId) ?? []
    list.push({
      id: String(r.id),
      productId: String(r.product_id),
      packagingId: r.packaging_id ? String(r.packaging_id) : null,
      quantity: Number(r.quantity),
      sortOrder: Number(r.sort_order),
      productName: String(r.product_name),
      productSku: String(r.product_sku),
      productSlug: String(r.product_slug),
      productImageUrl: r.product_image_url ? String(r.product_image_url) : null,
      listPrice: r.list_price == null ? null : Number(r.list_price),
      productRating: Number(r.product_rating) || 0,
      productReviewCount: Number(r.product_review_count) || 0,
    })
    map.set(comboId, list)
  }
  return map
}

export async function queryOfferCombos(opts?: {
  visibleOnly?: boolean
  limit?: number
}): Promise<OfferComboRow[]> {
  const visibleOnly = opts?.visibleOnly ?? false
  const limit = opts?.limit ?? 200
  const { rows } = await pool.query(
    `SELECT *
     FROM offer_combos
     WHERE ($1::boolean = false OR (
       visible = true
       AND (valid_from IS NULL OR valid_from <= now())
       AND (valid_to IS NULL OR valid_to >= now())
     ))
     ORDER BY sort_order, name
     LIMIT $2`,
    [visibleOnly, limit],
  )
  const ids = rows.map((r) => String(r.id))
  const itemsMap = await loadItemsForCombos(ids)
  return rows.map((r) => mapCombo(r, itemsMap.get(String(r.id)) ?? []))
}

export async function getOfferComboById(
  id: string,
): Promise<OfferComboRow | null> {
  const { rows } = await pool.query(`SELECT * FROM offer_combos WHERE id = $1`, [
    id,
  ])
  if (!rows[0]) return null
  const itemsMap = await loadItemsForCombos([id])
  return mapCombo(rows[0], itemsMap.get(id) ?? [])
}

export type UpsertComboInput = {
  name: string
  description?: string
  imageUrl?: string | null
  kind: OfferComboKind
  buyQty?: number | null
  payQty?: number | null
  fixedPrice?: number | null
  maxPerUser?: number | null
  visible?: boolean
  validFrom?: string | null
  validTo?: string | null
  sortOrder?: number
  sku?: string
  items: Array<{
    productId: string
    packagingId?: string | null
    quantity: number
  }>
}

export async function createOfferCombo(
  input: UpsertComboInput,
): Promise<OfferComboRow> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const slug = await uniqueSlug(input.name)
    const sku = await uniqueSku(
      input.sku?.trim() || comboSkuFromName(input.name),
    )
    const { rows } = await client.query(
      `INSERT INTO offer_combos
         (sku, slug, name, description, image_url, kind, buy_qty, pay_qty,
          fixed_price, max_per_user, visible, valid_from, valid_to, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        sku,
        slug,
        input.name.trim(),
        input.description?.trim() ?? '',
        input.imageUrl ?? null,
        input.kind,
        input.kind === 'bogo' ? (input.buyQty ?? 2) : null,
        input.kind === 'bogo' ? (input.payQty ?? 1) : null,
        input.kind === 'bogo' ? null : (input.fixedPrice ?? 0),
        input.maxPerUser != null && input.maxPerUser >= 1
          ? Math.floor(input.maxPerUser)
          : null,
        input.visible !== false,
        input.validFrom || null,
        input.validTo || null,
        input.sortOrder ?? 0,
      ],
    )
    const comboId = rows[0].id as string
    let order = 0
    for (const it of input.items) {
      await client.query(
        `INSERT INTO offer_combo_items
           (combo_id, product_id, packaging_id, quantity, sort_order)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          comboId,
          it.productId,
          it.packagingId ?? null,
          Math.max(1, Math.floor(it.quantity) || 1),
          order++,
        ],
      )
    }
    await client.query('COMMIT')
    const full = await getOfferComboById(comboId)
    if (!full) throw new Error('Combo no encontrado tras crear')
    return full
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

export async function updateOfferCombo(
  id: string,
  input: UpsertComboInput,
): Promise<OfferComboRow | null> {
  const existing = await getOfferComboById(id)
  if (!existing) return null
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const slug = await uniqueSlug(input.name, id)
    const sku = await uniqueSku(
      input.sku?.trim() || existing.sku,
      id,
    )
    await client.query(
      `UPDATE offer_combos SET
         sku = $2, slug = $3, name = $4, description = $5, image_url = $6,
         kind = $7, buy_qty = $8, pay_qty = $9, fixed_price = $10,
         max_per_user = $11,
         visible = $12, valid_from = $13, valid_to = $14, sort_order = $15,
         updated_at = now()
       WHERE id = $1`,
      [
        id,
        sku,
        slug,
        input.name.trim(),
        input.description?.trim() ?? '',
        input.imageUrl ?? null,
        input.kind,
        input.kind === 'bogo' ? (input.buyQty ?? 2) : null,
        input.kind === 'bogo' ? (input.payQty ?? 1) : null,
        input.kind === 'bogo' ? null : (input.fixedPrice ?? 0),
        input.maxPerUser != null && input.maxPerUser >= 1
          ? Math.floor(input.maxPerUser)
          : null,
        input.visible !== false,
        input.validFrom || null,
        input.validTo || null,
        input.sortOrder ?? 0,
      ],
    )
    await client.query(`DELETE FROM offer_combo_items WHERE combo_id = $1`, [
      id,
    ])
    let order = 0
    for (const it of input.items) {
      await client.query(
        `INSERT INTO offer_combo_items
           (combo_id, product_id, packaging_id, quantity, sort_order)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          id,
          it.productId,
          it.packagingId ?? null,
          Math.max(1, Math.floor(it.quantity) || 1),
          order++,
        ],
      )
    }
    await client.query('COMMIT')
    return getOfferComboById(id)
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

export async function softDeleteOfferCombo(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE offer_combos SET visible = false, updated_at = now() WHERE id = $1`,
    [id],
  )
  return (rowCount ?? 0) > 0
}

export function toPublicCombo(c: OfferComboRow) {
  return {
    id: c.id,
    code: c.code,
    sku: c.sku,
    slug: c.slug,
    name: c.name,
    description: c.description,
    imageUrl: c.imageUrl ?? undefined,
    kind: c.kind,
    buyQty: c.buyQty ?? undefined,
    payQty: c.payQty ?? undefined,
    fixedPrice: c.fixedPrice ?? undefined,
    maxPerUser: c.maxPerUser ?? undefined,
    displayPrice: c.displayPrice,
    compareAt: c.compareAt ?? undefined,
    rating: c.rating,
    reviewCount: c.reviewCount,
    badge: 'Combo',
    items: c.items.map((it) => ({
      productId: it.productId,
      productSlug: it.productSlug,
      productName: it.productName,
      productSku: it.productSku,
      imageUrl: it.productImageUrl ?? undefined,
      quantity: it.quantity,
      packagingId: it.packagingId ?? undefined,
      listPrice: it.listPrice,
      rating: it.productRating,
      reviewCount: it.productReviewCount,
    })),
  }
}

/** Unidades ya pedidas de un combo por un usuario (pedidos previos). */
export async function countUserComboPurchases(
  userId: string,
  comboId: string,
): Promise<number> {
  const { rows } = await pool.query<{ qty: string }>(
    `SELECT COALESCE(SUM(
       CASE
         WHEN jsonb_typeof(elem) = 'object'
          AND (elem->>'lineKind') = 'combo'
          AND (elem->>'comboId') = $2
         THEN GREATEST(1, COALESCE((elem->>'quantity')::int, 1))
         ELSE 0
       END
     ), 0)::text AS qty
     FROM order_requests o
     CROSS JOIN LATERAL jsonb_array_elements(
       CASE WHEN jsonb_typeof(o.items) = 'array' THEN o.items ELSE '[]'::jsonb END
     ) AS elem
     WHERE o.user_id = $1::uuid`,
    [userId, comboId],
  )
  return Math.max(0, Number(rows[0]?.qty ?? 0) || 0)
}
