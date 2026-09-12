/** Combo de oferta (ERP → `/ofertas` → carrito). */

export type OfferComboKind = 'bogo' | 'bundle_fixed' | 'qty_pack'

export type OfferComboItem = {
  productId: string
  productSlug: string
  productName: string
  productSku: string
  imageUrl?: string
  quantity: number
  packagingId?: string
  listPrice?: number | null
  rating?: number
  reviewCount?: number
}

export type OfferCombo = {
  id: string
  code?: number
  sku: string
  slug: string
  name: string
  description?: string
  imageUrl?: string
  kind: OfferComboKind
  buyQty?: number
  payQty?: number
  fixedPrice?: number
  /** Máx. packs de este combo por usuario (undefined = sin límite). */
  maxPerUser?: number
  displayPrice: number | null
  compareAt?: number
  badge?: string
  rating?: number
  reviewCount?: number
  items: OfferComboItem[]
}
