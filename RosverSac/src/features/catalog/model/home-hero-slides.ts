/**
 * Paneles del hero multipanel (estilo strip Katrina → paleta Rosver).
 * Medidas para diseñador: ver docs/changes/0248 + comentario DESIGNER_SPECS abajo.
 */

/** Spec para el diseñador (assets de panel). */
export const HERO_PANEL_DESIGNER_SPECS = {
  /** Ancho × alto por imagen de panel (retrato). */
  panelPx: { width: 800, height: 1200 },
  /** Ratio 2:3 */
  aspect: '2:3',
  /** Zona inferior reservada a título + badge (~25%). Sujeto visual en el 75% superior. */
  safeBottomPercent: 25,
  /** Peso objetivo por archivo WebP. */
  maxKb: 180,
  /** Composición de referencia desktop (opcional master). */
  bannerMasterPx: { width: 1920, height: 720 },
  format: 'WebP (preferido) o JPG',
} as const

export type HomeHeroPanel = {
  id: string
  title: string
  /** Texto mitad izquierda del pill (rojo). Puede llevar \\n. */
  badgeLeft: string
  /** Texto mitad derecha del pill (gris). */
  badgeRight: string
  imageUrl: string
  href?: string
  visible?: boolean
  sortOrder?: number
}

/** CTA fijo del panel izquierdo (oscuro). */
export const HOME_HERO_CTA = {
  title: 'DESPACHOS Y CATÁLOGO OFICIAL',
  ctaLabel: 'Descargar PDF',
} as const

/**
 * @deprecated Preferir HomeHeroPanel. Se mantiene para mapear CMS legado.
 */
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

export const HOME_HERO_PANELS: HomeHeroPanel[] = [
  {
    id: 'PANEL-01',
    sortOrder: 1,
    visible: true,
    title: 'CATÁLOGO DIGITAL 2026',
    badgeLeft: 'Oficial\nRosver',
    badgeRight: 'PDF\nactualizado',
    href: '/catalogo',
    imageUrl:
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&h=1200&q=75',
  },
  {
    id: 'PANEL-02',
    sortOrder: 2,
    visible: true,
    title: 'ENVÍOS A TODO EL PERÚ',
    badgeLeft: 'Agencia\ny courier',
    badgeRight: 'Cobertura\nnacional',
    href: '/contacto',
    imageUrl:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&h=1200&q=75',
  },
  {
    id: 'PANEL-03',
    sortOrder: 3,
    visible: true,
    title: 'IMPORTACIÓN DIRECTA',
    badgeLeft: 'Stock\ncontinuo',
    badgeRight: 'Marcas\nseleccionadas',
    href: '/catalogo',
    imageUrl:
      'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&h=1200&q=75',
  },
  {
    id: 'PANEL-04',
    sortOrder: 4,
    visible: true,
    title: 'PRECIO DESDE UNIDAD',
    badgeLeft: 'Mayorista\ny detalle',
    badgeRight: 'Cotiza\nsin mínimo',
    href: '/cotizar',
    imageUrl:
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&h=1200&q=75',
  },
  {
    id: 'PANEL-05',
    sortOrder: 5,
    visible: true,
    title: 'ASESORÍA COMERCIAL',
    badgeLeft: 'WhatsApp\ny correo',
    badgeRight: 'Respuesta\nrápida',
    href: '/contacto',
    imageUrl:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&h=1200&q=75',
  },
]

/** Legacy slides (admin CMS / fallback map). */
export const HOME_HERO_SLIDES: HomeHeroSlide[] = HOME_HERO_PANELS.map((p) => ({
  id: p.id,
  sortOrder: p.sortOrder,
  visible: p.visible,
  eyebrow: 'Rosver SAC',
  title: p.title,
  subtitle: `${p.badgeLeft.replace(/\n/g, ' ')} · ${p.badgeRight.replace(/\n/g, ' ')}`,
  ctaLabel: 'Ver más',
  ctaTo: p.href ?? '/catalogo',
  imageUrl: p.imageUrl,
}))

export function panelsFromCmsSlides(raw: unknown): HomeHeroPanel[] | null {
  if (!raw || typeof raw !== 'object') return null
  const slides = (raw as { slides?: unknown }).slides
  if (!Array.isArray(slides) || slides.length === 0) return null
  return slides.map((s, i) => {
    const row = s as Record<string, unknown>
    const fallback = HOME_HERO_PANELS[i % HOME_HERO_PANELS.length]
    return {
      id: String(row.id ?? `cms-${i}`),
      title: String(row.title ?? fallback.title).toUpperCase(),
      badgeLeft: row.badgeLeft
        ? String(row.badgeLeft)
        : (fallback?.badgeLeft ?? 'Rosver\nSAC'),
      badgeRight: row.badgeRight
        ? String(row.badgeRight)
        : (fallback?.badgeRight ?? 'Ver\nmás'),
      imageUrl: String(
        row.imageUrl ?? fallback?.imageUrl ?? HOME_HERO_PANELS[0].imageUrl,
      ),
      href: String(row.ctaLink ?? row.href ?? fallback?.href ?? '/catalogo'),
      visible: true,
      sortOrder: i + 1,
    }
  })
}
