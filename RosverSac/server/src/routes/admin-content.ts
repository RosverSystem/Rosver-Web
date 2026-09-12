import { Hono } from 'hono'
import { z } from 'zod'
import { pool } from '../db.js'
import { requireAuth, requireRole, type AuthVariables } from '../middleware/auth.js'

/**
 * Default seed for home_hero if no DB row exists yet.
 * Matches the HOME_HERO_SLIDES array used on the React side.
 */
const HOME_HERO_DEFAULT: Record<string, unknown> = {
  slides: [
    {
      id: 'hero-1',
      tag: 'Importación directa',
      title: 'Herramientas y ferretería de calidad',
      subtitle: 'Catálogo actualizado con precios al detalle y por mayor.',
      cta: 'Ver catálogo',
      ctaLink: '/catalogo',
    },
    {
      id: 'hero-2',
      tag: 'B2B y Mayorista',
      title: 'Precios especiales para distribuidores',
      subtitle: 'Solicita tu cotización personalizada y recibe atención directa.',
      cta: 'Cotizar ahora',
      ctaLink: '/cotizar',
    },
  ],
}

/** Public routes — no auth required */
export const contentPublicRoutes = new Hono()

contentPublicRoutes.get('/:key', async (c) => {
  const key = c.req.param('key')
  const { rows } = await pool.query<{ value: unknown }>(
    `SELECT value FROM site_content WHERE key = $1`,
    [key],
  )
  if (rows[0]) return c.json({ key, value: rows[0].value })

  // Auto-seed home_hero on first GET
  if (key === 'home_hero') {
    await pool.query(
      `INSERT INTO site_content (key, value, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (key) DO NOTHING`,
      [key, JSON.stringify(HOME_HERO_DEFAULT)],
    )
    return c.json({ key, value: HOME_HERO_DEFAULT })
  }

  return c.json({ error: 'Contenido no encontrado.' }, 404)
})

/** Admin routes — requireAuth + requireRole('admin') */
export const adminContentRoutes = new Hono<{ Variables: AuthVariables }>()
adminContentRoutes.use('*', requireAuth, requireRole('admin'))

adminContentRoutes.get('/content', async (c) => {
  const { rows } = await pool.query<{ key: string; value: unknown; updated_at: string }>(
    `SELECT key, value, updated_at FROM site_content ORDER BY key`,
  )
  return c.json({ content: rows })
})

adminContentRoutes.get('/content/:key', async (c) => {
  const key = c.req.param('key')
  const { rows } = await pool.query<{ value: unknown; updated_at: string }>(
    `SELECT value, updated_at FROM site_content WHERE key = $1`,
    [key],
  )
  if (rows[0]) return c.json({ key, value: rows[0].value, updatedAt: rows[0].updated_at })

  // Auto-seed home_hero
  if (key === 'home_hero') {
    await pool.query(
      `INSERT INTO site_content (key, value, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (key) DO NOTHING`,
      [key, JSON.stringify(HOME_HERO_DEFAULT)],
    )
    return c.json({ key, value: HOME_HERO_DEFAULT, updatedAt: new Date().toISOString() })
  }
  return c.json({ error: 'Contenido no encontrado.' }, 404)
})

const upsertSchema = z.object({
  value: z.unknown(),
})

adminContentRoutes.patch('/content/:key', async (c) => {
  const key = c.req.param('key')
  const body = upsertSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Datos inválidos.' }, 400)

  await pool.query(
    `INSERT INTO site_content (key, value, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(body.data.value)],
  )
  return c.json({ ok: true })
})
