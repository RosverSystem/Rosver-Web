import { useCatalog } from '@/features/catalog'
import { useCart } from '@/features/cart'
import { useEffect } from 'react'

/**
 * Sincroniza el carrito con el catálogo vivo: quita slugs que ya no existen
 * (evita badge/banner con unidades fantasma del seed mock).
 */
export function CartCatalogSync() {
  const { products, liveProducts, refreshing } = useCatalog()
  const { syncWithCatalog, ready } = useCart()

  useEffect(() => {
    if (!ready || refreshing) return
    // Con catálogo live o mocks cargados: siempre hay lista usable.
    if (products.length === 0 && liveProducts) return
    syncWithCatalog(products.map((p) => p.slug))
  }, [products, liveProducts, refreshing, ready, syncWithCatalog])

  return null
}
