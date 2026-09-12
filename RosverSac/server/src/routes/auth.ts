import { Hono } from 'hono'
import type { Context } from 'hono'
import { config } from '../config.js'
import { pool } from '../db.js'
import { assertGoogleOAuthState } from '../lib/pricing-security.js'
import { hashPassword, pickDefaultAvatar, verifyPassword } from '../lib/crypto.js'
import { issueOtp, verifyOtp, OTP_RESEND_COOLDOWN_SEC, clearOtpSendHistory } from '../lib/otp.js'
import {
  pendingExpiresAt,
} from '../lib/pending-registrations.js'
import {
  buildOtpauthUrl,
  generateTotpSecret,
  totpQrDataUrl,
  verifyTotpCode,
} from '../lib/totp.js'
import {
  createLoginChallenge,
  consumeLoginChallenge,
  createSession,
  loadUserById,
  resolveSessionUser,
  revokeAllSessionsForUser,
  revokeSession,
} from '../lib/session.js'
import {
  loginSchema,
  otpSchema,
  registerSchema,
  resetPasswordSchema,
  resetPasswordStartSchema,
} from '../lib/validation.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'
import { loginLimiter, requestIp } from '../lib/rate-limit.js'
import { recordLoginAttempt } from '../lib/login-audit.js'
import { deleteCookie, getCookie } from 'hono/cookie'
import { z } from 'zod'

export const authRoutes = new Hono<{ Variables: AuthVariables }>()

authRoutes.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      400,
    )
  }
  const data = parsed.data

  const existingUser = await pool.query<{ id: string }>(
    `SELECT id FROM users WHERE lower(email) = $1`,
    [data.email],
  )
  if (existingUser.rows[0]) {
    return c.json({ error: 'Ya existe una cuenta con ese correo.' }, 409)
  }

  const passwordHash = await hashPassword(data.password)
  const expiresAt = pendingExpiresAt()

  const existingPending = await pool.query<{ id: string }>(
    `SELECT id FROM pending_registrations WHERE email = $1`,
    [data.email],
  )
  if (existingPending.rows[0]) {
    await pool.query(
      `UPDATE pending_registrations
       SET password_hash = $2, full_name = $3, phone = $4,
           created_at = now(), expires_at = $5
       WHERE email = $1`,
      [data.email, passwordHash, data.fullName, data.phone, expiresAt],
    )
  } else {
    await pool.query(
      `INSERT INTO pending_registrations (email, password_hash, full_name, phone, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [data.email, passwordHash, data.fullName, data.phone, expiresAt],
    )
  }

  const issued = await issueOtp({ email: data.email, purpose: 'email_verify' })
  if (!issued.ok) {
    return c.json(
      {
        ok: true,
        requiresEmailVerification: true,
        email: data.email,
        message: issued.error,
        mailDelivered: false,
        retryAfterSec: issued.retryAfterSec ?? OTP_RESEND_COOLDOWN_SEC,
        sendsLeft: issued.sendsLeft ?? 0,
      },
      200,
    )
  }

  return c.json({
    ok: true,
    requiresEmailVerification: true,
    email: data.email,
    message:
      'Te enviamos un código OTP. Tienes 24 horas para verificar tu correo.',
    expiresAt: expiresAt.toISOString(),
    mailDelivered: issued.mail.delivered,
    retryAfterSec: issued.retryAfterSec,
    sendsLeft: issued.sendsLeft,
  })
})

authRoutes.post('/verify-email', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = otpSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Código o correo inválido.' }, 400)
  }

  const result = await verifyOtp({
    email: parsed.data.email,
    purpose: 'email_verify',
    code: parsed.data.code,
  })
  if (!result.ok) return c.json({ error: result.error }, 400)

  const pending = await pool.query<{
    id: string
    email: string
    password_hash: string
    full_name: string
    phone: string
    expires_at: Date
  }>(
    `SELECT id, email, password_hash, full_name, phone, expires_at
     FROM pending_registrations WHERE lower(email) = $1`,
    [parsed.data.email],
  )
  const row = pending.rows[0]
  if (!row) {
    return c.json(
      { error: 'Registro no encontrado o ya expiró. Vuelve a registrarte.' },
      404,
    )
  }
  if (row.expires_at.getTime() < Date.now()) {
    await pool.query(`DELETE FROM pending_registrations WHERE id = $1`, [row.id])
    return c.json(
      { error: 'El plazo de 24 h venció. Vuelve a registrarte.' },
      410,
    )
  }

  const role = await pool.query<{ id: string }>(
    `SELECT id FROM roles WHERE code = 'client' LIMIT 1`,
  )
  if (!role.rows[0]) {
    return c.json({ error: 'Rol cliente no configurado. Ejecuta el seed.' }, 500)
  }

  const avatarUrl = pickDefaultAvatar(row.email)
  const inserted = await pool.query<{ id: string }>(
    `INSERT INTO users (
       email, password_hash, role_id, full_name, phone, avatar_url, email_verified_at
     ) VALUES ($1, $2, $3, $4, $5, $6, now())
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       full_name = EXCLUDED.full_name,
       phone = EXCLUDED.phone,
       email_verified_at = COALESCE(users.email_verified_at, now()),
       updated_at = now()
     RETURNING id`,
    [
      row.email.toLowerCase(),
      row.password_hash,
      role.rows[0].id,
      row.full_name,
      row.phone,
      avatarUrl,
    ],
  )

  await pool.query(`DELETE FROM pending_registrations WHERE id = $1`, [row.id])

  await createSession(c, inserted.rows[0].id)
  const user = await loadUserById(inserted.rows[0].id)
  return c.json({ ok: true, user })
})

/**
 * Tras validar identidad (password o passwordless):
 * - autenticador vinculado → TOTP (sin correo)
 * - sin autenticador → OTP al correo (purpose login)
 */
async function continueVerifiedLogin(
  c: Context,
  params: {
    userId: string
    email: string
    totpEnabled: boolean
    ip: string
  },
) {
  if (params.totpEnabled) {
    const challengeToken = await createLoginChallenge(params.userId, 'totp')
    return c.json({
      ok: false,
      requiresTotp: true,
      challengeToken,
      email: params.email,
      message: 'Ingresa el código de tu autenticador.',
    })
  }

  const issued = await issueOtp({
    email: params.email,
    purpose: 'login',
    userId: params.userId,
  })
  if (!issued.ok) {
    return c.json({
      ok: false,
      requiresEmailOtp: true,
      email: params.email,
      message: issued.error,
      mailDelivered: false,
      retryAfterSec: issued.retryAfterSec ?? 0,
      sendsLeft: issued.sendsLeft ?? 0,
    })
  }
  return c.json({
    ok: false,
    requiresEmailOtp: true,
    email: params.email,
    message: 'Te enviamos un código OTP a tu correo.',
    mailDelivered: issued.mail.delivered,
    retryAfterSec: issued.retryAfterSec,
    sendsLeft: issued.sendsLeft,
  })
}

authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Correo inválido.' }, 400)
  }

  const email = parsed.data.email
  const passwordless =
    Boolean(parsed.data.passwordless) ||
    !parsed.data.password ||
    parsed.data.password.length === 0

  const ip = requestIp(c.req.raw.headers)
  const lock = await loginLimiter.check(email, ip)
  if (lock.locked) {
    return c.json(
      {
        error: `Demasiados intentos. Vuelve a intentar en ${lock.retryAfterSec ?? 300}s.`,
      },
      429,
    )
  }

  // 1) Cuenta verificada en users
  const { rows } = await pool.query<{
    id: string
    password_hash: string | null
    totp_enabled: boolean
    status: string
  }>(
    `SELECT id, password_hash, totp_enabled, status FROM users WHERE lower(email) = $1`,
    [email],
  )
  const user = rows[0]

  if (user) {
    if (user.status !== 'active') {
      await recordLoginAttempt({
        userId: user.id,
        email,
        ip,
        success: false,
        reason: 'disabled',
      })
      return c.json({ error: 'Cuenta deshabilitada.' }, 403)
    }

    if (!passwordless) {
      if (!user.password_hash) {
        await loginLimiter.recordFailure(email, ip)
        await recordLoginAttempt({
          email,
          ip,
          success: false,
          reason: 'bad_credentials',
        })
        return c.json({ error: 'Correo o contraseña incorrectos.' }, 401)
      }
      const ok = await verifyPassword(user.password_hash, parsed.data.password!)
      if (!ok) {
        await loginLimiter.recordFailure(email, ip)
        await recordLoginAttempt({
          userId: user.id,
          email,
          ip,
          success: false,
          reason: 'bad_credentials',
        })
        return c.json({ error: 'Correo o contraseña incorrectos.' }, 401)
      }
    }

    await loginLimiter.recordSuccess(email, ip)
    return continueVerifiedLogin(c, {
      userId: user.id,
      email,
      totpEnabled: user.totp_enabled,
      ip,
    })
  }

  // 2) Registro pendiente (no verificado)
  const pending = await pool.query<{
    id: string
    password_hash: string
    expires_at: Date
  }>(
    `SELECT id, password_hash, expires_at FROM pending_registrations WHERE lower(email) = $1`,
    [email],
  )
  const pend = pending.rows[0]
  if (!pend) {
    await loginLimiter.recordFailure(email, ip)
    await recordLoginAttempt({ email, ip, success: false, reason: 'bad_credentials' })
    return c.json({ error: 'Correo o contraseña incorrectos.' }, 401)
  }
  if (pend.expires_at.getTime() < Date.now()) {
    await pool.query(`DELETE FROM pending_registrations WHERE id = $1`, [pend.id])
    return c.json(
      { error: 'Tu registro expiró (24 h). Vuelve a crear la cuenta.' },
      410,
    )
  }

  if (!passwordless) {
    const ok = await verifyPassword(pend.password_hash, parsed.data.password!)
    if (!ok) {
      await loginLimiter.recordFailure(email, ip)
      await recordLoginAttempt({
        email,
        ip,
        success: false,
        reason: 'bad_credentials',
      })
      return c.json({ error: 'Correo o contraseña incorrectos.' }, 401)
    }
  }

  await loginLimiter.recordSuccess(email, ip)
  const issued = await issueOtp({ email, purpose: 'email_verify' })
  return c.json({
    ok: false,
    requiresEmailVerification: true,
    email,
    message:
      'Debes verificar tu correo con el código OTP. Sin verificación la cuenta se elimina a las 24 h.',
    mailDelivered: issued.ok ? issued.mail.delivered : false,
    retryAfterSec: issued.ok
      ? issued.retryAfterSec
      : (issued.retryAfterSec ?? 0),
    sendsLeft: issued.ok ? issued.sendsLeft : (issued.sendsLeft ?? 0),
  })
})

authRoutes.post('/login/otp', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = otpSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Datos inválidos.' }, 400)

  const result = await verifyOtp({
    email: parsed.data.email,
    purpose: 'login',
    code: parsed.data.code,
  })
  if (!result.ok) return c.json({ error: result.error }, 400)

  const { rows } = await pool.query<{ id: string; status: string }>(
    `SELECT id, status FROM users WHERE lower(email) = $1`,
    [parsed.data.email],
  )
  const row = rows[0]
  if (!row || row.status !== 'active') {
    return c.json({ error: 'Usuario no encontrado.' }, 404)
  }

  const ip = requestIp(c.req.raw.headers)
  await createSession(c, row.id)
  await recordLoginAttempt({
    userId: row.id,
    email: parsed.data.email,
    ip,
    success: true,
  })
  const user = await loadUserById(row.id)
  return c.json({ ok: true, user })
})

authRoutes.post('/login/totp', async (c) => {
  const body = z
    .object({
      challengeToken: z.string().min(10),
      code: z.string().min(4).max(8),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Datos inválidos.' }, 400)

  const userId = await consumeLoginChallenge(body.data.challengeToken, 'totp')
  if (!userId) return c.json({ error: 'Desafío expirado. Vuelve a iniciar sesión.' }, 401)

  const ip = requestIp(c.req.raw.headers)
  const { rows } = await pool.query<{
    email: string
    totp_secret: string | null
    totp_enabled: boolean
  }>(`SELECT email, totp_secret, totp_enabled FROM users WHERE id = $1`, [userId])
  const u = rows[0]
  if (!u?.totp_enabled || !u.totp_secret) {
    return c.json({ error: '2FA no está activo.' }, 400)
  }
  if (!(await verifyTotpCode(u.totp_secret, body.data.code))) {
    await recordLoginAttempt({
      userId,
      email: u.email,
      ip,
      success: false,
      reason: 'bad_totp',
    })
    return c.json({ error: 'Código del autenticador incorrecto.' }, 401)
  }

  await createSession(c, userId)
  await clearOtpSendHistory(u.email, 'login')
  await recordLoginAttempt({ userId, email: u.email, ip, success: true })
  const user = await loadUserById(userId)
  return c.json({ ok: true, user })
})

authRoutes.post('/logout', async (c) => {
  await revokeSession(c)
  return c.json({ ok: true })
})

authRoutes.get('/me', async (c) => {
  const user = await resolveSessionUser(c)
  if (!user) return c.json({ user: null })
  return c.json({ user })
})

authRoutes.post('/otp/resend', async (c) => {
  const body = z
    .object({
      email: z.string().email().transform((v) => v.toLowerCase()),
      purpose: z.enum(['email_verify', 'login', 'reset_password']),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Datos inválidos.' }, 400)

  const email = body.data.email
  const purpose = body.data.purpose

  if (purpose === 'email_verify') {
    const pend = await pool.query(
      `SELECT id FROM pending_registrations WHERE lower(email) = $1 AND expires_at > now()`,
      [email],
    )
    if (!pend.rows[0]) {
      return c.json({
        ok: true,
        message: 'Si el correo existe, enviamos un nuevo código.',
      })
    }
  } else {
    const u = await pool.query(
      `SELECT id FROM users WHERE lower(email) = $1`,
      [email],
    )
    if (!u.rows[0]) {
      return c.json({
        ok: true,
        message: 'Si el correo existe, enviamos un nuevo código.',
      })
    }
  }

  const { rows } = await pool.query<{ id: string }>(
    `SELECT id FROM users WHERE lower(email) = $1`,
    [email],
  )
  const issued = await issueOtp({
    email,
    purpose,
    userId: rows[0]?.id,
  })
  if (!issued.ok) {
    return c.json(
      {
        ok: false,
        error: issued.error,
        retryAfterSec: issued.retryAfterSec ?? 0,
        sendsLeft: issued.sendsLeft ?? 0,
      },
      429,
    )
  }
  return c.json({
    ok: true,
    message: issued.mail.delivered
      ? 'Te enviamos un nuevo código.'
      : 'No pudimos enviar el correo ahora. Revisa spam o intenta más tarde.',
    mailDelivered: issued.mail.delivered,
    retryAfterSec: issued.retryAfterSec,
    sendsLeft: issued.sendsLeft,
  })
})

/** Paso 1 recuperación: si hay autenticador → TOTP primero; si no → OTP correo. */
authRoutes.post('/reset-password/start', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = resetPasswordStartSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Correo inválido.' }, 400)

  const email = parsed.data.email
  const { rows } = await pool.query<{
    id: string
    totp_enabled: boolean
    status: string
  }>(
    `SELECT id, totp_enabled, status FROM users WHERE lower(email) = $1`,
    [email],
  )
  const row = rows[0]
  // Respuesta genérica si no existe
  if (!row || row.status !== 'active') {
    return c.json({
      ok: true,
      requiresEmailOtp: true,
      email,
      message: 'Si el correo existe, enviamos un código OTP.',
    })
  }

  if (row.totp_enabled) {
    const challengeToken = await createLoginChallenge(row.id, 'reset_totp')
    return c.json({
      ok: true,
      requiresTotp: true,
      challengeToken,
      email,
      message: 'Confirma con el código de tu autenticador.',
    })
  }

  const issued = await issueOtp({ email, purpose: 'reset_password', userId: row.id })
  if (!issued.ok) {
    return c.json({
      ok: true,
      requiresEmailOtp: true,
      email,
      message: issued.error,
      mailDelivered: false,
      retryAfterSec: issued.retryAfterSec ?? 0,
      sendsLeft: issued.sendsLeft ?? 0,
    })
  }
  return c.json({
    ok: true,
    requiresEmailOtp: true,
    email,
    message: issued.mail.delivered
      ? 'Te enviamos un código OTP a tu correo.'
      : 'No pudimos enviar el correo ahora. Revisa spam o intenta más tarde.',
    mailDelivered: issued.mail.delivered,
    retryAfterSec: issued.retryAfterSec,
    sendsLeft: issued.sendsLeft,
  })
})

/** Tras TOTP en recuperación → se envía OTP al correo. */
authRoutes.post('/reset-password/totp', async (c) => {
  const body = z
    .object({
      challengeToken: z.string().min(10),
      code: z.string().min(4).max(8),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Datos inválidos.' }, 400)

  const userId = await consumeLoginChallenge(body.data.challengeToken, 'reset_totp')
  if (!userId) return c.json({ error: 'Desafío expirado. Vuelve a empezar.' }, 401)

  const { rows } = await pool.query<{
    email: string
    totp_secret: string | null
    totp_enabled: boolean
  }>(`SELECT email, totp_secret, totp_enabled FROM users WHERE id = $1`, [userId])
  const u = rows[0]
  if (!u?.totp_enabled || !u.totp_secret) {
    return c.json({ error: '2FA no está activo.' }, 400)
  }
  if (!(await verifyTotpCode(u.totp_secret, body.data.code))) {
    return c.json({ error: 'Código del autenticador incorrecto.' }, 401)
  }

  const issued = await issueOtp({
    email: u.email,
    purpose: 'reset_password',
    userId,
  })
  if (!issued.ok) {
    return c.json({
      ok: true,
      requiresEmailOtp: true,
      email: u.email,
      message: issued.error,
      mailDelivered: false,
      retryAfterSec: issued.retryAfterSec ?? 0,
      sendsLeft: issued.sendsLeft ?? 0,
    })
  }
  return c.json({
    ok: true,
    requiresEmailOtp: true,
    email: u.email,
    message: issued.mail.delivered
      ? 'Autenticador OK. Te enviamos un código OTP al correo.'
      : 'Autenticador OK. No pudimos enviar el correo ahora; revisa spam o reintenta.',
    mailDelivered: issued.mail.delivered,
    retryAfterSec: issued.retryAfterSec,
    sendsLeft: issued.sendsLeft,
  })
})

authRoutes.post('/reset-password', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = resetPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' },
      400,
    )
  }

  const result = await verifyOtp({
    email: parsed.data.email,
    purpose: 'reset_password',
    code: parsed.data.code,
  })
  if (!result.ok) return c.json({ error: result.error }, 400)

  const { rows } = await pool.query<{ id: string; status: string }>(
    `SELECT id, status FROM users WHERE lower(email) = $1`,
    [parsed.data.email],
  )
  const row = rows[0]
  if (!row || row.status !== 'active') {
    return c.json({ error: 'No se pudo restablecer la contraseña.' }, 404)
  }

  const passwordHash = await hashPassword(parsed.data.newPassword)
  await pool.query(
    `UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`,
    [row.id, passwordHash],
  )
  await revokeAllSessionsForUser(row.id)

  await createSession(c, row.id)
  const user = await loadUserById(row.id)
  return c.json({ ok: true, user })
})

authRoutes.get('/google/start', async (c) => {
  if (!config.google.clientId || !config.google.clientSecret) {
    return c.json(
      {
        error:
          'Google OAuth no configurado. Falta GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.',
      },
      501,
    )
  }
  const state = crypto.randomUUID()
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', config.google.clientId)
  url.searchParams.set('redirect_uri', config.google.redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('access_type', 'online')
  url.searchParams.set('prompt', 'select_account')
  url.searchParams.set('state', state)
  c.header(
    'Set-Cookie',
    `google_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${
      config.isProd ? '; Secure' : ''
    }`,
  )
  return c.redirect(url.toString())
})

authRoutes.get('/google/callback', async (c) => {
  if (!config.google.clientId || !config.google.clientSecret) {
    return c.redirect(`${config.appUrl}/login?error=google_not_configured`)
  }

  const stateParam = c.req.query('state')
  const stateCookie = getCookie(c, 'google_oauth_state')
  deleteCookie(c, 'google_oauth_state', { path: '/' })
  const stateCheck = assertGoogleOAuthState(stateCookie, stateParam)
  if (!stateCheck.ok) {
    return c.redirect(`${config.appUrl}/login?error=google_state`)
  }

  const code = c.req.query('code')
  if (!code) return c.redirect(`${config.appUrl}/login?error=google_denied`)

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      redirect_uri: config.google.redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  if (!tokenRes.ok) {
    return c.redirect(`${config.appUrl}/login?error=google_token`)
  }
  const tokens = (await tokenRes.json()) as { access_token?: string }
  if (!tokens.access_token) {
    return c.redirect(`${config.appUrl}/login?error=google_token`)
  }

  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  if (!profileRes.ok) {
    return c.redirect(`${config.appUrl}/login?error=google_profile`)
  }
  const profile = (await profileRes.json()) as {
    id: string
    email?: string
    name?: string
    picture?: string
  }
  if (!profile.email || !profile.id) {
    return c.redirect(`${config.appUrl}/login?error=google_email`)
  }
  const email = profile.email.toLowerCase()

  const oauth = await pool.query<{ user_id: string }>(
    `SELECT user_id FROM oauth_accounts WHERE provider = 'google' AND provider_user_id = $1`,
    [profile.id],
  )

  let userId = oauth.rows[0]?.user_id
  if (!userId) {
    const byEmail = await pool.query<{ id: string }>(
      `SELECT id FROM users WHERE lower(email) = $1`,
      [email],
    )
    if (byEmail.rows[0]) {
      userId = byEmail.rows[0].id
    } else {
      // Limpiar pending del mismo correo si existía
      await pool.query(
        `DELETE FROM pending_registrations WHERE lower(email) = $1`,
        [email],
      )
      const role = await pool.query<{ id: string }>(
        `SELECT id FROM roles WHERE code = 'client' LIMIT 1`,
      )
      const inserted = await pool.query<{ id: string }>(
        `INSERT INTO users (email, role_id, full_name, avatar_url, email_verified_at, phone)
         VALUES ($1, $2, $3, $4, now(), '')
         RETURNING id`,
        [
          email,
          role.rows[0].id,
          profile.name ?? email.split('@')[0],
          profile.picture || pickDefaultAvatar(email),
        ],
      )
      userId = inserted.rows[0].id
    }
    await pool.query(
      `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, email)
       VALUES ($1, 'google', $2, $3)
       ON CONFLICT (provider, provider_user_id) DO NOTHING`,
      [userId, profile.id, email],
    )
    await pool.query(
      `UPDATE users SET email_verified_at = COALESCE(email_verified_at, now()), updated_at = now()
       WHERE id = $1`,
      [userId],
    )
  }

  const user = await loadUserById(userId!)
  if (!user) return c.redirect(`${config.appUrl}/login?error=disabled`)

  await createSession(c, userId!)
  const dest =
    user.roleCode === 'admin' ? `${config.appUrl}/admin` : `${config.appUrl}/cuenta`
  return c.redirect(dest)
})

authRoutes.post('/2fa/setup', requireAuth, async (c) => {
  const user = c.get('user')
  const secret = generateTotpSecret()
  await pool.query(
    `UPDATE users SET totp_secret = $1, totp_enabled = false, updated_at = now() WHERE id = $2`,
    [secret, user.id],
  )
  const otpauthUrl = buildOtpauthUrl({ email: user.email, secret })
  const qrDataUrl = await totpQrDataUrl(otpauthUrl)
  return c.json({ secret, otpauthUrl, qrDataUrl })
})

authRoutes.post('/2fa/enable', requireAuth, async (c) => {
  const user = c.get('user')
  const body = z.object({ code: z.string().min(4).max(8) }).safeParse(
    await c.req.json().catch(() => null),
  )
  if (!body.success) return c.json({ error: 'Código inválido.' }, 400)

  const { rows } = await pool.query<{ totp_secret: string | null }>(
    `SELECT totp_secret FROM users WHERE id = $1`,
    [user.id],
  )
  const secret = rows[0]?.totp_secret
  if (!secret) return c.json({ error: 'Primero inicia el setup 2FA.' }, 400)
  if (!(await verifyTotpCode(secret, body.data.code))) {
    return c.json({ error: 'Código incorrecto.' }, 400)
  }
  await pool.query(
    `UPDATE users SET totp_enabled = true, updated_at = now() WHERE id = $1`,
    [user.id],
  )
  return c.json({ ok: true })
})

/** Desvincular: solo código del autenticador (sin password). */
authRoutes.post('/2fa/disable', requireAuth, async (c) => {
  const user = c.get('user')
  const body = z
    .object({
      code: z.string().min(4).max(8),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Datos inválidos.' }, 400)

  const { rows } = await pool.query<{
    totp_secret: string | null
    totp_enabled: boolean
  }>(`SELECT totp_secret, totp_enabled FROM users WHERE id = $1`, [user.id])
  const row = rows[0]
  if (!row?.totp_enabled || !row.totp_secret) {
    return c.json({ error: 'El autenticador no está vinculado.' }, 400)
  }
  if (!(await verifyTotpCode(row.totp_secret, body.data.code))) {
    return c.json({ error: 'Código del autenticador incorrecto.' }, 401)
  }
  await pool.query(
    `UPDATE users SET totp_enabled = false, totp_secret = NULL, updated_at = now() WHERE id = $1`,
    [user.id],
  )
  return c.json({ ok: true })
})
