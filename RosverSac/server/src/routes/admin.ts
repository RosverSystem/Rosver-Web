import { Hono } from 'hono'
import { z } from 'zod'
import { pool } from '../db.js'
import {
  ensureModule,
  ensureModulePermissions,
  grantPermissionsToRole,
} from '../lib/rbac.js'
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from '../middleware/auth.js'

export const adminRoutes = new Hono<{ Variables: AuthVariables }>()

adminRoutes.use('*', requireAuth, requireRole('admin'))

adminRoutes.get('/health', (c) =>
  c.json({ ok: true, panel: 'SystemRSV', user: c.get('user').email }),
)

adminRoutes.get('/roles', async (c) => {
  const { rows } = await pool.query(
    `SELECT r.id, r.code, r.name, r.description, r.is_system,
            COALESCE(json_agg(p.code) FILTER (WHERE p.code IS NOT NULL), '[]') AS permissions
     FROM roles r
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     LEFT JOIN permissions p ON p.id = rp.permission_id
     GROUP BY r.id
     ORDER BY r.is_system DESC, r.name`,
  )
  return c.json({ roles: rows })
})

adminRoutes.get('/permissions', async (c) => {
  const { rows } = await pool.query(
    `SELECT id, module, action, code, description
     FROM permissions ORDER BY module, action`,
  )
  return c.json({ permissions: rows })
})

adminRoutes.post('/roles', async (c) => {
  const body = z
    .object({
      code: z
        .string()
        .trim()
        .min(2)
        .max(40)
        .regex(/^[a-z0-9_]+$/, 'Código: solo minúsculas, números y _'),
      name: z.string().trim().min(2).max(80),
      description: z.string().trim().max(200).optional(),
      permissionCodes: z.array(z.string()).default([]),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: body.error.issues[0]?.message ?? 'Datos inválidos' }, 400)
  }

  try {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO roles (code, name, description, is_system)
       VALUES ($1, $2, $3, false)
       RETURNING id`,
      [body.data.code, body.data.name, body.data.description ?? null],
    )
    await grantPermissionsToRole(rows[0].id, body.data.permissionCodes)
    return c.json({ ok: true, id: rows[0].id })
  } catch {
    return c.json({ error: 'Ese código de rol ya existe.' }, 409)
  }
})

adminRoutes.post('/roles/:id/permissions', async (c) => {
  const roleId = c.req.param('id')
  const body = z
    .object({ permissionCodes: z.array(z.string()) })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Datos inválidos.' }, 400)

  await pool.query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId])
  await grantPermissionsToRole(roleId, body.data.permissionCodes)
  return c.json({ ok: true })
})

adminRoutes.post('/modules', async (c) => {
  const body = z
    .object({
      code: z
        .string()
        .trim()
        .min(2)
        .max(60)
        .regex(/^[a-z0-9_.]+$/),
      name: z.string().trim().min(2).max(80),
      description: z.string().optional(),
      actions: z
        .array(z.string())
        .default(['read', 'create', 'update', 'delete', 'manage']),
    })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: body.error.issues[0]?.message ?? 'Datos inválidos' }, 400)
  }

  await ensureModule(body.data.code, body.data.name, body.data.description)
  await ensureModulePermissions(body.data.code, body.data.actions)

  // Auto-grant new module permissions to admin role
  const admin = await pool.query<{ id: string }>(
    `SELECT id FROM roles WHERE code = 'admin' LIMIT 1`,
  )
  if (admin.rows[0]) {
    const codes = body.data.actions.map((a) => `${body.data.code}.${a}`)
    await grantPermissionsToRole(admin.rows[0].id, codes)
  }

  return c.json({
    ok: true,
    message: `Módulo ${body.data.code} registrado con permisos generados.`,
  })
})
