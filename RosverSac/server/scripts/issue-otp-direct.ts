/**
 * Emite un OTP en la DB (sin SMTP) para desbloqueo de emergencia.
 * Uso: DATABASE_URL=... npx tsx server/scripts/issue-otp-direct.ts email [purpose]
 */
import { pool } from '../src/db.js'
import { randomOtpCode, sha256 } from '../src/lib/crypto.js'

const email = (process.argv[2] || '').toLowerCase().trim()
const purpose = process.argv[3] || 'login'

if (!email) {
  console.error('Uso: npx tsx server/scripts/issue-otp-direct.ts email [purpose]')
  process.exit(1)
}

const code = randomOtpCode()
const codeHash = sha256(code)
const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

await pool.query(
  `UPDATE auth_otps SET consumed_at = now()
   WHERE email = $1 AND purpose = $2 AND consumed_at IS NULL`,
  [email, purpose],
)
await pool.query(`DELETE FROM auth_otps WHERE email = $1 AND purpose = $2`, [
  email,
  purpose,
])
const { rows: users } = await pool.query<{ id: string }>(
  `SELECT id FROM users WHERE email = $1 LIMIT 1`,
  [email],
)
await pool.query(
  `INSERT INTO auth_otps (user_id, email, purpose, code_hash, expires_at)
   VALUES ($1, $2, $3, $4, $5)`,
  [users[0]?.id ?? null, email, purpose, codeHash, expiresAt],
)
console.log(JSON.stringify({ email, purpose, code, expiresAt }, null, 2))
await pool.end()
