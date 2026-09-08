import { useCatalog } from '@/features/catalog'
import { useCart } from '@/features/cart'
import { useEffect, useRef } from 'react'

/**
 * Sincroniza el carrito con el catálogo: quita slugs que ya no existen.
 *
 * `products` arranca en los mocks estáticos (ver CatalogProvider) mientras
 * se resuelve el fetch real a /api/catalog. Si se sincroniza contra esos
 * mocks, cualquier producto real que no esté en la lista mock (slugs
 * distintos) se borra del carrito del cliente antes de que lleguen los
 * datos reales — vacía el carrito en cada carga completa de página. Por
 * eso se espera a `hasLoadedOnce` (primer fetch ya resuelto, éxito o no).
 */
export function CartCatalogSync() {
  const { products, hasLoadedOnce } = useCatalog()
  const { syncWithCatalog, ready } = useCart()
  const lastKey = useRef('')

  useEffect(() => {
    if (!ready || !hasLoadedOnce || products.length === 0) return
    const key = products.map((p) => p.slug).sort().join('|')
    if (key === lastKey.current) return
    lastKey.current = key
    syncWithCatalog(products.map((p) => p.slug))
  }, [products, ready, hasLoadedOnce, syncWithCatalog])

  return null
}
