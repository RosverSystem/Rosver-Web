/**
 * Marcas del Home — logos desde ERP/admin-content en fase lógica.
 * Hoy: nombre + logoUrl opcional (si falta, se muestra wordmark tipográfico).
 */
export type Brand = {
  id: string
  name: string
  logoUrl?: string
  href?: string
  visible?: boolean
  sortOrder?: number
}

export const BRANDS: Brand[] = [
  { id: 'BR-01', name: 'Truper', sortOrder: 1, visible: true },
  { id: 'BR-02', name: 'Stanley', sortOrder: 2, visible: true },
  { id: 'BR-03', name: 'Makita', sortOrder: 3, visible: true },
  { id: 'BR-04', name: 'Bosch', sortOrder: 4, visible: true },
  { id: 'BR-05', name: 'DeWalt', sortOrder: 5, visible: true },
  { id: 'BR-06', name: '3M', sortOrder: 6, visible: true },
  { id: 'BR-07', name: 'Ingco', sortOrder: 7, visible: true },
  { id: 'BR-08', name: 'Total', sortOrder: 8, visible: true },
]
