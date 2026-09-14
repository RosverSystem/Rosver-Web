import { Hono } from 'hono'
import { z } from 'zod'
import { pool } from '../db.js'
import { requireAuth, requireRole, type AuthVariables } from '../middleware/auth.js'

const slideSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().trim().min(1).max(120),
  badgeLeft: z.string().trim().min(1).max(80),
  badgeRight: z.string().trim().min(1).max(80),
  imageUrl: z.string().trim().min(1).max(2000),
  linkType: z.enum(['none', 'category', 'product', 'custom']).default('none'),
  categoryId: z.string().uuid().nullable().optional(),
  subcategoryId: z.string().uuid().nullable().optional(),
  productId: z.string().uuid().nullable().optional(),
  customHref: z.string().trim().max(300).nullable().optional(),
  /** Ruta resuelta en admin al guardar (ej. /catalogo/escolar). */
  href: z.string().trim().max(300).nullable().optional(),
  visible: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
})

const homeHeroSchema = z.object({
  ctaTitle: z.string().trim().min(1).max(120).default('DESPACHOS Y CATÁLOGO OFICIAL'),
  ctaLabel: z.string().trim().min(1).max(60).default('Descargar PDF'),
  autoplayMs: z.number().int().min(0).max(60_000).default(5000),
  slides: z.array(slideSchema).max(24),
})

export type HomeHeroValue = z.infer<typeof homeHeroSchema>

const HOME_HERO_DEFAULT: HomeHeroValue = {
  ctaTitle: 'DESPACHOS Y CATÁLOGO OFICIAL',
  ctaLabel: 'Descargar PDF',
  autoplayMs: 5000,
  slides: [
    {
      id: 'hero-01',
      title: 'CATÁLOGO DIGITAL 2026',
      badgeLeft: 'Directa\nDescarga PDF',
      badgeRight: 'Lista Completa\nB2B',
      imageUrl:
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&h=1200&q=72',
      linkType: 'custom',
      customHref: '/catalogo',
      href: '/catalogo',
      visible: true,
      sortOrder: 1,
    },
    {
      id: 'hero-02',
      title: 'ENVÍOS AGENCIA SHALOM',
      badgeLeft: 'Hoy mismo\nDespacho diario',
      badgeRight: 'A Todo\nel Perú',
      imageUrl:
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&h=1200&q=72',
      linkType: 'custom',
      customHref: '/contacto',
      href: '/contacto',
      visible: true,
      sortOrder: 2,
    },
    {
      id: 'hero-03',
      title: 'FLETES AGENCIA MARVISUR',
      badgeLeft: 'Tarifa B2B\nPreferencial',
      badgeRight: 'Envíos\nProvinciales',
      imageUrl:
        'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=800&h=1200&q=72',
      linkType: 'custom',
      customHref: '/contacto',
      href: '/contacto',
      visible: true,
      sortOrder: 3,
    },
    {
      id: 'hero-04',
      title: 'COURIER PUERTA A PUERTA',
      badgeLeft: 'Llega mañana\nLima y Callao',
      badgeRight: 'Entrega\nExpress',
      imageUrl:
        'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=800&h=1200&q=72',
      linkType: 'custom',
      customHref: '/contacto',
      href: '/contacto',
      visible: true,
      sortOrder: 4,
    },
  ],
}

function coerceSlides(rawSlides: unknown[]): unknown[] {
  return rawSlides.map((item, i) => {
    if (!item || typeof item !== 'object') return item
    const row = item as Record<string, unknown>
    const href = String(row.href ?? row.ctaLink ?? row.customHref ?? '').trim()
    return {
      id: String(row.id ?? `hero-${i + 1}`),
      title: String(row.title ?? 'Rosver'),
      badgeLeft: String(row.badgeLeft ?? row.cta ?? 'Rosver\nSAC'),
      badgeRight: String(row.badgeRight ?? 'Ver\nmás'),
      imageUrl: String(row.imageUrl ?? ''),
      linkType:
        row.linkType === 'category' ||
        row.linkType === 'product' ||
        row.linkType === 'custom' ||
        row.linkType === 'none'
          ? row.linkType
          : href
            ? 'custom'
            : 'none',
      categoryId: row.categoryId ?? null,
      subcategoryId: row.subcategoryId ?? null,
      productId: row.productId ?? null,
      customHref: row.customHref ?? (href || null),
      href: href || null,
      visible: row.visible !== false,
      sortOrder:
        typeof row.sortOrder === 'number' ? row.sortOrder : i + 1,
    }
  })
}

function normalizeHeroValue(raw: unknown): HomeHeroValue {
  const parsed = homeHeroSchema.safeParse(raw)
  if (parsed.success) return parsed.data
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.slides)) {
      const merged = homeHeroSchema.safeParse({
        ctaTitle: obj.ctaTitle ?? HOME_HERO_DEFAULT.ctaTitle,
        ctaLabel: obj.ctaLabel ?? HOME_HERO_DEFAULT.ctaLabel,
        autoplayMs: obj.autoplayMs ?? HOME_HERO_DEFAULT.autoplayMs,
        slides: coerceSlides(obj.slides),
      })
      if (merged.success) {
        // Descartar slides sin imagen (legado incompleto)
        const slides = merged.data.slides.filter((s) => s.imageUrl.trim())
        if (slides.length) return { ...merged.data, slides }
      }
    }
  }
  return HOME_HERO_DEFAULT
}

async function ensureHomeHero(): Promise<HomeHeroValue> {
  const { rows } = await pool.query<{ value: unknown }>(
    `SELECT value FROM site_content WHERE key = 'home_hero'`,
  )
  if (rows[0]) {
    const value = normalizeHeroValue(rows[0].value)
    // Si quedó vacío (seed antiguo), rehidratar demos
    if (!value.slides.length) {
      await pool.query(
        `UPDATE site_content SET value = $1, updated_at = now() WHERE key = 'home_hero'`,
        [JSON.stringify(HOME_HERO_DEFAULT)],
      )
      return HOME_HERO_DEFAULT
    }
    return value
  }
  await pool.query(
    `INSERT INTO site_content (key, value, updated_at)
     VALUES ('home_hero', $1, now())
     ON CONFLICT (key) DO NOTHING`,
    [JSON.stringify(HOME_HERO_DEFAULT)],
  )
  return HOME_HERO_DEFAULT
}

/** Public routes — no auth required */
export const contentPublicRoutes = new Hono()

contentPublicRoutes.get('/:key', async (c) => {
  const key = c.req.param('key')
  if (key === 'home_hero') {
    const value = await ensureHomeHero()
    return c.json({ key, value })
  }
  const { rows } = await pool.query<{ value: unknown }>(
    `SELECT value FROM site_content WHERE key = $1`,
    [key],
  )
  if (rows[0]) return c.json({ key, value: rows[0].value })
  return c.json({ error: 'Contenido no encontrado.' }, 404)
})

/** Admin routes — requireAuth + requireRole('admin') */
export const adminContentRoutes = new Hono<{ Variables: AuthVariables }>()
adminContentRoutes.use('*', requireAuth, requireRole('admin'))

adminContentRoutes.get('/content', async (c) => {
  const { rows } = await pool.query<{
    key: string
    value: unknown
    updated_at: string
  }>(`SELECT key, value, updated_at FROM site_content ORDER BY key`)
  return c.json({ content: rows })
})

adminContentRoutes.get('/content/:key', async (c) => {
  const key = c.req.param('key')
  if (key === 'home_hero') {
    const value = await ensureHomeHero()
    return c.json({ key, value, updatedAt: new Date().toISOString() })
  }
  const { rows } = await pool.query<{ value: unknown; updated_at: string }>(
    `SELECT value, updated_at FROM site_content WHERE key = $1`,
    [key],
  )
  if (rows[0]) {
    return c.json({
      key,
      value: rows[0].value,
      updatedAt: rows[0].updated_at,
    })
  }
  return c.json({ error: 'Contenido no encontrado.' }, 404)
})

adminContentRoutes.patch('/content/:key', async (c) => {
  const key = c.req.param('key')
  const body = z
    .object({ value: z.unknown() })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Datos inválidos.' }, 400)

  let value = body.data.value
  if (key === 'home_hero') {
    const parsed = homeHeroSchema.safeParse(body.data.value)
    if (!parsed.success) {
      return c.json(
        {
          error:
            parsed.error.issues[0]?.message ??
            'Datos del slider inválidos.',
        },
        400,
      )
    }
    value = parsed.data
  }

  await pool.query(
    `INSERT INTO site_content (key, value, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)],
  )
  return c.json({ ok: true, value })
})
