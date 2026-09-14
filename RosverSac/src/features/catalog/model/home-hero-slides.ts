/**
 * Paneles del hero multipanel (referencia Katrina → Rosver).
 * Medidas: HERO_PANEL_DESIGNER_SPECS + docs/architecture/06-banners-hero-y-assets.md
 *
 * Fuente de verdad en prod: CMS `/api/content/home_hero` (módulo Slider).
 * Fallback local: HOME_HERO_PANELS si la API no responde.
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
  linkType?: 'none' | 'category' | 'product' | 'custom'
  categoryId?: string | null
  subcategoryId?: string | null
  productId?: string | null
  customHref?: string | null
}

export type HomeHeroCms = {
  ctaTitle: string
  ctaLabel: string
  autoplayMs: number
  panels: HomeHeroPanel[]
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
 * Se usa solo si no hay CMS o falla la red.
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
 * Parsea el valor CMS `home_hero` → paneles + meta CTA / autoplay.
 */
export function homeHeroFromCms(raw: unknown): HomeHeroCms | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const slides = obj.slides
  if (!Array.isArray(slides)) return null

  const panels: HomeHeroPanel[] = []
  for (let i = 0; i < slides.length; i++) {
    const row = slides[i] as Record<string, unknown>
    const imageUrl = String(row.imageUrl ?? '').trim()
    if (!imageUrl) continue
    const visible = row.visible !== false
    if (!visible) continue

    const hrefRaw = String(row.href ?? row.ctaLink ?? row.customHref ?? '').trim()
    panels.push({
      id: String(row.id ?? `cms-${i}`),
      title: String(row.title ?? 'Rosver').toUpperCase(),
      badgeLeft: row.badgeLeft
        ? String(row.badgeLeft)
        : row.cta
          ? String(row.cta)
          : 'Rosver\nSAC',
      badgeRight: row.badgeRight ? String(row.badgeRight) : 'Ver\nmás',
      imageUrl,
      href: hrefRaw || undefined,
      visible: true,
      sortOrder:
        typeof row.sortOrder === 'number' ? row.sortOrder : i + 1,
      linkType:
        row.linkType === 'category' ||
        row.linkType === 'product' ||
        row.linkType === 'custom' ||
        row.linkType === 'none'
          ? row.linkType
          : hrefRaw
            ? 'custom'
            : 'none',
      categoryId: row.categoryId ? String(row.categoryId) : null,
      subcategoryId: row.subcategoryId ? String(row.subcategoryId) : null,
      productId: row.productId ? String(row.productId) : null,
      customHref: row.customHref ? String(row.customHref) : null,
    })
  }

  panels.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  const autoplayMs =
    typeof obj.autoplayMs === 'number' && obj.autoplayMs >= 0
      ? obj.autoplayMs
      : 5000

  return {
    ctaTitle: String(obj.ctaTitle ?? HOME_HERO_CTA.title),
    ctaLabel: String(obj.ctaLabel ?? HOME_HERO_CTA.ctaLabel),
    autoplayMs,
    panels,
  }
}

/** @deprecated Usar homeHeroFromCms. */
export function panelsFromCmsSlides(raw: unknown): HomeHeroPanel[] | null {
  const cms = homeHeroFromCms(raw)
  return cms?.panels.length ? cms.panels : null
}
