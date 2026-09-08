import { Hono } from 'hono'
import { z } from 'zod'
import { pool } from '../db.js'
import { revokeAllSessionsForUser } from '../lib/session.js'
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from '../middleware/auth.js'
import { validateUuidParams } from '../middleware/validate-params.js'

export const adminUsersRoutes = new Hono<{ Variables: AuthVariables }>()

adminUsersRoutes.use('*', requireAuth, requireRole('admin'))
adminUsersRoutes.use('/users/:id', validateUuidParams('id'))

type UserRow = {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string
  role_code: string
  role_name: string
  status: string
  email_verified_at: string | null
  created_at: string
}

adminUsersRoutes.get('/users', async (c) => {
  const { rows } = await pool.query<UserRow>(
    `SELECT u.id, u.email, u.full_name, u.phone, u.avatar_url,
            r.code AS role_code, r.name AS role_name,
            u.status, u.email_verified_at, u.created_at
     FROM users u
     JOIN roles r ON r.id = u.role_id
     ORDER BY u.created_at DESC`,
  )
  return c.json({
    users: rows.map((row) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      phone: row.phone,
      avatarUrl: row.avatar_url,
      roleCode: row.role_code,
      roleName: row.role_name,
      status: row.status,
      emailVerified: row.email_verified_at !== null,
      createdAt: row.created_at,
    })),
  })
})

const updateUserSchema = z.object({
  roleId: z.string().uuid().optional(),
  status: z.enum(['active', 'disabled']).optional(),
})

adminUsersRoutes.patch('/users/:id', async (c) => {
  const targetId = c.req.param('id')
  const actingUser = c.get('user')

  const body = updateUserSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: body.error.issues[0]?.message ?? 'Datos inválidos.' }, 400)
  }
  if (!body.data.roleId && !body.data.status) {
    return c.json({ error: 'Nada que actualizar.' }, 400)
  }

  if (targetId === actingUser.id) {
    if (body.data.status === 'disabled') {
      return c.json({ error: 'No puedes desactivar tu propia cuenta.' }, 400)
    }
    if (body.data.roleId) {
      const { rows } = await pool.query<{ code: string }>(
        `SELECT code FROM roles WHERE id = $1`,
        [body.data.roleId],
      )
      if (rows[0]?.code !== 'admin') {
        return c.json({ error: 'No puedes quitarte el rol de administrador.' }, 400)
      }
    }
  }

  if (body.data.roleId) {
    const roleCheck = await pool.query<{ code: string }>(
      `SELECT code FROM roles WHERE id = $1`,
      [body.data.roleId],
    )
    if (!roleCheck.rows[0]) {
      return c.json({ error: 'Rol no encontrado.' }, 404)
    }
  }

  const sets: string[] = []
  const values: unknown[] = []
  let i = 1
  if (body.data.roleId) {
    sets.push(`role_id = $${i++}`)
    values.push(body.data.roleId)
  }
  if (body.data.status) {
    sets.push(`status = $${i++}`)
    values.push(body.data.status)
  }
  values.push(targetId)

  const { rows } = await pool.query<{ id: string }>(
    `UPDATE users SET ${sets.join(', ')}, updated_at = now()
     WHERE id = $${i} RETURNING id`,
    values,
  )
  if (!rows[0]) return c.json({ error: 'Usuario no encontrado.' }, 404)

  if (body.data.status === 'disabled') {
    await revokeAllSessionsForUser(targetId)
  }

  return c.json({ ok: true })
})

type LoginAuditRow = {
  id: string
  user_id: string | null
  email: string
  ip: string | null
  success: boolean
  reason: string | null
  created_at: string
}

adminUsersRoutes.get('/login-audit', async (c) => {
  const limit = Math.min(Math.max(Number(c.req.query('limit')) || 100, 1), 500)
  const { rows } = await pool.query<LoginAuditRow>(
    `SELECT id, user_id, email, ip, success, reason, created_at
     FROM login_audit
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit],
  )
  return c.json({
    entries: rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      email: row.email,
      ip: row.ip,
      success: row.success,
      reason: row.reason,
      createdAt: row.created_at,
    })),
  })
})
