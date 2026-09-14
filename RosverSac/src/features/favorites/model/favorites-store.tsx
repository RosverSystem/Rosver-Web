import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/features/auth'
import { api, ApiError } from '@/shared/lib/api'

type FavoritesContextValue = {
  ids: Set<string>
  slugs: Set<string>
  count: number
  loading: boolean
  /** true si el id UUID o el slug está en favoritos. */
  isFavorite: (productIdOrSlug: string) => boolean
  toggleFavorite: (input: {
    productId?: string
    slug?: string
  }) => Promise<{ favorited: boolean; productId: string }>
  refresh: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

function applyKeys(
  ids: string[] | undefined,
  slugs: string[] | undefined,
  setIds: (s: Set<string>) => void,
  setSlugs: (s: Set<string>) => void,
) {
  setIds(new Set(ids ?? []))
  setSlugs(new Set(slugs ?? []))
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [ids, setIds] = useState<Set<string>>(new Set())
  const [slugs, setSlugs] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setIds(new Set())
      setSlugs(new Set())
      return
    }
    setLoading(true)
    try {
      const res = await api<{
        ok: boolean
        ids: string[]
        slugs?: string[]
      }>('/api/favorites/ids')
      applyKeys(res.ids, res.slugs, setIds, setSlugs)
    } catch {
      setIds(new Set())
      setSlugs(new Set())
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return
    void refresh()
  }, [authLoading, refresh])

  const isFavorite = useCallback(
    (productIdOrSlug: string) =>
      ids.has(productIdOrSlug) || slugs.has(productIdOrSlug),
    [ids, slugs],
  )

  const toggleFavorite = useCallback(
    async (input: { productId?: string; slug?: string }) => {
      if (!user) {
        throw new ApiError('Inicia sesión para guardar favoritos.', 401)
      }
      const res = await api<{
        ok: boolean
        favorited: boolean
        productId: string
        ids: string[]
        slugs?: string[]
      }>('/api/favorites/toggle', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      applyKeys(res.ids, res.slugs, setIds, setSlugs)
      return { favorited: res.favorited, productId: res.productId }
    },
    [user],
  )

  const value = useMemo<FavoritesContextValue>(
    () => ({
      ids,
      slugs,
      count: ids.size,
      loading,
      isFavorite,
      toggleFavorite,
      refresh,
    }),
    [ids, slugs, loading, isFavorite, toggleFavorite, refresh],
  )

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) {
    throw new Error('useFavorites debe usarse dentro de FavoritesProvider')
  }
  return ctx
}

/** Opcional: no falla fuera del provider (preview admin). */
export function useOptionalFavorites() {
  return useContext(FavoritesContext)
}
