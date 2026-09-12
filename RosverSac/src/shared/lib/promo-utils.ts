/**
 * Utilidades de promociones BOGO para el cliente.
 * Misma lógica que server/src/lib/product-promos.ts — solo para display.
 * El servidor es la fuente de verdad; este código es solo visual.
 */

export type PublicPromo = {
  id: string
  productId: string
  productSlug: string
  productName: string
  packagingId: string | null
  kind: 'bogo'
  buyQty: number
  payQty: number
  /** Texto de badge, ej. "2x1" */
  label: string
  validFrom: string | null
  validTo: string | null
}

/**
 * Calcula las unidades pagables en un BOGO (igual que el servidor).
 * 2x1: qty=4 → paga 2. 3x2: qty=6 → paga 4.
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
 * Devuelve el total de una línea con promo aplicada.
 * Si no hay promo, devuelve unitPrice * qty.
 */
export function lineDisplayTotal(
  unitPrice: number,
  qty: number,
  promo: Pick<PublicPromo, 'buyQty' | 'payQty'> | null | undefined,
): { lineTotal: number; savings: number; hasPromo: boolean } {
  if (!promo || qty <= 0) {
    return { lineTotal: unitPrice * qty, savings: 0, hasPromo: false }
  }
  const payableQty = computeBogoPayableQty(qty, promo.buyQty, promo.payQty)
  const lineTotal = unitPrice * payableQty
  const savings = unitPrice * (qty - payableQty)
  return { lineTotal, savings, hasPromo: true }
}
