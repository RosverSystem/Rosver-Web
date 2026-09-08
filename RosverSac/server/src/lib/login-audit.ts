import { pool } from '../db.js'

type LoginAuditEntry = {
  userId?: string | null
  email: string
  ip: string
  success: boolean
  reason?: string
}

/** Registra un intento de login (éxito o fallo) para auditoría en `/admin`. */
export async function recordLoginAttempt(entry: LoginAuditEntry) {
  try {
    await pool.query(
      `INSERT INTO login_audit (user_id, email, ip, success, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [entry.userId ?? null, entry.email, entry.ip, entry.success, entry.reason ?? null],
    )
  } catch (err) {
    console.warn('[login-audit] no se pudo registrar el intento', err)
  }
}
