import { useCatalog } from '@/features/catalog'
import { useCart } from '@/features/cart'
import { useEffect, useRef } from 'react'

/**
 * Sincroniza el carrito con el catálogo: quita slugs/combos que ya no existen.
 *
 * Espera `hasLoadedOnce` para no borrar líneas reales contra mocks iniciales.
 */
export function CartCatalogSync() {
  const { products, offerCombos, hasLoadedOnce } = useCatalog()
  const { syncWithCatalog, ready } = useCart()
  const lastKey = useRef('')

  useEffect(() => {
    if (!ready || !hasLoadedOnce) return
    if (products.length === 0 && offerCombos.length === 0) return
    const key = [
      ...products.map((p) => p.slug).sort(),
      ...offerCombos.map((c) => c.id).sort(),
    ].join('|')
    if (key === lastKey.current) return
    lastKey.current = key
    syncWithCatalog(
      products.map((p) => p.slug),
      offerCombos.map((c) => c.id),
    )
  }, [products, offerCombos, ready, hasLoadedOnce, syncWithCatalog])

  return null
}
