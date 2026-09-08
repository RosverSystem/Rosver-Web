import {
  CATEGORIES,
  PRODUCTS,
  type Category,
  type Product,
} from '@/features/catalog/model/mocks'
import { api } from '@/shared/lib/api'
import { IconWrench } from '@/shared/ui/icons'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'

type ApiCategory = {
  id: string
  slug: string
  name: string
  parentId?: string | null
  imageUrl?: string
  visible?: boolean
  sortOrder?: number
  showInNav?: boolean
}

type CatalogPayload = {
  live?: boolean
  updatedAt?: string
  products?: Product[]
  categories?: ApiCategory[]
}

type CatalogContextValue = {
  products: Product[]
  categories: Category[]
  live: boolean
  updatedAt: string | null
  refreshing: boolean
  refresh: () => Promise<void>
}

const CatalogContext = createContext<CatalogContextValue | null>(null)

function hydrateCategories(raw: ApiCategory[]): Category[] {
  return raw.map((c) => {
    const mock = CATEGORIES.find((m) => m.slug === c.slug)
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      icon: mock?.icon ?? IconWrench,
      imageUrl: c.imageUrl ?? mock?.imageUrl,
      visible: c.visible ?? true,
      sortOrder: c.sortOrder ?? mock?.sortOrder ?? 0,
      parentId: c.parentId ?? null,
      showInNav: c.showInNav ?? true,
    }
  })
}

function wantsCatalogRefresh(pathname: string) {
  return (
    pathname === '/' ||
    pathname.startsWith('/catalogo') ||
    pathname.startsWith('/ofertas') ||
    pathname.startsWith('/producto') ||
    pathname.startsWith('/carrito') ||
    pathname.startsWith('/cotizar')
  )
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const [products, setProducts] = useState<Product[]>(PRODUCTS)
  const [categories, setCategories] = useState<Category[]>(CATEGORIES)
  const [live, setLive] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const data = await api<CatalogPayload>('/api/catalog')
      if (data.live && Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products)
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(hydrateCategories(data.categories))
        }
        setLive(true)
        setUpdatedAt(data.updatedAt ?? new Date().toISOString())
      } else {
        setProducts(PRODUCTS)
        setCategories(CATEGORIES)
        setLive(false)
        setUpdatedAt(data.updatedAt ?? null)
      }
    } catch {
      setProducts(PRODUCTS)
      setCategories(CATEGORIES)
      setLive(false)
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!wantsCatalogRefresh(pathname)) return
    void refresh()
  }, [pathname, refresh])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return
      if (!wantsCatalogRefresh(window.location.pathname)) return
      void refresh()
    }
    window.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', onVis)
    return () => {
      window.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', onVis)
    }
  }, [refresh])

  useEffect(() => {
    if (!pathname.startsWith('/catalogo') && !pathname.startsWith('/ofertas')) {
      return
    }
    const id = window.setInterval(() => {
      void refresh()
    }, 45_000)
    return () => window.clearInterval(id)
  }, [pathname, refresh])

  const value = useMemo(
    () => ({ products, categories, live, updatedAt, refreshing, refresh }),
    [products, categories, live, updatedAt, refreshing, refresh],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) {
    return {
      products: PRODUCTS,
      categories: CATEGORIES,
      live: false,
      updatedAt: null,
      refreshing: false,
      refresh: async () => {},
    } satisfies CatalogContextValue
  }
  return ctx
}
