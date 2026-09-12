/**
 * Sanitiza y valida comentarios de reseña (anti-XSS básico).
 * Pure — testeable sin DB.
 */
export function stripHtml(input: string): string {
  return input
    .replace(/\0/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
}

export function sanitizeReviewTitle(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return stripHtml(raw).trim().slice(0, 120)
}

export function sanitizeReviewBody(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return stripHtml(raw).trim().slice(0, 2000)
}

export function assertGoogleOAuthState(
  cookie: string | undefined | null,
  query: string | undefined | null,
): { ok: true } | { ok: false; reason: 'missing' | 'mismatch' } {
  if (!cookie || !query) return { ok: false, reason: 'missing' }
  if (cookie !== query) return { ok: false, reason: 'mismatch' }
  return { ok: true }
}

/** 2x1 / BOGO: unidades a cobrar. */
export function computeBogoPayableQty(
  qty: number,
  buyQty: number,
  payQty: number,
): number {
  const q = Math.max(0, Math.floor(qty))
  const buy = Math.max(1, Math.floor(buyQty))
  const pay = Math.max(0, Math.floor(payQty))
  if (pay > buy) return q
  const groups = Math.floor(q / buy)
  const rem = q % buy
  return groups * pay + rem
}

export function priceLineWithBogo(opts: {
  unitPrice: number
  qty: number
  buyQty: number
  payQty: number
}): { payableQty: number; lineTotal: number; savings: number } {
  const payableQty = computeBogoPayableQty(
    opts.qty,
    opts.buyQty,
    opts.payQty,
  )
  const full = opts.unitPrice * opts.qty
  const lineTotal = Math.round(opts.unitPrice * payableQty * 10000) / 10000
  const savings = Math.round((full - lineTotal) * 10000) / 10000
  return { payableQty, lineTotal, savings }
}
