import { pool } from '../db.js'

type PriceAuditEntry = {
  productId: string
  priceId?: string | null
  packagingId?: string | null
  action: 'created' | 'updated' | 'deactivated'
  oldAmount?: number | null
  newAmount?: number | null
  actorId: string
  actorEmail: string
}

/** Registra un cambio de precio para el historial de auditoría en `/admin`. */
export async function recordPriceChange(entry: PriceAuditEntry) {
  try {
    await pool.query(
      `INSERT INTO price_audit
         (product_id, price_id, packaging_id, action, old_amount, new_amount, changed_by, changed_by_email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        entry.productId,
        entry.priceId ?? null,
        entry.packagingId ?? null,
        entry.action,
        entry.oldAmount ?? null,
        entry.newAmount ?? null,
        entry.actorId,
        entry.actorEmail,
      ],
    )
  } catch (err) {
    console.warn('[price-audit] no se pudo registrar el cambio', err)
  }
}
