/**
 * Motor de promociones BOGO (Buy X Get Y) por producto.
 * - Solo server-side: las reglas se aplican aquí, el front solo las muestra.
 * - Los totales de pedido/cotización los recalcula el servidor; nunca confiar en el cliente.
 */
import { pool } from '../db.js'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type ProductPromo = {
  id: string
  productId: string
  packagingId: string | null
  kind: 'bogo'
  buyQty: number
  payQty: number
  active: boolean
  validFrom: string | null
  validTo: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type BogoResult = {
  payableQty: number
  /** Cuántas unidades va a pagar (sin descuento si no hay promo). */
  savings: number
  /** Unidades gratis. */
  lineTotal: number
  unitPrice: number
  hasPromo: boolean
}

// ---------------------------------------------------------------------------
// Helpers de cálculo (exportados para tests)
// ---------------------------------------------------------------------------

/**
 * Calcula las unidades pagables en un BOGO.
 * Ejemplo 2x1: qty=4 → paga 2 (cada 2 unidades, paga 1).
 * Ejemplo 3x2: qty=6 → paga 4 (cada 3 unidades, paga 2).
 * Ejemplo qty=0 → 0.
 *
 * Fórmula: floor(qty / buyQty) * payQty  +  qty % buyQty
 */
export function computeBogoPayableQty(
  qty: number,
  buyQty: number,
  payQty: number,
): number {
  if (qty <= 0 || buyQty < 2 || payQty < 1) return Math.max(0, qty)
  const groups = Math.floor(qty / buyQty)
  const remainder = qty % buyQty
  return groups * payQty + remainder
}

/**
 * Calcula el resumen de precio de una línea con promo BOGO.
 * Si `promo` es null/undefined, devuelve la línea sin descuento.
 */
export function priceLineWithPromo(opts: {
  unitPrice: number
  qty: number
  promo: { buyQty: number; payQty: number } | null | undefined
  /** Si true y promo activa, la promo tiene en cuenta válida/expirada externamente. */
}): BogoResult {
  const { unitPrice, qty, promo } = opts
  if (!promo || qty <= 0) {
    return {
      payableQty: qty,
      savings: 0,
      lineTotal: unitPrice * qty,
      unitPrice,
      hasPromo: false,
    }
  }
  const payableQty = computeBogoPayableQty(qty, promo.buyQty, promo.payQty)
  const lineTotal = unitPrice * payableQty
  const savings = unitPrice * (qty - payableQty)
  return { payableQty, savings, lineTotal, unitPrice, hasPromo: true }
}

// ---------------------------------------------------------------------------
// Consultas DB
// ---------------------------------------------------------------------------

type PromoRow = {
  id: string
  product_id: string
  packaging_id: string | null
  kind: string
  buy_qty: number
  pay_qty: number
  active: boolean
  valid_from: string | null
  valid_to: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

function mapPromo(r: PromoRow): ProductPromo {
  return {
    id: r.id,
    productId: r.product_id,
    packagingId: r.packaging_id,
    kind: r.kind as 'bogo',
    buyQty: Number(r.buy_qty),
    payQty: Number(r.pay_qty),
    active: r.active,
    validFrom: r.valid_from,
    validTo: r.valid_to,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

/** Filtra promos que estén vigentes por fecha (o sin fecha límite). */
function isPromoValid(p: ProductPromo, now = new Date()): boolean {
  if (!p.active) return false
  if (p.validFrom && new Date(p.validFrom) > now) return false
  if (p.validTo && new Date(p.validTo) < now) return false
  return true
}

/**
 * Devuelve las promos activas y vigentes para un conjunto de product_ids.
 * Usado en el servidor al crear pedidos/cotizaciones.
 */
export async function getActivePromosForProducts(
  productIds: string[],
): Promise<ProductPromo[]> {
  if (productIds.length === 0) return []
  const now = new Date()
  const { rows } = await pool.query<PromoRow>(
    `SELECT id, product_id, packaging_id, kind, buy_qty, pay_qty,
            active, valid_from, valid_to, notes, created_at, updated_at
     FROM product_promos
     WHERE product_id = ANY($1::uuid[])
       AND active = true
       AND (valid_from IS NULL OR valid_from <= $2)
       AND (valid_to IS NULL OR valid_to >= $2)`,
    [productIds, now.toISOString()],
  )
  return rows.map(mapPromo)
}

/** Devuelve todas las promos (para admin). */
export async function getAllPromos(): Promise<
  (ProductPromo & { productName: string; productSku: string })[]
> {
  const { rows } = await pool.query<
    PromoRow & { product_name: string; product_sku: string }
  >(
    `SELECT pp.*, p.name AS product_name, p.sku AS product_sku
     FROM product_promos pp
     JOIN products p ON p.id = pp.product_id
     ORDER BY pp.created_at DESC`,
  )
  return rows.map((r) => ({
    ...mapPromo(r),
    productName: r.product_name,
    productSku: r.product_sku,
  }))
}

/** Crea una promo BOGO. */
export async function createPromo(input: {
  productId: string
  packagingId: string | null
  buyQty: number
  payQty: number
  validFrom: string | null
  validTo: string | null
  notes: string | null
}): Promise<ProductPromo> {
  const { rows } = await pool.query<PromoRow>(
    `INSERT INTO product_promos
       (product_id, packaging_id, kind, buy_qty, pay_qty, valid_from, valid_to, notes)
     VALUES ($1, $2, 'bogo', $3, $4, $5, $6, $7)
     ON CONFLICT (product_id, packaging_id, kind)
     DO UPDATE SET
       buy_qty = EXCLUDED.buy_qty,
       pay_qty = EXCLUDED.pay_qty,
       valid_from = EXCLUDED.valid_from,
       valid_to = EXCLUDED.valid_to,
       notes = EXCLUDED.notes,
       active = true,
       updated_at = now()
     RETURNING *`,
    [
      input.productId,
      input.packagingId ?? null,
      input.buyQty,
      input.payQty,
      input.validFrom ?? null,
      input.validTo ?? null,
      input.notes ?? null,
    ],
  )
  return mapPromo(rows[0])
}

/** Actualiza una promo existente. */
export async function updatePromo(
  id: string,
  input: Partial<{
    buyQty: number
    payQty: number
    active: boolean
    validFrom: string | null
    validTo: string | null
    notes: string | null
  }>,
): Promise<ProductPromo | null> {
  const sets: string[] = []
  const vals: unknown[] = [id]
  let i = 2

  if (input.buyQty !== undefined) {
    sets.push(`buy_qty = $${i++}`)
    vals.push(input.buyQty)
  }
  if (input.payQty !== undefined) {
    sets.push(`pay_qty = $${i++}`)
    vals.push(input.payQty)
  }
  if (input.active !== undefined) {
    sets.push(`active = $${i++}`)
    vals.push(input.active)
  }
  if (input.validFrom !== undefined) {
    sets.push(`valid_from = $${i++}`)
    vals.push(input.validFrom)
  }
  if (input.validTo !== undefined) {
    sets.push(`valid_to = $${i++}`)
    vals.push(input.validTo)
  }
  if (input.notes !== undefined) {
    sets.push(`notes = $${i++}`)
    vals.push(input.notes)
  }

  if (sets.length === 0) return null

  sets.push('updated_at = now()')
  const { rows } = await pool.query<PromoRow>(
    `UPDATE product_promos SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    vals,
  )
  return rows[0] ? mapPromo(rows[0]) : null
}

/** Elimina una promo. */
export async function deletePromo(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM product_promos WHERE id = $1`,
    [id],
  )
  return (rowCount ?? 0) > 0
}

/**
 * Dado un array de ítems de pedido/cotización, aplica promos y devuelve
 * los ítems con unitPrice y lineTotal recalculados.
 * Nunca confiar en los totales enviados por el cliente para líneas de producto.
 */
export async function applyPromosToItems(
  items: Array<{
    lineKind?: string
    productSlug?: string
    quantity?: number
    unitPrice?: number | null
    [key: string]: unknown
  }>,
): Promise<{
  items: typeof items
  totalEstimated: number
  promosApplied: number
}> {
  // Obtener product_ids de los slugs
  const slugs = [
    ...new Set(
      items
        .filter((i) => i.lineKind !== 'combo')
        .map((i) => (typeof i.productSlug === 'string' ? i.productSlug : ''))
        .filter(Boolean),
    ),
  ]

  let promosByProductId = new Map<string, ProductPromo>()

  if (slugs.length > 0) {
    const { rows } = await pool.query<{ id: string; slug: string }>(
      `SELECT id, slug FROM products WHERE slug = ANY($1::text[])`,
      [slugs],
    )
    const productIds = rows.map((r) => r.id)

    if (productIds.length > 0) {
      const promos = await getActivePromosForProducts(productIds)
      // Indexar por product_id (packaging_id=null aplica a todos)
      for (const promo of promos) {
        if (!promosByProductId.has(promo.productId)) {
          promosByProductId.set(promo.productId, promo)
        }
      }
      // Reindexar por slug para el loop de ítems
      promosByProductId = new Map(
        [...promosByProductId.entries()].map(([productId, promo]) => {
          const slug = rows.find((r) => r.id === productId)?.slug ?? ''
          return [slug, promo]
        }),
      )
    }
  }

  let totalEstimated = 0
  let promosApplied = 0
  const outItems = items.map((item) => {
    const qty = Number(item.quantity) || 0
    const unitPrice = item.unitPrice != null ? Number(item.unitPrice) : null

    if (item.lineKind === 'combo' || unitPrice == null || unitPrice < 0) {
      // Combos: sumar su unitPrice * qty sin modificar
      const lt = unitPrice != null ? unitPrice * qty : 0
      totalEstimated += lt
      return item
    }

    const slug = typeof item.productSlug === 'string' ? item.productSlug : ''
    const promo = slug ? (promosByProductId as Map<string, ProductPromo>).get(slug) : undefined

    if (promo && isPromoValid(promo)) {
      const result = priceLineWithPromo({ unitPrice, qty, promo })
      totalEstimated += result.lineTotal
      promosApplied++
      return { ...item, unitPrice, lineTotal: result.lineTotal }
    }

    totalEstimated += unitPrice * qty
    return item
  })

  return { items: outItems, totalEstimated, promosApplied }
}
