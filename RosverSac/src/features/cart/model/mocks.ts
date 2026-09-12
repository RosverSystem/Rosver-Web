import type { OfferComboKind } from '@/features/catalog/model/offer-combo'

export type CartComboNestedItem = {
  productSlug: string
  productName: string
  productSku?: string
  quantity: number
  packagingId?: string
  listPrice?: number | null
}

/** Snapshot congelado al agregar al carrito (histórico en pedido/cotización). */
export type CartComboSnapshot = {
  kind: OfferComboKind
  buyQty?: number
  payQty?: number
  fixedPrice?: number | null
  items: CartComboNestedItem[]
}

export type CartLine = {
  /** Default `product` si falta (carritos viejos). */
  lineKind?: 'product' | 'combo'
  productSlug: string
  quantity: number
  packagingId?: string
  packagingLabel?: string
  /** Precio unitario congelado al agregar (producto o precio del pack). */
  unitPrice?: number | null
  /** Solo combos */
  comboId?: string
  comboName?: string
  comboSku?: string
  comboImageUrl?: string
  comboKind?: OfferComboKind
  comboItems?: CartComboNestedItem[]
  comboSnapshot?: CartComboSnapshot
  /** Tope de packs por usuario (congelado al agregar). */
  maxPerUser?: number | null
}

export function isComboLine(line: CartLine): boolean {
  return line.lineKind === 'combo' && Boolean(line.comboId)
}
