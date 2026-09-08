import { Hono } from 'hono'
import { config } from '../config.js'
import { pool } from '../db.js'
import { hashPassword, pickDefaultAvatar, verifyPassword } from '../lib/crypto.js'
import { issueOtp, verifyOtp } from '../lib/otp.js'
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

  const existing = await pool.query<{ id: string; email_verified_at: Date | null }>(
    `SELECT id, email_verified_at FROM users WHERE email = $1`,
    [data.email],
  )

  let userId: string

  if (existing.rows[0]) {
    // Cuenta ya verificada → correo realmente en uso, se bloquea.
    if (existing.rows[0].email_verified_at) {
      return c.json({ error: 'Ya existe una cuenta con ese correo.' }, 409)
    }
    // Cuenta sin verificar (ej. un intento anterior que no pudo completar
    // el envío del OTP): se retoma el registro en vez de dejar al usuario
    // sin poder registrarse ni verificar.
    userId = existing.rows[0].id
    const passwordHash = await hashPassword(data.password)
    await pool.query(
      `UPDATE users SET password_hash = $2, full_name = $3, phone = $4, updated_at = now()
       WHERE id = $1`,
      [userId, passwordHash, data.fullName, data.phone],
    )
  } else {
    const role = await pool.query<{ id: string }>(
      `SELECT id FROM roles WHERE code = 'client' LIMIT 1`,
    )
    if (!role.rows[0]) {
      return c.json({ error: 'Rol cliente no configurado. Ejecuta el seed.' }, 500)
    }

    const passwordHash = await hashPassword(data.password)
    const avatarUrl = pickDefaultAvatar(data.email)

    const inserted = await pool.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, role_id, full_name, phone, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        data.email,
        passwordHash,
        role.rows[0].id,
        data.fullName,
        data.phone,
        avatarUrl,
      ],
    )
    userId = inserted.rows[0].id
  }

  await issueOtp({ email: data.email, purpose: 'email_verify', userId })

  return c.json({
    ok: true,
    requiresEmailVerification: true,
    email: data.email,
    message: 'Te enviamos un código OTP para verificar tu correo.',
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

  const { rows } = await pool.query<{ id: string }>(
    `UPDATE users SET email_verified_at = now(), updated_at = now()
     WHERE email = $1
     RETURNING id`,
    [parsed.data.email],
  )
  if (!rows[0]) return c.json({ error: 'Usuario no encontrado.' }, 404)

  await createSession(c, rows[0].id)
  const user = await loadUserById(rows[0].id)
  return c.json({ ok: true, user })
})

authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Correo o contraseña inválidos.' }, 400)
  }

  const ip = requestIp(c.req.raw.headers)
  const lock = await loginLimiter.check(parsed.data.email, ip)
  if (lock.locked) {
    return c.json(
      {
        error: `Demasiados intentos. Vuelve a intentar en ${lock.retryAfterSec ?? 300}s.`,
      },
      429,
    )
  }

  const { rows } = await pool.query<{
    id: string
    password_hash: string | null
    email_verified_at: Date | null
    totp_enabled: boolean
    status: string
    role_code: string
  }>(
    `SELECT u.id, u.password_hash, u.email_verified_at, u.totp_enabled, u.status, r.code AS role_code
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.email = $1`,
    [parsed.data.email],
  )

  const row = rows[0]
  if (!row?.password_hash) {
    await loginLimiter.recordFailure(parsed.data.email, ip)
    await recordLoginAttempt({ email: parsed.data.email, ip, success: false, reason: 'bad_credentials' })
    return c.json({ error: 'Correo o contraseña incorrectos.' }, 401)
  }
  const ok = await verifyPassword(row.password_hash, parsed.data.password)
  if (!ok) {
    await loginLimiter.recordFailure(parsed.data.email, ip)
    await recordLoginAttempt({
      userId: row.id,
      email: parsed.data.email,
      ip,
      success: false,
      reason: 'bad_credentials',
    })
    return c.json({ error: 'Correo o contraseña incorrectos.' }, 401)
  }
  await loginLimiter.recordSuccess(parsed.data.email, ip)
  if (row.status !== 'active') {
    await recordLoginAttempt({
      userId: row.id,
      email: parsed.data.email,
      ip,
      success: false,
      reason: 'disabled',
    })
    return c.json({ error: 'Cuenta deshabilitada.' }, 403)
  }

  if (!row.email_verified_at) {
    await issueOtp({
      email: parsed.data.email,
      purpose: 'email_verify',
      userId: row.id,
    })
    return c.json({
      ok: false,
      requiresEmailVerification: true,
      email: parsed.data.email,
      message: 'Verifica tu correo con el código OTP enviado.',
    })
  }

  if (row.totp_enabled) {
    const challengeToken = await createLoginChallenge(row.id, 'totp')
    return c.json({
      ok: false,
      requiresTotp: true,
      challengeToken,
      message: 'Ingresa el código de tu autenticador.',
    })
  }

  await createSession(c, row.id)
  await recordLoginAttempt({ userId: row.id, email: parsed.data.email, ip, success: true })
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
  if (!verifyTotpCode(u.totp_secret, body.data.code)) {
    await recordLoginAttempt({ userId, email: u.email, ip, success: false, reason: 'bad_totp' })
    return c.json({ error: 'Código del autenticador incorrecto.' }, 401)
  }

  await createSession(c, userId)
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

  const { rows } = await pool.query<{ id: string }>(
    `SELECT id FROM users WHERE email = $1`,
    [body.data.email],
  )
  await issueOtp({
    email: body.data.email,
    purpose: body.data.purpose,
    userId: rows[0]?.id,
  })
  return c.json({
    ok: true,
    message: 'Si el correo existe, enviamos un nuevo código.',
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
    `SELECT id, status FROM users WHERE email = $1`,
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
  // Cierra cualquier sesión existente: una contraseña nueva invalida las viejas.
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
  // cookie short-lived state
  c.header(
    'Set-Cookie',
    `google_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
  )
  return c.redirect(url.toString())
})

authRoutes.get('/google/callback', async (c) => {
  if (!config.google.clientId || !config.google.clientSecret) {
    return c.redirect(`${config.appUrl}/login?error=google_not_configured`)
  }

  // Valida el state contra la cookie emitida en /google/start (anti-CSRF).
  const stateParam = c.req.query('state')
  const stateCookie = getCookie(c, 'google_oauth_state')
  deleteCookie(c, 'google_oauth_state', { path: '/' })
  if (!stateParam || !stateCookie || stateParam !== stateCookie) {
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
    verified_email?: boolean
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
      `SELECT id FROM users WHERE email = $1`,
      [email],
    )
    if (byEmail.rows[0]) {
      userId = byEmail.rows[0].id
    } else {
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
  if (!verifyTotpCode(secret, body.data.code)) {
    return c.json({ error: 'Código incorrecto.' }, 400)
  }
  await pool.query(
    `UPDATE users SET totp_enabled = true, updated_at = now() WHERE id = $1`,
    [user.id],
  )
  return c.json({ ok: true })
})

authRoutes.post('/2fa/disable', requireAuth, async (c) => {
  const user = c.get('user')
  const body = z
    .object({
      password: z.string().min(1),
      code: z.string().min(4).max(8),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Datos inválidos.' }, 400)

  const { rows } = await pool.query<{
    password_hash: string | null
    totp_secret: string | null
  }>(`SELECT password_hash, totp_secret FROM users WHERE id = $1`, [user.id])
  const row = rows[0]
  if (!row?.password_hash || !(await verifyPassword(row.password_hash, body.data.password))) {
    return c.json({ error: 'Contraseña incorrecta.' }, 401)
  }
  if (!row.totp_secret || !verifyTotpCode(row.totp_secret, body.data.code)) {
    return c.json({ error: 'Código del autenticador incorrecto.' }, 401)
  }
  await pool.query(
    `UPDATE users SET totp_enabled = false, totp_secret = NULL, updated_at = now() WHERE id = $1`,
    [user.id],
  )
  return c.json({ ok: true })
})
