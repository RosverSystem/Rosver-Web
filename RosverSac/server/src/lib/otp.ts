import { pool } from '../db.js'
import { randomOtpCode, sha256 } from './crypto.js'
import { sendOtpEmail } from './mail.js'

const MAX_ATTEMPTS = 5
const TTL_MS = 10 * 60 * 1000

export async function issueOtp(params: {
  email: string
  purpose: string
  userId?: string | null
}) {
  const code = randomOtpCode()
  const codeHash = sha256(code)
  const expiresAt = new Date(Date.now() + TTL_MS)

  await pool.query(
    `UPDATE auth_otps SET consumed_at = now()
     WHERE email = $1 AND purpose = $2 AND consumed_at IS NULL`,
    [params.email.toLowerCase(), params.purpose],
  )

  await pool.query(
    `INSERT INTO auth_otps (user_id, email, purpose, code_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      params.userId ?? null,
      params.email.toLowerCase(),
      params.purpose,
      codeHash,
      expiresAt,
    ],
  )

  const mail = await sendOtpEmail(params.email, code, params.purpose)
  return { expiresAt, mail }
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
  if (!row) return { ok: false as const, error: 'Código inválido o expirado.' }
  if (row.expires_at.getTime() < Date.now()) {
    return { ok: false as const, error: 'El código expiró. Solicita uno nuevo.' }
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return {
      ok: false as const,
      error: 'Demasiados intentos. Solicita un código nuevo.',
    }
  }

  const match = sha256(params.code.trim()) === row.code_hash
  if (!match) {
    await pool.query(
      `UPDATE auth_otps SET attempts = attempts + 1 WHERE id = $1`,
      [row.id],
    )
    return { ok: false as const, error: 'Código incorrecto.' }
  }

  await pool.query(
    `UPDATE auth_otps SET consumed_at = now() WHERE id = $1`,
    [row.id],
  )
  return { ok: true as const }
}
