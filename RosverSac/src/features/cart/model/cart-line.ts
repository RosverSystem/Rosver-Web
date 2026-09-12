import type { OfferCombo } from '@/features/catalog/model/offer-combo'
import type { Product } from '@/features/catalog'
import type { AddCartItemInput } from './cart-store'
import type { CartLine } from './mocks'
import { isComboLine } from './mocks'

/**
 * Arma una línea de carrito desde un producto del catálogo (empaque default + precio).
 */
export function addInputFromProduct(
  product: Product,
  quantity = 1,
  packagingId?: string,
): AddCartItemInput {
  const packs = product.packagings ?? []
  const pack = packagingId
    ? packs.find((p) => p.id === packagingId)
    : (packs.find((p) => p.isDefault) ?? packs[0])
  const unitPrice = pack
    ? (pack.offerPrice ?? pack.listPrice ?? product.price)
    : product.price

  return {
    lineKind: 'product',
    productSlug: product.slug,
    quantity: Math.max(1, quantity),
    packagingId: pack?.id,
    packagingLabel: pack?.label,
    unitPrice: unitPrice ?? null,
  }
}

/** Línea de carrito = 1 combo (precio del pack). */
export function addInputFromCombo(
  combo: OfferCombo,
  quantity = 1,
): AddCartItemInput {
  const nested = combo.items.map((it) => ({
    productSlug: it.productSlug,
    productName: it.productName,
    productSku: it.productSku,
    quantity: it.quantity,
    packagingId: it.packagingId,
    listPrice: it.listPrice,
  }))

  return {
    lineKind: 'combo',
    productSlug: combo.slug,
    quantity: Math.max(1, quantity),
    unitPrice: combo.displayPrice,
    comboId: combo.id,
    comboName: combo.name,
    comboSku: combo.sku,
    comboImageUrl: combo.imageUrl,
    comboKind: combo.kind,
    comboItems: nested,
    comboSnapshot: {
      kind: combo.kind,
      buyQty: combo.buyQty,
      payQty: combo.payQty,
      fixedPrice: combo.fixedPrice ?? null,
      items: nested,
    },
    maxPerUser: combo.maxPerUser ?? null,
  }
}

export function unitPriceOfLine(
  line: CartLine,
  product?: Product | null,
): number | null {
  if (line.unitPrice !== undefined && line.unitPrice !== null) {
    return line.unitPrice
  }
  if (line.unitPrice === null) return null
  if (isComboLine(line)) return line.unitPrice ?? null
  return product?.price ?? null
}

/** Payload API pedido/cotización desde una línea de carrito. */
export function cartLineToApiItem(
  line: CartLine,
  product?: Product | null,
): {
  lineKind: 'product' | 'combo'
  productSlug: string
  productName: string
  presentation: string
  quantity: number
  unitPrice: number | null
  comboId?: string
  comboSnapshot?: CartLine['comboSnapshot']
} {
  if (isComboLine(line)) {
    return {
      lineKind: 'combo',
      productSlug: line.productSlug,
      productName: line.comboName || line.productSlug,
      presentation: 'Combo',
      quantity: line.quantity,
      unitPrice: line.unitPrice ?? null,
      comboId: line.comboId,
      comboSnapshot: line.comboSnapshot,
    }
  }
  return {
    lineKind: 'product',
    productSlug: product?.slug ?? line.productSlug,
    productName: product?.name ?? line.productSlug,
    presentation: line.packagingLabel?.slice(0, 40) || 'UND',
    quantity: line.quantity,
    unitPrice: unitPriceOfLine(line, product),
  }
}
