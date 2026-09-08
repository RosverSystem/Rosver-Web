import { useCatalog } from '@/features/catalog'
import { useCart } from '@/features/cart'
import { useEffect, useRef } from 'react'

/**
 * Sincroniza el carrito con el catálogo: quita slugs que ya no existen.
 */
export function CartCatalogSync() {
  const { products } = useCatalog()
  const { syncWithCatalog, ready } = useCart()
  const lastKey = useRef('')

  useEffect(() => {
    if (!ready || products.length === 0) return
    const key = products.map((p) => p.slug).sort().join('|')
    if (key === lastKey.current) return
    lastKey.current = key
    syncWithCatalog(products.map((p) => p.slug))
  }, [products, ready, syncWithCatalog])

  return null
}
