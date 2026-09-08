import type { Product } from '@/features/catalog'
import type { AddCartItemInput } from './cart-store'

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
    productSlug: product.slug,
    quantity: Math.max(1, quantity),
    packagingId: pack?.id,
    packagingLabel: pack?.label,
    unitPrice: unitPrice ?? null,
  }
}

export function unitPriceOfLine(
  line: {
    unitPrice?: number | null
  },
  product: Product,
): number | null {
  if (line.unitPrice !== undefined) return line.unitPrice
  return product.price
}
