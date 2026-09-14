/**
 * Paneles del hero multipanel.
 * Sin mocks: paneles solo desde CMS con `imageUrl` real (R2 / CDN).
 * Medidas diseñador: HERO_PANEL_DESIGNER_SPECS + docs/changes/0248.
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

/** Vacío a propósito: no Unsplash ni demos. */
export const HOME_HERO_PANELS: HomeHeroPanel[] = []

export const HOME_HERO_SLIDES: HomeHeroSlide[] = []

/**
 * Solo acepta slides CMS con imagen real (sin relleno mock).
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
