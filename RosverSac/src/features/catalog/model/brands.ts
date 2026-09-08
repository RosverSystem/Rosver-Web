/**
 * Marcas del Home — fuente de verdad: tabla `brands` (admin /api/catalog).
 * Fallback local si la DB aún no tiene marcas.
 */
export type Brand = {
  id: string
  name: string
  logoUrl?: string
  href?: string
  visible?: boolean
  /** Franja «Marcas que importamos» */
  showOnHome?: boolean
  sortOrder?: number
}

/** Orden alineado al marquee de referencia (Bosch → Makita). */
export const BRANDS: Brand[] = [
  { id: 'BR-01', name: 'Bosch', sortOrder: 1, visible: true, showOnHome: true },
  { id: 'BR-02', name: 'DeWalt', sortOrder: 2, visible: true, showOnHome: true },
  { id: 'BR-03', name: '3M', sortOrder: 3, visible: true, showOnHome: true },
  { id: 'BR-04', name: 'Ingco', sortOrder: 4, visible: true, showOnHome: true },
  { id: 'BR-05', name: 'Total', sortOrder: 5, visible: true, showOnHome: true },
  { id: 'BR-06', name: 'Truper', sortOrder: 6, visible: true, showOnHome: true },
  { id: 'BR-07', name: 'Stanley', sortOrder: 7, visible: true, showOnHome: true },
  { id: 'BR-08', name: 'Makita', sortOrder: 8, visible: true, showOnHome: true },
]
