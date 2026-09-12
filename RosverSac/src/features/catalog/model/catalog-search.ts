import type { Product } from '@/features/catalog/model/mocks'

/** Normaliza texto de búsqueda (sin acentos, minúsculas). */
export function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function compactCode(value: string) {
  return normalizeSearchText(value).replace(/[\s\-_.]/g, '')
}

function productSearchBlob(product: Product) {
  const parts = [
    product.name,
    product.sku,
    product.vendor,
    product.description,
    product.category,
    product.origin,
    product.id,
    ...(product.specs?.flatMap((s) => [s.name, s.value, s.key]) ?? []),
    product.code != null ? String(product.code) : '',
    product.code != null
      ? String(Math.max(0, Math.floor(Number(product.code)))).padStart(8, '0')
      : '',
    ...(product.packagings?.map((pk) => pk.label) ?? []),
  ]
  return parts
    .filter(Boolean)
    .map((p) => normalizeSearchText(String(p)))
    .join(' ')
}

/**
 * Coincidencia parcial / mínima: cada token del query debe aparecer
 * en nombre, SKU, marca, descripción, specs, etc.
 */
export function productMatchesQuery(product: Product, rawQuery: string) {
  const q = normalizeSearchText(rawQuery)
  if (!q) return true
  const hay = productSearchBlob(product)
  const tokens = q.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true
  // Tokens: todos deben coincidir (AND). También acepta el query compacto.
  if (tokens.every((t) => hay.includes(t))) return true
  const compact = q.replace(/\s+/g, '')
  return compact.length >= 2 && hay.includes(compact)
}

/**
 * Si el query es un SKU/código exacto (o único), devolver ese producto
 * para abrir ficha directo (ej. SKU213, RS-1042).
 */
export function findExactSkuProduct(
  products: Product[],
  rawQuery: string,
): Product | undefined {
  const q = compactCode(rawQuery)
  if (q.length < 2) return undefined

  const visible = products.filter((p) => p.visible !== false)

  const exact = visible.find((p) => compactCode(p.sku) === q)
  if (exact) return exact

  const byId = visible.find((p) => compactCode(p.id) === q)
  if (byId) return byId

  // Un solo producto cuyo SKU contiene el código completo (mín. 3 chars)
  if (q.length >= 3) {
    const hits = visible.filter((p) => {
      const sku = compactCode(p.sku)
      return sku === q || sku.includes(q)
    })
    if (hits.length === 1) return hits[0]
  }

  return undefined
}

export function filterProductsByQuery(products: Product[], rawQuery: string) {
  const q = normalizeSearchText(rawQuery)
  if (!q) return products
  return products.filter((p) => productMatchesQuery(p, q))
}
