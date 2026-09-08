import { createMiddleware } from 'hono/factory'

// Forma general 8-4-4-4-12 en hex, sin exigir versión/variante RFC4122:
// Postgres acepta cualquier UUID con esa forma (incluido el UUID nulo),
// así que validar de más rechazaría valores que la DB sí aceptaría.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Valida que uno o más params de ruta sean UUID antes de tocar la DB.
 * Sin esto, un id con formato inválido (ej. "not-a-uuid") llega directo a
 * `pool.query(..., [id])`, Postgres lo rechaza con un error no controlado
 * y termina en 500 genérico en vez de un 400 claro.
 */
export function validateUuidParams(...names: string[]) {
  return createMiddleware(async (c, next) => {
    for (const name of names) {
      const value = c.req.param(name)
      if (!value || !UUID_RE.test(value)) {
        return c.json({ error: `Identificador inválido (${name}).` }, 400)
      }
    }
    await next()
  })
}
