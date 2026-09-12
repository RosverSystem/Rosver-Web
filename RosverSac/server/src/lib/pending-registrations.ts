import { pool } from '../db.js'

const TTL_MS = 24 * 60 * 60 * 1000

/** Elimina registros pendientes vencidos (+ OTPs asociados). */
export async function purgeExpiredPendingRegistrations() {
  const { rows } = await pool.query<{ email: string }>(
    `DELETE FROM pending_registrations
     WHERE expires_at < now()
     RETURNING email`,
  )
  if (rows.length === 0) return { deleted: 0 }
  const emails = rows.map((r) => r.email.toLowerCase())
  await pool.query(
    `DELETE FROM auth_otps WHERE lower(email) = ANY($1::text[])`,
    [emails],
  )
  console.log(`[auth] purged ${rows.length} pending registration(s)`)
  return { deleted: rows.length }
}

export function pendingExpiresAt(from = Date.now()) {
  return new Date(from + TTL_MS)
}

/** Arranca limpieza periódica (dev + prod). */
export function startPendingRegistrationCleanup(intervalMs = 15 * 60 * 1000) {
  void purgeExpiredPendingRegistrations().catch((err) =>
    console.error('[auth] pending purge failed', err),
  )
  const id = setInterval(() => {
    void purgeExpiredPendingRegistrations().catch((err) =>
      console.error('[auth] pending purge failed', err),
    )
  }, intervalMs)
  if (typeof id === 'object' && 'unref' in id) {
    ;(id as NodeJS.Timeout).unref?.()
  }
  return id
}
