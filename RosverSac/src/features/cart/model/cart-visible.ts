import type { Product } from '@/features/catalog'
import type { CartLine } from './mocks'
import { isComboLine } from './mocks'

/** Unidades visibles = productos en catálogo + combos (siempre si tienen id). */
export function visibleCartItemCount(
  lines: CartLine[],
  products: Pick<Product, 'slug'>[],
  comboIds?: string[],
) {
  const slugs = new Set(products.map((p) => p.slug))
  const combos = comboIds != null ? new Set(comboIds) : null
  return lines
    .filter((l) => {
      if (isComboLine(l)) {
        if (combos == null) return true
        return Boolean(l.comboId && combos.has(l.comboId))
      }
      return slugs.has(l.productSlug)
    })
    .reduce((sum, l) => sum + l.quantity, 0)
}
