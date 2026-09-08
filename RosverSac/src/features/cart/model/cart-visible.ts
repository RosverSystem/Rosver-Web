import type { Product } from '@/features/catalog'
import type { CartLine } from './mocks'

/** Unidades visibles = líneas cuyo producto existe en el catálogo actual. */
export function visibleCartItemCount(
  lines: CartLine[],
  products: Pick<Product, 'slug'>[],
) {
  const slugs = new Set(products.map((p) => p.slug))
  return lines
    .filter((l) => slugs.has(l.productSlug))
    .reduce((sum, l) => sum + l.quantity, 0)
}
