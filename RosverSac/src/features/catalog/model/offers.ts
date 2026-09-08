import type { Product } from '@/features/catalog/model/mocks'
import { PRODUCTS } from '@/features/catalog/model/mocks'

/** Producto en oferta: precio oferta activo o precio anterior mayor. */
export function isOfferProduct(p: Product): boolean {
  if (p.visible === false) return false
  if (p.offerPrice != null && p.price != null) return true
  return (
    p.price !== null &&
    typeof p.originalPrice === 'number' &&
    p.originalPrice > p.price
  )
}

export function getOfferProducts(products: Product[] = PRODUCTS): Product[] {
  return products
    .filter(isOfferProduct)
    .slice()
    .sort((a, b) => discountPercent(b) - discountPercent(a))
}

export function discountPercent(p: Product): number {
  if (p.price === null || !p.originalPrice) return 0
  return Math.round(100 - (p.price / p.originalPrice) * 100)
}

export function offerSavings(p: Product): number {
  if (p.price === null || !p.originalPrice) return 0
  return Math.round((p.originalPrice - p.price) * 100) / 100
}

const CAMPAIGN_BY_CATEGORY: Record<string, string> = {
  herramientas: 'Campaña herramientas',
  ferreteria: 'Lote ferretería',
  electronica: 'Novedad viral',
  hogar: 'Campaña hogar',
  textil: 'Oferta textil',
  iluminacion: 'Flash iluminación',
  limpieza: 'Promo limpieza',
  construccion: 'Campaña escolar',
}

/** Etiqueta de campaña mock (fase visual). */
export function offerCampaignTag(p: Product): string {
  return CAMPAIGN_BY_CATEGORY[p.category] ?? 'Oferta Rosver'
}
