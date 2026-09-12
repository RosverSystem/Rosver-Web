import type { Category, Product } from '@/features/catalog/model/mocks'
import type { CatalogPdfProduct, CatalogPdfSection } from './types'

function isRoot(c: Category) {
  return c.parentId == null || c.parentId === ''
}

function packInfo(p: Product): { packKind: string; packQty: string } {
  const packs = p.packagings ?? []
  const def = packs.find((x) => x.isDefault) ?? packs[0]
  if (!def) {
    return {
      packKind: 'Unidad',
      packQty: p.moq > 1 ? `${p.moq} UND` : '1 UND',
    }
  }
  const kind = /caja|paquete|fardo|docena/i.test(def.label)
    ? def.label.split(/\s+/)[0] || 'Paquete'
    : 'Paquete'
  const qty =
    def.contentQty > 1
      ? `${def.contentQty} ${def.unitName || 'UND'}`.toUpperCase()
      : `1 ${(def.unitName || 'UND').toUpperCase()}`
  return { packKind: kind, packQty: qty }
}

function toStub(p: Product): CatalogPdfProduct {
  const pack = packInfo(p)
  const codeLabel =
    p.code != null
      ? String(p.code).padStart(8, '0')
      : p.sku || '—'
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    code: p.code,
    codeLabel,
    price: p.price,
    vendor: p.vendor ?? '',
    imageDataUrl: null,
    categorySlug: p.category,
    packKind: pack.packKind,
    packQty: pack.packQty,
  }
}

/**
 * Agrupa productos visibles por categoría raíz → subcategoría.
 */
export function buildCatalogSections(
  categories: Category[],
  products: Product[],
): CatalogPdfSection[] {
  const visibleCats = categories
    .filter((c) => c.visible !== false)
    .slice()
    .sort(
      (a, b) =>
        (a.sortOrder ?? 999) - (b.sortOrder ?? 999) ||
        a.name.localeCompare(b.name, 'es'),
    )

  const roots = visibleCats.filter(isRoot)
  const byParent = new Map<string, Category[]>()
  for (const c of visibleCats) {
    if (isRoot(c)) continue
    const pid = c.parentId!
    const list = byParent.get(pid) ?? []
    list.push(c)
    byParent.set(pid, list)
  }

  const visibleProducts = products
    .filter((p) => p.visible !== false)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  const used = new Set<string>()
  const sections: CatalogPdfSection[] = []

  for (const root of roots) {
    const children = (byParent.get(root.id) ?? []).slice().sort(
      (a, b) =>
        (a.sortOrder ?? 999) - (b.sortOrder ?? 999) ||
        a.name.localeCompare(b.name, 'es'),
    )
    const subsections: CatalogPdfSection['subsections'] = []

    for (const child of children) {
      const items = visibleProducts.filter((p) => p.category === child.slug)
      if (items.length === 0) continue
      items.forEach((p) => used.add(p.id))
      subsections.push({
        title: child.name,
        slug: child.slug,
        products: items.map(toStub),
      })
    }

    const rootItems = visibleProducts.filter((p) => p.category === root.slug)
    if (rootItems.length > 0) {
      rootItems.forEach((p) => used.add(p.id))
      subsections.unshift({
        title: children.length ? root.name : root.name,
        slug: root.slug,
        products: rootItems.map(toStub),
      })
    }

    if (subsections.length === 0) continue

    const allProducts = subsections.flatMap((s) => s.products)
    const brands = [
      ...new Set(allProducts.map((p) => p.vendor.trim()).filter(Boolean)),
    ].slice(0, 12)

    sections.push({
      title: root.name,
      slug: root.slug,
      tagline: root.tagline,
      imageUrl: root.imageUrl,
      imageDataUrl: null,
      brands,
      subsections,
    })
  }

  const orphan = visibleProducts.filter((p) => !used.has(p.id))
  if (orphan.length > 0) {
    sections.push({
      title: 'Otros productos',
      slug: '_otros',
      imageDataUrl: null,
      brands: [],
      subsections: [
        {
          title: 'Varios',
          slug: '_otros',
          products: orphan.map(toStub),
        },
      ],
    })
  }

  return sections
}
