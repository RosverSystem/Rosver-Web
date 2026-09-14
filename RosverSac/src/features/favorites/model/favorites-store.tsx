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
  count: number
  loading: boolean
  isFavorite: (productId: string) => boolean
  toggleFavorite: (input: {
    productId?: string
    slug?: string
  }) => Promise<{ favorited: boolean; productId: string }>
  refresh: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [ids, setIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setIds(new Set())
      return
    }
    setLoading(true)
    try {
      const res = await api<{ ok: boolean; ids: string[] }>('/api/favorites/ids')
      setIds(new Set(res.ids ?? []))
    } catch {
      setIds(new Set())
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return
    void refresh()
  }, [authLoading, refresh])

  const isFavorite = useCallback(
    (productId: string) => ids.has(productId),
    [ids],
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
      }>('/api/favorites/toggle', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      setIds(new Set(res.ids ?? []))
      return { favorited: res.favorited, productId: res.productId }
    },
    [user],
  )

  const value = useMemo<FavoritesContextValue>(
    () => ({
      ids,
      count: ids.size,
      loading,
      isFavorite,
      toggleFavorite,
      refresh,
    }),
    [ids, loading, isFavorite, toggleFavorite, refresh],
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
