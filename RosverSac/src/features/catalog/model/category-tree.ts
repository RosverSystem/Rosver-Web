import type { Category } from '@/features/catalog/model/mocks'

/** Slugs de la categoría y todos sus descendientes (por parentId). */
export function collectDescendantSlugs(
  categories: Category[],
  rootSlug: string,
): Set<string> {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const root = categories.find((c) => c.slug === rootSlug)
  if (!root) return new Set([rootSlug])

  const childrenOf = new Map<string, Category[]>()
  for (const c of categories) {
    const pid = c.parentId ?? ''
    if (!pid) continue
    const list = childrenOf.get(pid) ?? []
    list.push(c)
    childrenOf.set(pid, list)
  }

  const slugs = new Set<string>([root.slug])
  const stack = [root.id]
  while (stack.length) {
    const id = stack.pop()!
    for (const child of childrenOf.get(id) ?? []) {
      slugs.add(child.slug)
      stack.push(child.id)
      // por si parentId apunta a slug inexistente en mapa
      void byId
    }
  }
  return slugs
}

export function productMatchesCategory(
  productCategorySlug: string,
  activeSlug: string | undefined,
  categories: Category[],
): boolean {
  if (!activeSlug) return true
  const allowed = collectDescendantSlugs(categories, activeSlug)
  return allowed.has(productCategorySlug)
}

export function countProductsInCategoryTree(
  categories: Category[],
  rootSlug: string,
  products: { category: string; visible?: boolean }[],
): number {
  const allowed = collectDescendantSlugs(categories, rootSlug)
  return products.filter(
    (p) => p.visible !== false && allowed.has(p.category),
  ).length
}
