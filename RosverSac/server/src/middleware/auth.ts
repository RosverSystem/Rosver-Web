import { createMiddleware } from 'hono/factory'
import type { AuthUser } from '../lib/session.js'
import { resolveSessionUser } from '../lib/session.js'

export type AuthVariables = {
  user: AuthUser
}

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const user = await resolveSessionUser(c)
    if (!user) {
      return c.json({ error: 'Debes iniciar sesión.' }, 401)
    }
    c.set('user', user)
    await next()
  },
)

export function requirePermission(code: string) {
  return createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const user = c.get('user')
    if (!user?.permissions.includes(code)) {
      return c.json({ error: 'No tienes permiso para esta acción.' }, 403)
    }
    await next()
  })
}

export function requireRole(...codes: string[]) {
  return createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const user = c.get('user')
    if (!user || !codes.includes(user.roleCode)) {
      return c.json({ error: 'Acceso restringido a este rol.' }, 403)
    }
    await next()
  })
}
