import { pool } from '../db.js'

const DEFAULT_ACTIONS = ['read', 'create', 'update', 'delete', 'manage'] as const

export async function ensureModule(
  code: string,
  name: string,
  description?: string,
) {
  await pool.query(
    `INSERT INTO modules (code, name, description)
     VALUES ($1, $2, $3)
     ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name`,
    [code, name, description ?? null],
  )
}

/** Regla: cada módulo genera su tabla de permisos (actions). */
export async function ensureModulePermissions(
  module: string,
  actions: readonly string[] = DEFAULT_ACTIONS,
  labels?: Record<string, string>,
) {
  for (const action of actions) {
    const permCode = `${module}.${action}`
    const description = labels?.[action] ?? `${action} en ${module}`
    await pool.query(
      `INSERT INTO permissions (module, action, code, description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description`,
      [module, action, permCode, description],
    )
  }
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const { rows } = await pool.query<{ code: string }>(
    `SELECT p.code
     FROM users u
     JOIN role_permissions rp ON rp.role_id = u.role_id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE u.id = $1
     ORDER BY p.code`,
    [userId],
  )
  return rows.map((r) => r.code)
}

export async function userHasPermission(userId: string, code: string) {
  const perms = await getUserPermissions(userId)
  return perms.includes(code)
}

export async function grantAllPermissionsToRole(roleId: string) {
  await pool.query(
    `INSERT INTO role_permissions (role_id, permission_id)
     SELECT $1, p.id FROM permissions p
     ON CONFLICT DO NOTHING`,
    [roleId],
  )
}

export async function grantPermissionsToRole(
  roleId: string,
  codes: string[],
) {
  if (codes.length === 0) return
  await pool.query(
    `INSERT INTO role_permissions (role_id, permission_id)
     SELECT $1, p.id FROM permissions p WHERE p.code = ANY($2::text[])
     ON CONFLICT DO NOTHING`,
    [roleId, codes],
  )
}
