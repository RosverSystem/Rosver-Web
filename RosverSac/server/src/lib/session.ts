import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { config } from '../config.js'
import { pool } from '../db.js'
import { randomToken, sha256 } from './crypto.js'
import { getUserPermissions } from './rbac.js'

export type AuthUser = {
  id: string
  email: string
  fullName: string | null
  phone: string | null
  companyName: string | null
  documentType: string | null
  documentNumber: string | null
  avatarUrl: string
  roleCode: string
  roleName: string
  emailVerified: boolean
  totpEnabled: boolean
  status: string
  permissions: string[]
}

type UserRow = {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  company_name: string | null
  document_type: string | null
  document_number: string | null
  avatar_url: string
  email_verified_at: Date | null
  totp_enabled: boolean
  status: string
  role_code: string
  role_name: string
}

function mapUser(row: UserRow, permissions: string[]): AuthUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    companyName: row.company_name,
    documentType: row.document_type,
    documentNumber: row.document_number,
    avatarUrl: row.avatar_url,
    roleCode: row.role_code,
    roleName: row.role_name,
    emailVerified: Boolean(row.email_verified_at),
    totpEnabled: row.totp_enabled,
    status: row.status,
    permissions,
  }
}

export async function loadUserById(userId: string): Promise<AuthUser | null> {
  const { rows } = await pool.query<UserRow>(
    `SELECT u.id, u.email, u.full_name, u.phone, u.company_name,
            u.document_type, u.document_number, u.avatar_url,
            u.email_verified_at, u.totp_enabled, u.status,
            r.code AS role_code, r.name AS role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [userId],
  )
  const row = rows[0]
  if (!row || row.status !== 'active') return null
  return mapUser(row, await getUserPermissions(row.id))
}

export async function createSession(c: Context, userId: string) {
  const token = randomToken(32)
  const tokenHash = sha256(token)
  const expiresAt = new Date(
    Date.now() + config.sessionDays * 24 * 60 * 60 * 1000,
  )
  const ua = c.req.header('user-agent') ?? null
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('cf-connecting-ip') ||
    null

  await pool.query(
    `INSERT INTO sessions (user_id, token_hash, user_agent, ip, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, ua, ip, expiresAt],
  )

  setCookie(c, config.sessionCookie, token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'Lax',
    path: '/',
    expires: expiresAt,
  })

  return { expiresAt }
}

export async function resolveSessionUser(
  c: Context,
): Promise<AuthUser | null> {
  const token = getCookie(c, config.sessionCookie)
  if (!token) return null
  const tokenHash = sha256(token)

  const { rows } = await pool.query<UserRow>(
    `SELECT u.id, u.email, u.full_name, u.phone, u.company_name,
            u.document_type, u.document_number, u.avatar_url,
            u.email_verified_at, u.totp_enabled, u.status,
            r.code AS role_code, r.name AS role_name
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     JOIN roles r ON r.id = u.role_id
     WHERE s.token_hash = $1
       AND s.revoked_at IS NULL
       AND s.expires_at > now()`,
    [tokenHash],
  )

  const row = rows[0]
  if (!row || row.status !== 'active') return null
  return mapUser(row, await getUserPermissions(row.id))
}

export async function revokeSession(c: Context) {
  const token = getCookie(c, config.sessionCookie)
  if (token) {
    await pool.query(
      `UPDATE sessions SET revoked_at = now()
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [sha256(token)],
    )
  }
  deleteCookie(c, config.sessionCookie, { path: '/' })
}

export async function createLoginChallenge(userId: string, purpose = 'totp') {
  const token = randomToken(24)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
  await pool.query(
    `INSERT INTO login_challenges (user_id, token_hash, purpose, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, sha256(token), purpose, expiresAt],
  )
  return token
}

export async function consumeLoginChallenge(token: string, purpose = 'totp') {
  const { rows } = await pool.query<{ user_id: string; id: string }>(
    `SELECT id, user_id FROM login_challenges
     WHERE token_hash = $1 AND purpose = $2
       AND consumed_at IS NULL AND expires_at > now()`,
    [sha256(token), purpose],
  )
  const row = rows[0]
  if (!row) return null
  await pool.query(
    `UPDATE login_challenges SET consumed_at = now() WHERE id = $1`,
    [row.id],
  )
  return row.user_id
}
