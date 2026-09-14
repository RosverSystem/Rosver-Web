/**
 * Paneles del hero multipanel (referencia Katrina → Rosver).
 * Medidas: HERO_PANEL_DESIGNER_SPECS + docs/architecture/06-banners-hero-y-assets.md
 *
 * Demo local: 4 paneles con foto hasta que CMS / R2 tenga assets finales.
 * CMS real: `panelsFromCmsSlides` solo acepta imageUrl no-Unsplash.
 */

export const HERO_PANEL_DESIGNER_SPECS = {
  panelPx: { width: 800, height: 1200 },
  aspect: '2:3',
  safeBottomPercent: 25,
  maxKb: 180,
  bannerMasterPx: { width: 1920, height: 720 },
  format: 'WebP (preferido) o JPG',
} as const

export type HomeHeroPanel = {
  id: string
  title: string
  badgeLeft: string
  badgeRight: string
  imageUrl: string
  href?: string
  visible?: boolean
  sortOrder?: number
}

export const HOME_HERO_CTA = {
  title: 'DESPACHOS Y CATÁLOGO OFICIAL',
  ctaLabel: 'Descargar PDF',
} as const

/** @deprecated Preferir HomeHeroPanel. */
export type HomeHeroSlide = {
  id: string
  eyebrow?: string
  title: string
  titleAccent?: string
  subtitle: string
  ctaLabel: string
  ctaTo: string
  imageUrl: string
  visible?: boolean
  sortOrder?: number
}

/**
 * Demo visual (estructura del ejemplo Katrina, paleta Rosver).
 * Sustituir por fotos propias 800×1200 en CMS / R2 (P134).
 */
export const HOME_HERO_PANELS: HomeHeroPanel[] = [
  {
    id: 'hero-01',
    title: 'CATÁLOGO DIGITAL 2026',
    badgeLeft: 'Directa\nDescarga PDF',
    badgeRight: 'Lista Completa\nB2B',
    imageUrl:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&h=1200&q=72',
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
    href: '/contacto',
    visible: true,
    sortOrder: 4,
  },
]

export const HOME_HERO_SLIDES: HomeHeroSlide[] = []

/**
 * Slides CMS con imagen real. Si el CMS trae Unsplash, se ignora esa fila
 * (el demo local cubre hasta tener assets R2).
 */
export function panelsFromCmsSlides(raw: unknown): HomeHeroPanel[] | null {
  if (!raw || typeof raw !== 'object') return null
  const slides = (raw as { slides?: unknown }).slides
  if (!Array.isArray(slides) || slides.length === 0) return null

  const mapped: HomeHeroPanel[] = []
  for (let i = 0; i < slides.length; i++) {
    const row = slides[i] as Record<string, unknown>
    const imageUrl = String(row.imageUrl ?? '').trim()
    if (!imageUrl) continue
    if (/unsplash\.com/i.test(imageUrl)) continue

    mapped.push({
      id: String(row.id ?? `cms-${i}`),
      title: String(row.title ?? 'Rosver').toUpperCase(),
      badgeLeft: row.badgeLeft ? String(row.badgeLeft) : 'Rosver\nSAC',
      badgeRight: row.badgeRight ? String(row.badgeRight) : 'Ver\nmás',
      imageUrl,
      href: String(row.ctaLink ?? row.href ?? '/catalogo'),
      visible: true,
      sortOrder: i + 1,
    })
  }

  return mapped.length ? mapped : null
}
