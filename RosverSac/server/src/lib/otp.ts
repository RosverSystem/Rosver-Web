import { pool } from '../db.js'
import { randomOtpCode, sha256 } from './crypto.js'
import { sendOtpEmail } from './mail.js'

/** Intentos de verificación por código (toast si falla). */
const MAX_VERIFY_ATTEMPTS = 3
const TTL_MS = 5 * 60 * 1000
/** Cooldown entre envíos. */
export const OTP_RESEND_COOLDOWN_SEC = 30
/**
 * 1 envío inicial + hasta 3 reenvíos = 4 en la ventana **sin** sesión exitosa.
 * Si el OTP se verifica bien (login / verify / reset), se borra el historial
 * y el límite se reinicia (otra PC o nuevo ingreso no queda bloqueado).
 */
export const OTP_MAX_SENDS = 4
/** Ventana de conteo de envíos fallidos / sin usar (SQL: interval '30 minutes'). */

export type IssueOtpOk = {
  ok: true
  expiresAt: Date
  mail: { delivered: boolean; mode: 'smtp' | 'console' }
  sendCount: number
  sendsLeft: number
  retryAfterSec: number
}

export type IssueOtpErr = {
  ok: false
  error: string
  retryAfterSec?: number
  sendsLeft?: number
}

/** Tras OTP correcto: limpia historial de envíos de ese purpose. */
export async function clearOtpSendHistory(email: string, purpose: string) {
  await pool.query(`DELETE FROM auth_otps WHERE email = $1 AND purpose = $2`, [
    email.toLowerCase(),
    purpose,
  ])
}

export async function issueOtp(params: {
  email: string
  purpose: string
  userId?: string | null
}): Promise<IssueOtpOk | IssueOtpErr> {
  const email = params.email.toLowerCase()

  const stats = await pool.query<{ n: number; last: Date | null }>(
    `SELECT COUNT(*)::int AS n, MAX(created_at) AS last
     FROM auth_otps
     WHERE email = $1 AND purpose = $2
       AND created_at > now() - interval '30 minutes'`,
    [email, params.purpose],
  )
  const sendCount = stats.rows[0]?.n ?? 0
  const last = stats.rows[0]?.last

  if (sendCount >= OTP_MAX_SENDS) {
    return {
      ok: false,
      error:
        'Pediste demasiados códigos seguidos. Espera unos minutos o entra con un código válido para reiniciar el límite.',
      sendsLeft: 0,
      retryAfterSec: 0,
    }
  }

  if (last) {
    const elapsed = Date.now() - new Date(last).getTime()
    const waitMs = OTP_RESEND_COOLDOWN_SEC * 1000 - elapsed
    if (waitMs > 0) {
      return {
        ok: false,
        error: `Espera ${Math.ceil(waitMs / 1000)}s para pedir otro código.`,
        retryAfterSec: Math.ceil(waitMs / 1000),
        sendsLeft: OTP_MAX_SENDS - sendCount,
      }
    }
  }

  const code = randomOtpCode()
  const codeHash = sha256(code)
  const expiresAt = new Date(Date.now() + TTL_MS)

  await pool.query(
    `UPDATE auth_otps SET consumed_at = now()
     WHERE email = $1 AND purpose = $2 AND consumed_at IS NULL`,
    [email, params.purpose],
  )

  await pool.query(
    `INSERT INTO auth_otps (user_id, email, purpose, code_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [params.userId ?? null, email, params.purpose, codeHash, expiresAt],
  )

  const mail = await sendOtpEmail(params.email, code, params.purpose)
  const nextCount = sendCount + 1
  return {
    ok: true,
    expiresAt,
    mail,
    sendCount: nextCount,
    sendsLeft: OTP_MAX_SENDS - nextCount,
    retryAfterSec: OTP_RESEND_COOLDOWN_SEC,
  }
}

export async function verifyOtp(params: {
  email: string
  purpose: string
  code: string
}) {
  const email = params.email.toLowerCase()
  const { rows } = await pool.query<{
    id: string
    code_hash: string
    attempts: number
    expires_at: Date
  }>(
    `SELECT id, code_hash, attempts, expires_at FROM auth_otps
     WHERE email = $1 AND purpose = $2 AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [email, params.purpose],
  )

  const row = rows[0]
  if (!row) return { ok: false as const, error: 'Intento fallido. Código inválido o expirado.' }
  if (row.expires_at.getTime() < Date.now()) {
    return { ok: false as const, error: 'El código expiró. Solicita uno nuevo.' }
  }
  if (row.attempts >= MAX_VERIFY_ATTEMPTS) {
    return {
      ok: false as const,
      error: 'Intento fallido. Pide un código nuevo.',
    }
  }

  const match = sha256(params.code.replace(/[\s\-_.]/g, '').trim()) === row.code_hash
  if (!match) {
    await pool.query(
      `UPDATE auth_otps SET attempts = attempts + 1 WHERE id = $1`,
      [row.id],
    )
    return { ok: false as const, error: 'Intento fallido. Código incorrecto.' }
  }

  // Éxito: reinicia el tope de envíos (otra PC / nuevo login no queda bloqueado).
  await clearOtpSendHistory(email, params.purpose)
  return { ok: true as const }
}
